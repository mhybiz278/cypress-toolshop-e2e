#!/usr/bin/env bash
#
# Bring up the application under test, seed it, and wait until it is genuinely
# answering — then hand over to the suite.
#
# Readiness is asserted from *outside* the containers, over the same HTTP
# interface the tests use, rather than by waiting on Docker's own health
# checks. Two reasons, both learned the hard way:
#
#   1. The API answers 500 until its database has been migrated, so a health
#      check that asks it for products can only pass *after* the seed — while
#      `docker compose up --wait` waits before it. That is a deadlock.
#   2. A container health check reports one bit: healthy, or not. When it says
#      "not" on a CI runner and "yes" on a laptop, there is nothing to debug.
#      Polling from here prints the status code on every attempt and dumps the
#      container logs on failure, so a red build explains itself.
#
#   npm run app:up
#
set -euo pipefail

API_URL="${CYPRESS_API_URL:-http://localhost:8091}"
UI_URL="${CYPRESS_BASE_URL:-http://localhost:4200}"

# Print what the stack is doing, then give up. Called from every wait below.
bail() {
  echo ""
  echo "==> $1" >&2
  echo ""
  echo "--- docker compose ps ---" >&2
  docker compose ps >&2 || true
  echo "--- container logs (last 80 lines each) ---" >&2
  docker compose logs --tail 80 >&2 || true
  exit 1
}

# Any HTTP status at all means nginx and php-fpm are talking to each other.
# The response itself is allowed to be a 500 here: that is what the API returns
# until the database exists, and creating it is the next step.
wait_for_http() {
  local name=$1 url=$2 attempts=$3 status
  echo "==> Waiting for ${name} to accept connections (${url})"
  for attempt in $(seq 1 "$attempts"); do
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url") || status=000
    if [ "$status" != "000" ]; then
      echo "    answered HTTP ${status} on attempt ${attempt}"
      return 0
    fi
    echo "    attempt ${attempt}/${attempts}: no connection yet"
    sleep 5
  done
  bail "${name} never accepted a connection"
}

wait_for_status() {
  local name=$1 url=$2 expected=$3 attempts=$4 status=000
  echo "==> Waiting for ${name} to answer ${expected} (${url})"
  for attempt in $(seq 1 "$attempts"); do
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url") || status=000
    if [ "$status" = "$expected" ]; then
      echo "    answered ${status} on attempt ${attempt}"
      return 0
    fi
    echo "    attempt ${attempt}/${attempts}: HTTP ${status}"
    sleep 5
  done
  bail "${name} never answered ${expected} (last status ${status})"
}

echo "==> Starting the database"
docker compose up -d --wait mariadb

echo "==> Starting the API"
docker compose up -d laravel-api

# nginx serves the application's code out of a volume that the API container
# populates when it boots. Docker only copies image content into a named volume
# while that volume is empty, so starting both at once is a race: if nginx wins
# it, the volume is claimed empty and every request 404s for the life of the
# stack. Starting the API first and waiting for its front controller to land
# makes the order explicit instead of lucky.
echo "==> Waiting for the application code to reach the shared volume"
code_ready=false
for attempt in $(seq 1 60); do
  if docker compose exec -T laravel-api test -f /var/www/public/index.php; then
    echo "    front controller present on attempt ${attempt}"
    code_ready=true
    break
  fi
  echo "    attempt ${attempt}/60: not there yet"
  sleep 5
done
[ "$code_ready" = true ] || bail "The API never populated /var/www in the shared volume"

echo "==> Starting the web server and the storefront"
docker compose up -d web angular-ui

wait_for_http "the API" "${API_URL}/products" 60

echo "==> Seeding the database"
# The API image copies its code into a shared volume on boot, so `artisan` is
# not callable the instant the container is running. Retry rather than sleep on
# a guess.
seeded=false
for attempt in $(seq 1 30); do
  if docker compose exec -T laravel-api php artisan migrate:fresh --seed --force; then
    seeded=true
    break
  fi
  echo "    artisan not ready yet (attempt ${attempt}/30), retrying in 5s"
  sleep 5
done
[ "$seeded" = true ] || bail "The API never accepted a migrate command"

# The API caches responses for a couple of minutes. A re-seed changes every id
# underneath that cache, so without this the storefront renders brand and
# category filters whose ids no longer exist — which shows up as a catalogue
# spec failing on an element that is genuinely not there.
echo "==> Clearing the API's response cache"
docker compose exec -T laravel-api php artisan cache:clear || true

wait_for_status "the API" "${API_URL}/products" 200 60
wait_for_status "the storefront" "${UI_URL}" 200 90

echo ""
echo "==> Ready. UI on ${UI_URL}, API on ${API_URL}"
docker compose ps

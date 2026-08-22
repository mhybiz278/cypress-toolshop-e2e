#!/usr/bin/env bash
#
# Bring up the application under test and seed it.
#
# The order matters, and not for a cosmetic reason. The web container's health
# check asks the API for products, and the API answers 500 until its database
# has been migrated — so `docker compose up --wait` on its own deadlocks: it
# waits for a container that cannot become healthy until a command runs, and
# that command runs after the wait. Seeding has to happen *between* the
# containers starting and their health being waited on.
#
#   npm run app:up
#
set -euo pipefail

echo "==> Starting the database"
docker compose up -d --wait mariadb

echo "==> Starting the application containers"
docker compose up -d laravel-api web angular-ui

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
  echo "    API not ready yet (attempt ${attempt}/30), retrying in 5s"
  sleep 5
done

if [ "$seeded" != true ]; then
  echo "==> The API never became ready. Recent logs:" >&2
  docker compose logs --tail 50 laravel-api >&2
  exit 1
fi

echo "==> Waiting for every service to report healthy"
docker compose up -d --wait

echo "==> Ready. UI on http://localhost:4200, API on http://localhost:8091"

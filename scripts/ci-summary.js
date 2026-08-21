#!/usr/bin/env node
/**
 * Turn the run's Mochawesome JSON into a Markdown summary.
 *
 * Written to $GITHUB_STEP_SUMMARY so the workflow page answers "what broke?"
 * without downloading an artefact and opening it in a browser. Printed to
 * stdout when run locally.
 *
 *   node scripts/ci-summary.js [reportDir]
 */

const fs = require('fs');
const path = require('path');

const reportDir = process.argv[2] || path.join('cypress', 'reports');
const jsonDir = path.join(reportDir, '.jsons');

/** @returns {object[]} every mochawesome document produced by the run */
function readReports() {
  if (!fs.existsSync(jsonDir)) return [];
  return fs
    .readdirSync(jsonDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8')));
}

/** Mochawesome nests suites; a spec's tests can live at any depth. */
function collectTests(suite, acc = []) {
  (suite.tests || []).forEach((test) => acc.push(test));
  (suite.suites || []).forEach((child) => collectTests(child, acc));
  return acc;
}

function specRows(reports) {
  const rows = [];
  reports.forEach((report) => {
    (report.results || []).forEach((result) => {
      const tests = collectTests(result);
      if (!tests.length) return;
      rows.push({
        spec: result.file.replace(/^cypress\/e2e\//, ''),
        passed: tests.filter((t) => t.pass).length,
        failed: tests.filter((t) => t.fail).length,
        skipped: tests.filter((t) => t.pending || t.skipped).length,
        duration: tests.reduce((sum, t) => sum + (t.duration || 0), 0),
        failures: tests.filter((t) => t.fail).map((t) => ({
          title: t.fullTitle,
          error: (t.err && t.err.message ? t.err.message : '').split('\n')[0].slice(0, 300)
        }))
      });
    });
  });
  return rows.sort((a, b) => a.spec.localeCompare(b.spec));
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

function render(rows) {
  const total = rows.reduce(
    (acc, row) => ({
      passed: acc.passed + row.passed,
      failed: acc.failed + row.failed,
      skipped: acc.skipped + row.skipped,
      duration: acc.duration + row.duration
    }),
    { passed: 0, failed: 0, skipped: 0, duration: 0 }
  );

  const lines = [];
  const verdict = total.failed ? '❌ Failed' : '✅ Passed';
  lines.push(`## ${verdict} — ${total.passed}/${total.passed + total.failed} tests, ${seconds(total.duration)}`);
  lines.push('');

  const failing = rows.filter((row) => row.failed);
  if (failing.length) {
    lines.push('### Failures');
    lines.push('');
    failing.forEach((row) => {
      row.failures.forEach((failure) => {
        lines.push(`- **${row.spec}** — ${failure.title}`);
        if (failure.error) lines.push(`  \`${failure.error}\``);
      });
    });
    lines.push('');
  }

  lines.push('<details><summary>Per-spec breakdown</summary>');
  lines.push('');
  lines.push('| Spec | Passed | Failed | Skipped | Time |');
  lines.push('| --- | ---: | ---: | ---: | ---: |');
  rows.forEach((row) => {
    lines.push(
      `| ${row.spec} | ${row.passed} | ${row.failed || ''} | ${row.skipped || ''} | ${seconds(row.duration)} |`
    );
  });
  lines.push('');
  lines.push('</details>');
  lines.push('');

  return lines.join('\n');
}

const reports = readReports();
if (!reports.length) {
  console.error(`No Mochawesome JSON found in ${jsonDir} — did the run produce a report?`);
  process.exit(0);
}

const markdown = render(specRows(reports));
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}
console.log(markdown);

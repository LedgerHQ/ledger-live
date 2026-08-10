#!/usr/bin/env node
"use strict";

/**
 * Build the Slack `chat.postMessage` payload for an E2E test report (mobile or desktop).
 *
 * Shared by the mobile (`report-on-slack`) and desktop (`notify-to-slack`) e2e workflows.
 * `modelFromEnv` reads the flat scalar inputs the composite forwards via `env:`; a row is
 * included only when its `label` is non-empty (that is how callers drop a platform, e.g.
 * mobile `tests_type: iOS Only` or desktop single-device runs). `buildSlackPayload` turns
 * the model into the Slack Block Kit attachment.
 *
 * Run locally: node build-slack-payload.js   (prints a sample payload built from the env)
 * From actions/github-script: require this file, call buildSlackPayload(modelFromEnv(process.env)).
 */

const GREEN = "#33FF39";
const RED = "#FF333C";
const GREY = "#808080";

/**
 * Build the list of result rows from ROW{1,2}_* env vars. A row with an empty label is skipped.
 * @param {NodeJS.ProcessEnv} env
 */
function rowsFromEnv(env) {
  const rows = [];
  for (const i of [1, 2]) {
    const label = env[`ROW${i}_LABEL`];
    if (!label) continue;
    rows.push({
      emoji: env[`ROW${i}_EMOJI`] || "",
      label,
      flags: env[`ROW${i}_FLAGS`] || "",
      // Rendered as " · <device>" after the feature flags (mobile). Desktop leaves this empty
      // and bakes the device into the label instead (e.g. "linux (nanoSP)").
      device: env[`ROW${i}_DEVICE`] || "",
      summary: env[`ROW${i}_SUMMARY`] || "No test results",
      reportUrl: env[`ROW${i}_REPORT_URL`] || "",
      status: env[`ROW${i}_STATUS`] || "",
      missingShards: env[`ROW${i}_MISSING_SHARDS`] || "",
      qaaUrl: env[`ROW${i}_QAA_URL`] || "",
    });
  }
  return rows;
}

/**
 * Assemble the message model from the flat env vars forwarded by the composite.
 * @param {NodeJS.ProcessEnv} env
 */
function modelFromEnv(env) {
  const smokeSuffix = env.SMOKE_TESTS === "true" ? " (Smoke Tests)" : "";
  const extraField = env.EXTRA_FIELD_TITLE
    ? { title: env.EXTRA_FIELD_TITLE, url: env.EXTRA_FIELD_URL || "" }
    : null;
  return {
    product: env.PRODUCT || "",
    ref: env.REF || "",
    smokeSuffix,
    headerDevices: env.HEADER_DEVICES || "",
    runUrl: env.RUN_URL || "",
    rows: rowsFromEnv(env),
    extraField,
  };
}

/** `<emoji> <label> · FF '<flags>'[ · <device>] : <summary>` */
function resultLine(row) {
  const deviceMid = row.device ? ` · ${row.device}` : "";
  return `${row.emoji} ${row.label} · FF '${row.flags}'${deviceMid} : ${row.summary}`;
}

/**
 * Green only when every included row succeeded. Red when any included row did not — a failure
 * OR a missing status (e.g. a dual run where one device produced no results): a rendered row that
 * reports nothing must not be able to leave the bar green. Grey only when no included row reported
 * any status at all (e.g. a single-device desktop run with no results).
 */
function attachmentColor(rows) {
  if (rows.length === 0 || rows.every(r => !r.status)) return GREY;
  return rows.every(r => r.status === "success") ? GREEN : RED;
}

/**
 * @param {ReturnType<typeof modelFromEnv>} model
 * @returns {{ text: string, attachments: Array<object> }} Slack payload without `channel`.
 */
function buildSlackPayload(model) {
  const { product, ref, smokeSuffix, headerDevices, runUrl, rows, extraField } = model;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `:ledger-logo: ${product} tests results on ${ref} - ${headerDevices}${smokeSuffix}`,
        emoji: true,
      },
    },
    { type: "divider" },
  ];

  for (const row of rows) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: resultLine(row) },
    });
  }

  for (const row of rows) {
    if (!row.missingShards) continue;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `⚠️ *Warning*: ${row.label} - Missing results for shard(s): ${row.missingShards}.`,
      },
    });
  }

  blocks.push({ type: "divider" });

  // Primary call to action: the new QAA Allure portal — one green button per row with a report.
  const qaaRows = rows.filter(row => row.qaaUrl);
  if (qaaRows.length > 0) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "🆕 *New QAA Allure report*" },
    });
    blocks.push({
      type: "actions",
      elements: qaaRows.map((row, i) => ({
        type: "button",
        text: { type: "plain_text", text: `${row.emoji} ${row.label}`, emoji: true },
        url: row.qaaUrl,
        style: "primary",
        action_id: `qaa_report_${i}`,
      })),
    });
  }

  // Secondary links demoted to one muted line: legacy Allure per row, workflow run, optional extra.
  const secondary = [];
  const legacyLinks = rows
    .filter(row => row.reportUrl)
    .map(row => `<${row.reportUrl}|${row.emoji} ${row.label}>`);
  if (legacyLinks.length > 0) secondary.push(`Legacy Allure: ${legacyLinks.join(" · ")}`);
  secondary.push(`<${runUrl}|⚙️ Workflow run>`);
  if (extraField) secondary.push(`<${extraField.url}|${extraField.title}>`);
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: secondary.join("   ·   ") }],
  });

  return {
    text: " ",
    attachments: [
      {
        color: attachmentColor(rows),
        fallback: `${product} tests results on ${ref}${smokeSuffix}`,
        blocks,
      },
    ],
  };
}

module.exports = { modelFromEnv, buildSlackPayload };

if (require.main === module) {
  const payload = buildSlackPayload(modelFromEnv(process.env));
  console.log(JSON.stringify(payload, null, 2));
}

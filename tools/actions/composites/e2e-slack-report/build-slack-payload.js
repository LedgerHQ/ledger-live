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
      reportTitle: env[`ROW${i}_REPORT_TITLE`] || "Allure Report",
      reportLinkText: env[`ROW${i}_REPORT_LINK_TEXT`] || "Allure Report",
      status: env[`ROW${i}_STATUS`] || "",
      missingShards: env[`ROW${i}_MISSING_SHARDS`] || "",
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
    ? {
        title: env.EXTRA_FIELD_TITLE,
        url: env.EXTRA_FIELD_URL || "",
        linkText: env.EXTRA_FIELD_LINK_TEXT || env.EXTRA_FIELD_TITLE,
      }
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

/** Allure link field, with a "No Allure Report" fallback when no URL is available. */
function allureField(row) {
  const text = row.reportUrl
    ? `*${row.reportTitle}*\n<${row.reportUrl}|${row.reportLinkText}>`
    : `*${row.reportTitle}*\nNo Allure Report`;
  return { type: "mrkdwn", text };
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

  const infoFields = rows.map(allureField);
  infoFields.push({
    type: "mrkdwn",
    text: `*Workflow*\n<${runUrl}|Workflow run>`,
  });
  blocks.push({ type: "divider" });
  blocks.push({ type: "section", fields: infoFields });

  if (extraField) {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*${extraField.title}*\n<${extraField.url}|${extraField.linkText}>`,
        },
      ],
    });
  }

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

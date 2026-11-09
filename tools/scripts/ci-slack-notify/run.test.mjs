// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSlackPayload, buildSuccessPayload, fetchFailedJobs, runNotify } from "./run.mjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a fetchImpl that serves GitHub job pages and captures Slack calls. */
function makeFetch(githubJobs) {
  const slackPayloads = [];
  const fetchImpl = async (url, opts) => {
    if (new URL(url).hostname === "api.github.com") {
      // Return all jobs on page 1, empty on page 2 → terminates pagination
      const page = Number(new URL(url).searchParams.get("page") ?? 1);
      return { ok: true, json: async () => ({ jobs: page === 1 ? githubJobs : [] }) };
    }
    slackPayloads.push(JSON.parse(opts.body));
    return { status: 200, text: async () => JSON.stringify({ ok: true }) };
  };
  return { fetchImpl, slackPayloads };
}

const CODEOWNERS = `
* @LedgerHQ/cloud-wallet @LedgerHQ/coin-integration
libs/coin-modules/coin-evm/ @ledgerhq/coin-integration
libs/coin-modules/coin-tezos/ @ledgerhq/ledger-partner-hoodies @ledgerhq/ledger-third-party-leads
`.trim();

const ownerChannels = {
  "@ledgerhq/coin-integration": "C_COIN_INTEG",
  "@ledgerhq/ledger-partner-hoodies": "C_HOODIES",
};

const baseEnv = {
  GITHUB_REPOSITORY: "LedgerHQ/coin-modules",
  GITHUB_RUN_ID: "999",
  GITHUB_TOKEN: "gh-token",
  SLACK_BOT_TOKEN: "slack-token",
  LIVE_REPO_HEALTH_CHANNEL: "C_HEALTH",
  WORKFLOW_CONCLUSION: "failure",
};

const libraryJob = {
  name: "🧪 Libraries - Integration Tests",
  html_url: "https://github.com/LedgerHQ/coin-modules/actions/runs/999/jobs/1",
  conclusion: "failure",
};

const silentLog = { log: () => {} };

// ---------------------------------------------------------------------------
// buildSlackPayload
// ---------------------------------------------------------------------------

test("buildSlackPayload - shows module names in text", () => {
  const payload = buildSlackPayload({
    channel: "C_TEST",
    runUrl: "https://github.com/run/1",
    modules: ["coin-tezos"],
  });
  assert.match(payload.text, /coin-tezos/);
  assert.doesNotMatch(payload.text, /@LedgerHQ/);
});

test("buildSlackPayload - no branch suffix in text", () => {
  const payload = buildSlackPayload({
    channel: "C_TEST",
    runUrl: "https://github.com/run/1",
    modules: [],
  });
  assert.doesNotMatch(payload.text, /\(main\)/);
  assert.doesNotMatch(payload.text, /`main`/);
});

test("buildSlackPayload - omits module suffix when modules is empty", () => {
  const payload = buildSlackPayload({
    channel: "C_TEST",
    runUrl: "https://github.com/run/1",
    modules: [],
  });
  assert.doesNotMatch(payload.text, / — /);
});

test("buildSlackPayload - joins multiple modules with comma", () => {
  const payload = buildSlackPayload({
    channel: "C_TEST",
    runUrl: "https://github.com/run/1",
    modules: ["coin-tezos", "coin-xrp"],
  });
  assert.match(payload.text, /coin-tezos, coin-xrp/);
});

// ---------------------------------------------------------------------------
// buildSuccessPayload
// ---------------------------------------------------------------------------

test("buildSuccessPayload - no branch suffix in text", () => {
  const payload = buildSuccessPayload({ channel: "C_TEST", runUrl: "https://github.com/run/1" });
  assert.doesNotMatch(payload.text, /\(main\)/);
  assert.doesNotMatch(payload.text, /`main`/);
  assert.match(payload.text, /CI passed on coin-modules/);
});

// ---------------------------------------------------------------------------
// fetchFailedJobs
// ---------------------------------------------------------------------------

test("fetchFailedJobs - returns failed jobs excluding notify-slack", async () => {
  const { fetchImpl } = makeFetch([
    { name: "🧪 Libraries - Integration Tests", html_url: "https://ci/1", conclusion: "failure" },
    { name: "📣 Notify Slack", html_url: "https://ci/2", conclusion: "failure" },
    { name: "🏗️ Build", html_url: "https://ci/3", conclusion: "success" },
  ]);
  const jobs = await fetchFailedJobs({
    repository: "org/repo",
    runId: "1",
    token: "tok",
    fetchImpl,
  });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].name, "🧪 Libraries - Integration Tests");
});

test("fetchFailedJobs - excludes jobs matching notify slack case-insensitively", async () => {
  const { fetchImpl } = makeFetch([
    { name: "notify slack", html_url: "https://ci/1", conclusion: "failure" },
    { name: "NOTIFY SLACK", html_url: "https://ci/2", conclusion: "failure" },
  ]);
  const jobs = await fetchFailedJobs({
    repository: "org/repo",
    runId: "1",
    token: "tok",
    fetchImpl,
  });
  assert.equal(jobs.length, 0);
});

// ---------------------------------------------------------------------------
// runNotify
// ---------------------------------------------------------------------------

test("runNotify - success sends only to health channel", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([]);
  await runNotify({
    env: { ...baseEnv, WORKFLOW_CONCLUSION: "success" },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  assert.equal(slackPayloads.length, 1);
  assert.equal(slackPayloads[0].channel, "C_HEALTH");
  assert.match(slackPayloads[0].text, /CI passed/);
});

test("runNotify - tezos failure notifies health + BST3, NOT coin-integration", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  await runNotify({
    env: { ...baseEnv, FAILED_PACKAGES: "coin-tezos" },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channels = slackPayloads.map(p => p.channel);
  assert.ok(channels.includes("C_HEALTH"), "health channel should be notified");
  assert.ok(channels.includes("C_HOODIES"), "BST3 channel should be notified");
  assert.ok(!channels.includes("C_COIN_INTEG"), "coin-integration should NOT be notified");
});

test("runNotify - coin-evm failure notifies health + coin-integration, NOT BST3", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  await runNotify({
    env: { ...baseEnv, FAILED_PACKAGES: "coin-evm" },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channels = slackPayloads.map(p => p.channel);
  assert.ok(channels.includes("C_HEALTH"), "health channel should be notified");
  assert.ok(channels.includes("C_COIN_INTEG"), "coin-integration should be notified");
  assert.ok(!channels.includes("C_HOODIES"), "BST3 should NOT be notified");
});

test("runNotify - unknown package falls back to health channel only", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  await runNotify({
    env: { ...baseEnv, FAILED_PACKAGES: "" },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channels = slackPayloads.map(p => p.channel);
  assert.deepEqual(channels, ["C_HEALTH"]);
});

test("runNotify - multiple packages from different teams each get their own channel", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  await runNotify({
    env: { ...baseEnv, FAILED_PACKAGES: "coin-tezos,coin-evm" },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channels = slackPayloads.map(p => p.channel);
  assert.ok(channels.includes("C_HEALTH"));
  assert.ok(channels.includes("C_HOODIES"));
  assert.ok(channels.includes("C_COIN_INTEG"));
  // Health gets all modules; each team gets only its own
  const healthPayload = slackPayloads.find(p => p.channel === "C_HEALTH");
  assert.match(healthPayload.text, /coin-tezos/);
  assert.match(healthPayload.text, /coin-evm/);
  const hoodiesPayload = slackPayloads.find(p => p.channel === "C_HOODIES");
  assert.match(hoodiesPayload.text, /coin-tezos/);
  assert.doesNotMatch(hoodiesPayload.text, /coin-evm/);
  const coinIntegPayload = slackPayloads.find(p => p.channel === "C_COIN_INTEG");
  assert.match(coinIntegPayload.text, /coin-evm/);
  assert.doesNotMatch(coinIntegPayload.text, /coin-tezos/);
});

test("runNotify - team channel equal to health channel sends only one message", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  // coin-integration's channel IS the health channel
  await runNotify({
    env: { ...baseEnv, FAILED_PACKAGES: "coin-evm", LIVE_REPO_HEALTH_CHANNEL: "C_COIN_INTEG" },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channelPosts = slackPayloads.map(p => p.channel);
  assert.deepEqual(channelPosts.filter(c => c === "C_COIN_INTEG").length, 1, "posted exactly once");
});

test("runNotify - package with multiple codeowners notifies all their channels", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  // Add a channel for ledger-third-party-leads (tezos has both hoodies + leads)
  const extendedOwnerChannels = {
    ...ownerChannels,
    "@ledgerhq/ledger-third-party-leads": "C_LEADS",
  };
  await runNotify({
    env: { ...baseEnv, FAILED_PACKAGES: "coin-tezos" },
    fetchImpl,
    ownerChannels: extendedOwnerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channels = slackPayloads.map(p => p.channel);
  assert.ok(channels.includes("C_HOODIES"), "hoodies should be notified");
  assert.ok(channels.includes("C_LEADS"), "leads should also be notified");
});

test("runNotify - skips channels listed in SKIP_CHANNELS", async () => {
  const { fetchImpl, slackPayloads } = makeFetch([libraryJob]);
  await runNotify({
    env: {
      ...baseEnv,
      LIVE_REPO_HEALTH_CHANNEL: undefined,
      SKIP_CHANNELS: "C_COIN_INTEG",
      FAILED_PACKAGES: "coin-tezos,coin-evm",
    },
    fetchImpl,
    ownerChannels,
    readCodeowners: async () => CODEOWNERS,
    log: silentLog,
  });
  const channels = slackPayloads.map(p => p.channel);
  assert.deepEqual(channels, ["C_HOODIES"]);
});

test("runNotify - non-JSON Slack response fails with the HTTP status and body", async () => {
  const githubFetch = makeFetch([libraryJob]).fetchImpl;
  const fetchImpl = async (url, opts) => {
    if (new URL(url).hostname === "api.github.com") return githubFetch(url, opts);
    return { status: 502, text: async () => "<html>Bad Gateway</html>" };
  };
  await assert.rejects(
    runNotify({
      env: { ...baseEnv, FAILED_PACKAGES: "coin-tezos" },
      fetchImpl,
      ownerChannels,
      readCodeowners: async () => CODEOWNERS,
      log: silentLog,
    }),
    /HTTP 502: <html>Bad Gateway<\/html>/,
  );
});

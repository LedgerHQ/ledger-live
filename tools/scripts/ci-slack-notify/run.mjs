// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ownerToChannel from "../../../.github/slack-codeowners.json" with { type: "json" };
import { ownersForPath, parseCodeowners } from "./codeowners.mjs";
import { channelsForOwners, coinModulePathForJob, packageToModulePath } from "./route.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const GITHUB_API_VERSION = "2022-11-28";
const JOBS_PAGE_SIZE = 100;

export function buildSlackPayload({ channel, runUrl, modules }) {
  const modulesSuffix = modules?.length > 0 ? ` — ${modules.join(", ")}` : "";
  const text = `❌ CI failed on coin-modules${modulesSuffix}`;
  return {
    channel,
    unfurl_links: false,
    unfurl_media: false,
    text,
    blocks: [
      { type: "header", text: { type: "plain_text", text, emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: `<${runUrl}|Workflow run>` } },
    ],
  };
}

async function githubJson(url, token, fetchImpl) {
  const res = await fetchImpl(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function fetchFailedJobs({ repository, runId, token, fetchImpl = fetch }) {
  const failed = [];

  for (let page = 1; ; page++) {
    const url = `https://api.github.com/repos/${repository}/actions/runs/${runId}/jobs?per_page=${JOBS_PAGE_SIZE}&page=${page}`;
    const jobs = (await githubJson(url, token, fetchImpl)).jobs ?? [];
    for (const job of jobs) {
      if (job.conclusion === "failure" && !/notify slack/i.test(job.name)) {
        failed.push({ name: job.name, htmlUrl: job.html_url });
      }
    }
    if (jobs.length < JOBS_PAGE_SIZE) return failed;
  }
}

export async function postSlackMessage({ token, payload, fetchImpl = fetch }) {
  const res = await fetchImpl("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`Slack chat.postMessage returned HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!data.ok) {
    throw new Error(`Slack chat.postMessage failed: ${data.error ?? JSON.stringify(data)}`);
  }
  return data;
}

export function buildSuccessPayload({ channel, runUrl }) {
  const text = `✅ CI passed on coin-modules`;
  return {
    channel,
    unfurl_links: false,
    unfurl_media: false,
    text,
    blocks: [
      { type: "header", text: { type: "plain_text", text, emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: `<${runUrl}|Workflow run>` } },
    ],
  };
}

async function sendPayload({ token, payload, label, fetchImpl, log }) {
  await postSlackMessage({ token, payload, fetchImpl });
  log.log(`Posted CI notification to Slack channel ${label}`);
}

export async function runNotify({
  env,
  fetchImpl = fetch,
  ownerChannels = ownerToChannel,
  readCodeowners = () => readFile(join(REPO_ROOT, "CODEOWNERS"), "utf8"),
  log = console,
} = {}) {
  const repository = env.GITHUB_REPOSITORY;
  const runId = env.GITHUB_RUN_ID;
  const githubToken = env.GITHUB_TOKEN;
  const slackToken = env.SLACK_BOT_TOKEN;
  const serverUrl = env.GITHUB_SERVER_URL ?? "https://github.com";
  const healthChannel = env.LIVE_REPO_HEALTH_CHANNEL;
  const skippedChannels = new Set(
    (env.SKIP_CHANNELS ?? "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean),
  );
  const conclusion = env.WORKFLOW_CONCLUSION ?? "failure";

  if (!repository || !runId || !githubToken) {
    throw new Error("GITHUB_REPOSITORY, GITHUB_RUN_ID and GITHUB_TOKEN are required");
  }
  if (!slackToken) {
    throw new Error("SLACK_BOT_TOKEN is required");
  }

  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;

  if (conclusion !== "failure") {
    if (healthChannel) {
      const payload = buildSuccessPayload({ channel: healthChannel, runUrl });
      await sendPayload({ token: slackToken, payload, label: healthChannel, fetchImpl, log });
    }
    return { posted: healthChannel ? 1 : 0, channels: healthChannel ? [healthChannel] : [] };
  }

  const rules = parseCodeowners(await readCodeowners());
  const failedJobs = await fetchFailedJobs({ repository, runId, token: githubToken, fetchImpl });

  if (failedJobs.length === 0) {
    log.log("No failed jobs to report");
    return { posted: 0, channels: [] };
  }

  // Map FAILED_PACKAGES (e.g. "coin-tezos,coin-xrp") to per-module CODEOWNERS details
  const failedPackages = (env.FAILED_PACKAGES ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const packageDetails = failedPackages.flatMap(pkg => {
    const path = packageToModulePath(pkg);
    if (!path) return [];
    return [{ pkg, path, owners: ownersForPath(rules, path) }];
  });

  const allModules = packageDetails.map(p => p.pkg);
  const libraryJobs = failedJobs.filter(job => coinModulePathForJob(job.name));
  const channels = [];

  // Health channel: all failing modules
  if (healthChannel && libraryJobs.length > 0) {
    const payload = buildSlackPayload({ channel: healthChannel, runUrl, modules: allModules });
    await sendPayload({ token: slackToken, payload, label: healthChannel, fetchImpl, log });
    channels.push(healthChannel);
  }

  // Team channels: route by per-module CODEOWNERS, each team receives only its modules
  if (packageDetails.length > 0) {
    const byChannel = new Map();
    for (const { pkg, owners } of packageDetails) {
      for (const channel of channelsForOwners(owners, ownerChannels)) {
        const list = byChannel.get(channel) ?? [];
        list.push(pkg);
        byChannel.set(channel, list);
      }
    }
    for (const [channel, modules] of byChannel) {
      if (channel === healthChannel || skippedChannels.has(channel)) continue;
      const payload = buildSlackPayload({ channel, runUrl, modules });
      await sendPayload({ token: slackToken, payload, label: channel, fetchImpl, log });
      channels.push(channel);
    }
  }

  return { posted: channels.length, channels };
}

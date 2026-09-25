#!/usr/bin/env node
"use strict";

/**
 * Poll the current run until every job matching `prefix` completes, or throw after `maxWaitMs`.
 * Avoids a `needs:` edge that would force unconditional serialization of a whole matrix job. A
 * failed list-jobs call is retried, not thrown, so one flaky API call can't fail the wait.
 *
 * From github-script: require and call waitForMatchingJobs({ github, context, core, prefix,
 * pollIntervalMs, maxWaitMs }). For tests, override `sleep`/`now`.
 */

/**
 * @param {object} params
 * @param {object} params.github - Octokit instance (github-script's `github`)
 * @param {object} params.context - github-script's `context`
 * @param {{info: (msg: string) => void, warning: (msg: string) => void}} params.core -
 *   github-script's `core`
 * @param {string} params.prefix - jobs whose `name` starts with this string are waited on
 * @param {number} params.pollIntervalMs - delay between checks
 * @param {number} params.maxWaitMs - throw if still waiting after this long
 * @param {(ms: number) => Promise<void>} [params.sleep] - override for tests
 * @param {() => number} [params.now] - override for tests
 */
async function waitForMatchingJobs({
  github,
  context,
  core,
  prefix,
  pollIntervalMs,
  maxWaitMs,
  sleep = defaultSleep,
  now = Date.now,
}) {
  const deadline = now() + maxWaitMs;
  let lastError = null;
  let pendingCount = null;
  for (;;) {
    try {
      const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.runId,
        per_page: 100,
      });
      lastError = null;
      const matching = jobs.filter(j => j.name.startsWith(prefix));
      if (matching.length === 0) {
        pendingCount = null;
        core.info(`No jobs matching "${prefix}" visible yet in this run; waiting...`);
      } else {
        const pending = matching.filter(j => j.status !== "completed");
        if (pending.length === 0) {
          core.info(`All ${matching.length} job(s) matching "${prefix}" have finished.`);
          return;
        }
        pendingCount = pending.length;
        core.info(`Waiting on ${pending.length}/${matching.length} job(s) matching "${prefix}".`);
      }
    } catch (error) {
      lastError = error;
      core.warning(
        `Failed to list jobs while waiting for "${prefix}" (will retry): ${error.message}`,
      );
    }

    if (now() >= deadline) {
      const detail = lastError
        ? `last attempt to list jobs failed: ${lastError.message}`
        : pendingCount === null
          ? `no job matching "${prefix}" ever appeared in this run`
          : `${pendingCount} job(s) matching "${prefix}" still not completed`;
      throw new Error(
        `Timed out after ${Math.round(maxWaitMs / 60_000)}m waiting for jobs matching "${prefix}" (${detail}).`,
      );
    }
    await sleep(pollIntervalMs);
  }
}

function defaultSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { waitForMatchingJobs };

"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { createChangelogFunctions } = require("../index.cjs");

const REPO = "LedgerHQ/ledger-live";

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function commitChangeset(cwd, id, summary, subject) {
  fs.writeFileSync(
    path.join(cwd, ".changeset", `${id}.md`),
    `---\n"pkg": patch\n---\n\n${summary}\n`,
  );
  git(cwd, "add", ".");
  git(cwd, "commit", "-q", "-m", subject);
  return git(cwd, "rev-parse", "HEAD");
}

function createRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "changelog-test-"));
  git(cwd, "init", "-q");
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "Test");
  git(cwd, "config", "commit.gpgsign", "false");
  fs.mkdirSync(path.join(cwd, ".changeset"));
  fs.writeFileSync(path.join(cwd, ".changeset", "config.json"), "{}");
  git(cwd, "add", ".");
  git(cwd, "commit", "-q", "-m", "init");
  return cwd;
}

function graphqlResponse(authors, errors) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        repository: Object.fromEntries(
          Object.entries(authors).map(([pr, author]) => [
            `pr${pr}`,
            typeof author === "string"
              ? { author: { login: author, url: `https://github.com/${author}` } }
              : author,
          ]),
        ),
      },
      ...(errors && { errors }),
    }),
  };
}

function setup({ fetch, env = { GITHUB_TOKEN: "token" }, timeoutMs } = {}) {
  const cwd = createRepo();
  const logs = [];
  const shas = {
    first: commitChangeset(
      cwd,
      "first",
      "feat: first change\n\nMore detail",
      "feat(pkg): first change (#101)",
    ),
    second: commitChangeset(cwd, "second", "fix: second change", "fix(pkg): second change (#102)"),
    merged: commitChangeset(
      cwd,
      "merged",
      "fix: merged change",
      "Merge pull request #103 from LedgerHQ/fix/merged",
    ),
    direct: commitChangeset(cwd, "direct", "chore: no pr", "chore: commit pushed without a PR"),
  };
  const functions = createChangelogFunctions({
    cwd,
    fetch,
    env,
    sleep: async () => {},
    log: m => logs.push(m),
    timeoutMs,
  });
  return { cwd, shas, logs, functions };
}

const changeset = (id, summary) => ({ id, summary, releases: [] });

test("formats a release line like changelog-github, with the PR and merge commit from git", async () => {
  const fetch = async () => graphqlResponse({ 101: "alice", 102: "bob" });
  const { shas, functions } = setup({ fetch });

  const line = await functions.getReleaseLine(
    changeset("first", "feat: first change\n\nMore detail"),
    "minor",
    { repo: REPO },
  );

  assert.equal(
    line,
    `\n\n- [#101](https://github.com/${REPO}/pull/101) [\`${shas.first.slice(0, 7)}\`](https://github.com/${REPO}/commit/${shas.first}) Thanks [@alice](https://github.com/alice)! - feat: first change\n  \n  More detail`,
  );
});

test("fetches every pending PR author in one batched request and reuses it", async () => {
  const requests = [];
  const fetch = async (_url, init) => {
    requests.push(JSON.parse(init.body).query);
    return graphqlResponse({ 101: "alice", 102: "bob" });
  };
  const { functions } = setup({ fetch });

  await Promise.all([
    functions.getReleaseLine(changeset("first", "feat: first change"), "minor", { repo: REPO }),
    functions.getReleaseLine(changeset("second", "fix: second change"), "patch", { repo: REPO }),
    functions.getReleaseLine(changeset("second", "fix: second change"), "patch", { repo: REPO }),
  ]);

  assert.equal(requests.length, 1);
  assert.match(requests[0], /pr101: pullRequest\(number: 101\)/);
  assert.match(requests[0], /pr102: pullRequest\(number: 102\)/);
});

test("retries a failed request, then drops the credit instead of failing", async () => {
  let calls = 0;
  const fetch = async () => {
    calls++;
    return { ok: false, status: 502, json: async () => ({}) };
  };
  const { shas, logs, functions } = setup({ fetch });

  const line = await functions.getReleaseLine(changeset("second", "fix: second change"), "patch", {
    repo: REPO,
  });

  assert.equal(calls, 4);
  assert.equal(logs.length, 1);
  assert.equal(
    line,
    `\n\n- [#102](https://github.com/${REPO}/pull/102) [\`${shas.second.slice(0, 7)}\`](https://github.com/${REPO}/commit/${shas.second}) - fix: second change\n`,
  );
});

test("recovers when a retry succeeds", async () => {
  let calls = 0;
  const fetch = async () =>
    ++calls === 1
      ? { ok: false, status: 502, json: async () => ({}) }
      : graphqlResponse({ 102: "bob" });
  const { functions } = setup({ fetch });

  const line = await functions.getReleaseLine(changeset("second", "fix: second change"), "patch", {
    repo: REPO,
  });

  assert.match(line, /Thanks \[@bob\]/);
});

test("retries a response with GraphQL errors next to partial data", async () => {
  let calls = 0;
  const fetch = async () =>
    ++calls === 1
      ? graphqlResponse({ 101: "alice", 102: null }, [{ type: "INTERNAL", path: ["pr102"] }])
      : graphqlResponse({ 101: "alice", 102: "bob" });
  const { functions } = setup({ fetch });

  const line = await functions.getReleaseLine(changeset("second", "fix: second change"), "patch", {
    repo: REPO,
  });

  assert.equal(calls, 2);
  assert.match(line, /Thanks \[@bob\]/);
});

test("keeps the other credits when a PR number is not found", async () => {
  let calls = 0;
  const fetch = async () => {
    calls++;
    return graphqlResponse({ 101: "alice", 102: null }, [{ type: "NOT_FOUND", path: ["pr102"] }]);
  };
  const { functions } = setup({ fetch });

  const [first, second] = await Promise.all([
    functions.getReleaseLine(changeset("first", "feat: first change"), "minor", { repo: REPO }),
    functions.getReleaseLine(changeset("second", "fix: second change"), "patch", { repo: REPO }),
  ]);

  assert.equal(calls, 1);
  assert.match(first, /Thanks \[@alice\]/);
  assert.doesNotMatch(second, /Thanks/);
});

test("gives up on a request that does not answer in time", async () => {
  let calls = 0;
  const fetch = (_url, init) => {
    calls++;
    return new Promise((_, reject) =>
      init.signal.addEventListener("abort", () => reject(init.signal.reason)),
    );
  };
  const { logs, functions } = setup({ fetch, timeoutMs: 10 });

  const line = await functions.getReleaseLine(changeset("second", "fix: second change"), "patch", {
    repo: REPO,
  });

  assert.equal(calls, 4);
  assert.match(logs[0], /leaving them uncredited/);
  assert.doesNotMatch(line, /Thanks/);
});

test("links bot authors to the URL GitHub returns", async () => {
  const fetch = async () =>
    graphqlResponse({
      102: { author: { login: "live-github-bot", url: "https://github.com/apps/live-github-bot" } },
    });
  const { functions } = setup({ fetch });

  const line = await functions.getReleaseLine(changeset("second", "fix: second change"), "patch", {
    repo: REPO,
  });

  assert.match(
    line,
    /Thanks \[@live-github-bot\]\(https:\/\/github\.com\/apps\/live-github-bot\)!/,
  );
});

test("skips the GitHub lookup without a token", async () => {
  const fetch = async () => assert.fail("fetch should not be called");
  const { logs, functions } = setup({ fetch, env: {} });

  const line = await functions.getReleaseLine(changeset("first", "feat: first change"), "minor", {
    repo: REPO,
  });

  assert.doesNotMatch(line, /Thanks/);
  assert.match(logs[0], /GITHUB_TOKEN/);
});

test("reads the PR number from a GitHub default merge title", async () => {
  const { shas, functions } = setup({ fetch: async () => graphqlResponse({ 103: "dana" }) });

  const line = await functions.getReleaseLine(changeset("merged", "fix: merged change"), "patch", {
    repo: REPO,
  });

  assert.equal(
    line,
    `\n\n- [#103](https://github.com/${REPO}/pull/103) [\`${shas.merged.slice(0, 7)}\`](https://github.com/${REPO}/commit/${shas.merged}) Thanks [@dana](https://github.com/dana)! - fix: merged change\n`,
  );
});

test("links only the commit when the adding commit has no PR number", async () => {
  const { shas, functions } = setup({ fetch: async () => graphqlResponse({}) });

  const line = await functions.getReleaseLine(changeset("direct", "chore: no pr"), "patch", {
    repo: REPO,
  });

  assert.equal(
    line,
    `\n\n- [\`${shas.direct.slice(0, 7)}\`](https://github.com/${REPO}/commit/${shas.direct}) - chore: no pr\n`,
  );
});

test("honours pr, commit and author overrides in the summary", async () => {
  const { functions } = setup({ fetch: async () => graphqlResponse({}) });

  const line = await functions.getReleaseLine(
    changeset("first", "pr: #555\ncommit: abcdef1234567\nauthor: @carol\nfeat: overridden"),
    "minor",
    { repo: REPO },
  );

  assert.equal(
    line,
    `\n\n- [#555](https://github.com/${REPO}/pull/555) [\`abcdef1\`](https://github.com/${REPO}/commit/abcdef1234567) Thanks [@carol](https://github.com/carol)! - feat: overridden\n`,
  );
});

test("builds dependency lines from git without any request", async () => {
  const fetch = async () => assert.fail("fetch should not be called");
  const { shas, functions } = setup({ fetch, env: {} });

  const line = await functions.getDependencyReleaseLine(
    [changeset("first", ""), changeset("second", "")],
    [{ name: "@ledgerhq/dep", newVersion: "1.2.3" }],
    { repo: REPO },
  );

  assert.equal(
    line,
    `- Updated dependencies [[\`${shas.first.slice(0, 7)}\`](https://github.com/${REPO}/commit/${shas.first}), [\`${shas.second.slice(0, 7)}\`](https://github.com/${REPO}/commit/${shas.second})]:\n  - @ledgerhq/dep@1.2.3`,
  );
});

test("returns an empty dependency line when nothing was updated", async () => {
  const { functions } = setup({ env: {} });

  assert.equal(
    await functions.getDependencyReleaseLine([changeset("first", "")], [], { repo: REPO }),
    "",
  );
});

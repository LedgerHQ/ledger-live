"use strict";

// Drop-in for @changesets/changelog-github: links come from git, a GitHub outage only drops author credits.

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PR_PER_REQUEST = 50;
const RETRY_DELAYS_MS = [2000, 5000, 15000];
const REQUEST_TIMEOUT_MS = 30000;

function parseSummary(summary) {
  let pr;
  let commit;
  const users = [];
  const text = summary
    .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, value) => {
      pr = Number(value);
      return "";
    })
    .replace(/^\s*commit:\s*([^\s]+)/im, (_, value) => {
      commit = value;
      return "";
    })
    .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, value) => {
      users.push(value);
      return "";
    })
    .trim();
  return { text, pr, commit, users };
}

// The first-parent commit adding a changeset is its PR merge, titled "... (#1234)" or "Merge pull request #1234 from ...".
function readChangesetCommits(cwd) {
  const output = execFileSync(
    "git",
    [
      "log",
      "--first-parent",
      "--diff-filter=A",
      "--name-only",
      "--format=%x00%H%x09%s",
      "--",
      ".changeset",
    ],
    { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  const commits = new Map();
  for (const entry of output.split("\0").slice(1)) {
    const [header, ...files] = entry.split("\n");
    const [sha, subject] = header.split("\t");
    const prMatch = /\(#(\d+)\)\s*$|^Merge pull request #(\d+) /.exec(subject);
    for (const file of files) {
      const match = /^\.changeset\/(.+)\.md$/.exec(file.trim());
      if (match && !commits.has(match[1])) {
        commits.set(match[1], { sha, pr: prMatch ? Number(prMatch[1] ?? prMatch[2]) : undefined });
      }
    }
  }
  return commits;
}

function readPendingPrs(cwd, commits) {
  const prs = new Set();
  const dir = path.join(cwd, ".changeset");
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md") || file === "README.md") continue;
    const { pr } = parseSummary(fs.readFileSync(path.join(dir, file), "utf8"));
    const resolved = pr ?? commits.get(file.slice(0, -3))?.pr;
    if (resolved !== undefined) prs.add(resolved);
  }
  return [...prs];
}

async function fetchAuthors({ repo, prs, token, fetch, sleep, log, timeoutMs }) {
  const authors = new Map();
  if (!token) {
    log("GITHUB_TOKEN is not set: changelog entries will not credit PR authors.");
    return authors;
  }
  const [owner, name] = repo.split("/");
  for (let i = 0; i < prs.length; i += PR_PER_REQUEST) {
    const chunk = prs.slice(i, i + PR_PER_REQUEST);
    const fields = chunk.map(pr => `pr${pr}: pullRequest(number: ${pr}) { author { login url } }`);
    const query = `query { repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${fields.join(" ")} } }`;
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        // A PR number that isn't a PR comes back NOT_FOUND; any other error is worth a retry.
        const errors = (body.errors ?? []).filter(error => error.type !== "NOT_FOUND");
        if (!body.data?.repository || errors.length) {
          throw new Error(JSON.stringify(errors.length ? errors : body));
        }
        for (const pr of chunk) {
          const author = body.data.repository[`pr${pr}`]?.author;
          if (author?.login) authors.set(pr, { login: author.login, url: author.url });
        }
        break;
      } catch (error) {
        if (attempt >= RETRY_DELAYS_MS.length) {
          log(
            `Could not fetch authors for PRs ${chunk.join(", ")}, leaving them uncredited: ${error.message}`,
          );
          break;
        }
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }
  return authors;
}

function createChangelogFunctions({
  cwd = process.cwd(),
  fetch = globalThis.fetch,
  env = process.env,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  log = message => console.warn(`🦋  warn ${message}`),
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  let context;

  function getContext(repo) {
    if (!context) {
      context = (async () => {
        const commits = readChangesetCommits(cwd);
        const prs = readPendingPrs(cwd, commits);
        const authors = await fetchAuthors({
          repo,
          prs,
          token: env.GITHUB_TOKEN,
          fetch,
          sleep,
          log,
          timeoutMs,
        });
        return { commits, authors };
      })();
    }
    return context;
  }

  function assertRepo(options) {
    if (!options?.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@ledgerhq/changelog", { "repo": "org/repo" }]',
      );
    }
  }

  const commitLink = (repo, sha) =>
    `[\`${sha.slice(0, 7)}\`](https://github.com/${repo}/commit/${sha})`;

  return {
    async getReleaseLine(changeset, _type, options) {
      assertRepo(options);
      const { repo } = options;
      const { commits, authors } = await getContext(repo);
      const fromGit = commits.get(changeset.id);
      const summary = parseSummary(changeset.summary);

      const pr = summary.pr ?? fromGit?.pr;
      const sha = summary.commit ?? fromGit?.sha ?? changeset.commit;
      // Bot authors link to /apps/<name>, so API results keep their own URL.
      const users = summary.users.length
        ? summary.users.map(login => ({ login, url: `https://github.com/${login}` }))
        : [authors.get(pr)].filter(Boolean);

      const prefix = [
        pr === undefined ? "" : ` [#${pr}](https://github.com/${repo}/pull/${pr})`,
        sha ? ` ${commitLink(repo, sha)}` : "",
        users.length
          ? ` Thanks ${users.map(user => `[@${user.login}](${user.url})`).join(", ")}!`
          : "",
      ].join("");

      const [firstLine, ...futureLines] = summary.text.split("\n").map(line => line.trimEnd());
      return `\n\n-${prefix ? `${prefix} -` : ""} ${firstLine}\n${futureLines.map(line => (line ? `  ${line}` : "")).join("\n")}`;
    },

    async getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
      assertRepo(options);
      if (dependenciesUpdated.length === 0) return "";
      const { repo } = options;
      const { commits } = await getContext(repo);
      const shas = new Set(
        changesets
          .map(changeset => commits.get(changeset.id)?.sha ?? changeset.commit)
          .filter(Boolean),
      );
      const links = [...shas].map(sha => commitLink(repo, sha));
      const dependencies = dependenciesUpdated.map(
        dependency => `  - ${dependency.name}@${dependency.newVersion}`,
      );
      return [`\n\n- Updated dependencies [${links.join(", ")}]:`, ...dependencies].join("\n");
    },
  };
}

module.exports = { default: createChangelogFunctions(), createChangelogFunctions };

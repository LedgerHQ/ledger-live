import fetch from "isomorphic-unfetch";
import { Parse } from "unzipper";
import { parser } from "stream-json";
import { streamValues } from "stream-json/streamers/StreamValues";
import uniq from "lodash/uniq";
import allSpecs from "@ledgerhq/live-common/lib/generated/specs";

type AppCandidate = {
  path: string;
  model: string;
  firmware: string;
  appName: string;
  appVersion: string;
};
type AccountRaw = Object;

export type MinimalSerializedMutationReport = {
  appCandidate: AppCandidate;
  mutationName: string | undefined;
  accountId: string | undefined;
  destinationId: string | undefined;
  operationId: string | undefined;
  error: string | undefined;
};

export type MinimalSerializedSpecReport = {
  // spec.name
  specName: string;
  // minified version of accounts (we remove transactions from them)
  accounts: AccountRaw[] | undefined;
  fatalError: string | undefined;
  mutations: MinimalSerializedMutationReport[] | undefined;
};

export type MinimalSerializedReport = {
  results: Array<MinimalSerializedSpecReport>;
};

export type Artifact = {
  created_at: string;
  archive_download_url: string;
};

function handleErrors(response) {
  if (!response.ok) {
    throw Error(
      response.url + ": " + response.status + " " + response.statusText
    );
  }
  return response;
}

async function downloadArchive(
  githubToken: string,
  url: string
): Promise<MinimalSerializedReport | null> {
  console.log("retrieving " + url);
  const blob = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    },
  }).then((r) => {
    if (r.ok) {
      return r.blob();
    }
    if (r.status === 410) {
      return null;
    }
    return handleErrors(r);
  });
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    blob
      .stream()
      .pipe(Parse())
      .on("entry", (entry) => {
        const fileName = entry.path;
        if (fileName === "report.json") {
          entry
            .pipe(parser())
            .pipe(streamValues())
            .on("data", (e) => resolve(e.value))
            .on("error", reject);
        } else {
          entry.autodrain();
        }
      });
  });
}

// true if a is before b
function isDateBefore(a, b) {
  return new Date(a) < new Date(b);
}

function successRateDisplay(a, b) {
  if (!b) return "N/A";
  if (!a) return "❌ 0%";
  let r = a / b;
  return (r === 1 ? "✅ " : r < 0.5 ? "⚠️ " : "") + Math.round(100 * r) + "%";
}

export async function loadReports({
  branch,
  days,
  githubToken,
}: {
  branch: string | undefined;
  days: string | undefined;
  githubToken: string;
}): Promise<{ report: MinimalSerializedReport; artifact: Artifact }[]> {
  let page = 1;
  const maxPage = 100;

  const dateFrom = days
    ? new Date(Date.now() - 24 * 60 * 60 * 1000 * parseInt(days, 10))
    : undefined;

  let latestDateReached = false;

  let artifacts: Artifact[] = [];
  let res;
  do {
    const url = `https://api.github.com/repos/LedgerHQ/ledger-live/actions/artifacts?per_page=100&page=${page}`;
    console.log("retrieving " + url);
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    })
      .then((r) => (r.ok ? r.json() : r.status === 502 ? {} : handleErrors(r)))
      .then((r) => {
        if (r.artifacts) {
          return r.artifacts;
        }
        return [];
      });

    if (res) {
      res.forEach((a) => {
        if (
          a.name === "report" &&
          (!branch || a.workflow_run.head_branch === branch)
        ) {
          if (!dateFrom || isDateBefore(dateFrom, a.created_at)) {
            artifacts.push(a);
          } else {
            latestDateReached = true;
          }
        }
      });
    }
    page++;
  } while (res && res.length > 0 && !latestDateReached && page < maxPage);

  const reports = (
    await Promise.all(
      artifacts.map((artifact) =>
        downloadArchive(githubToken, artifact.archive_download_url).then(
          (report) => ({
            artifact,
            report,
          })
        )
      )
    )
  ).filter(Boolean);

  return reports;
}

function safeErrorDisplay(txt) {
  let min = txt.slice(0, 200);
  return "`" + min.replace(/[\s`]/g, " ") + "`";
}

export function generateSuperReport(
  all: { report: MinimalSerializedReport; artifact: Artifact }[],
  days: string | undefined
): {
  reportMarkdownBody: string;
  reportSlackText: string;
} {
  let reportMarkdownBody = "";
  let reportSlackText = "";

  let totalReports = 0;
  let totalMutations = 0;
  let totalOperations = 0;

  const stats: {
    [_: string]: {
      specName: string;
      fatalErrors: string[];
      runs: number;
      mutations: {
        [_: string]: {
          mutationName: string;
          runs: number;
          success: number;
          errors: string[];
        };
      };
    };
  } = {};

  function initMutations(specName) {
    for (const k in allSpecs) {
      const specs = allSpecs[k];
      for (const s in specs) {
        const spec = specs[s];
        if (spec.name === specName) {
          const m = {};
          spec.mutations.forEach((mutation) => {
            m[mutation.name] = {
              mutationName: mutation.name,
              runs: 0,
              success: 0,
              errors: [],
            };
          });
          return m;
        }
      }
    }
    return {};
  }

  all.forEach(({ report }) => {
    totalReports++;
    report.results?.forEach((result) => {
      const { specName, fatalError, mutations } = result;
      const specStats = (stats[specName] = stats[specName] || {
        specName,
        mutations: initMutations(specName),
        fatalErrors: [],
        runs: 0,
      });
      if (fatalError) {
        specStats.fatalErrors.push(fatalError);
      } else {
        specStats.runs++;
      }
      mutations?.forEach((mutation) => {
        const { mutationName, operationId, error } = mutation;
        if (mutationName) {
          totalMutations++;
          const prev = specStats.mutations[mutationName];
          const errors = prev?.errors.slice(0) || [];
          if (error) {
            errors.push(error);
          }
          specStats.mutations[mutationName] = {
            mutationName,
            runs: (prev?.runs || 0) + 1,
            success: (prev?.success || 0) + (error || !operationId ? 0 : 1),
            errors,
          };
        }
        if (operationId) {
          totalOperations++;
        }
      });
    });
  });

  const summary = `${
    days ? `${days} last days` : "all reports"
  }: ${totalReports} runs, ${totalOperations} success txs. ${successRateDisplay(
    totalOperations,
    totalMutations
  )} success rate.`;

  reportMarkdownBody += "# Bot Weekly Super Report!\n";
  reportMarkdownBody +=
    "\n> What is the bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n";
  reportMarkdownBody += summary + "\n\n";

  reportMarkdownBody +=
    "| Spec | Availability (scan success) | Transactions success | Mutations Coverage | Ops |\n";
  reportMarkdownBody += "|--|--|--|--|--|\n";
  reportMarkdownBody += Object.values(stats)
    .map(({ specName, mutations, fatalErrors, runs }) => {
      const m = Object.values(mutations);
      const txs = m.reduce((acc, m) => acc + m.success, 0) || 0;
      const txsAttempts = m.reduce((acc, m) => acc + m.runs, 0) || 0;
      const txsSuccess = successRateDisplay(txs, txsAttempts);
      const mutationsWithOneSuccess = m.filter((m) => m.success > 0);
      const mutationCoverage = successRateDisplay(
        mutationsWithOneSuccess.length,
        m.length
      );
      return `|${specName}|${successRateDisplay(
        runs - fatalErrors.length,
        runs
      )}|${txsSuccess}|${mutationCoverage}|${txs ? txs : "❌"}|\n`;
    })
    .join("");

  reportMarkdownBody += "## Details case by case\n";
  Object.values(stats).forEach(({ specName, mutations, fatalErrors }) => {
    reportMarkdownBody += `## Spec \`${specName}\`\n`;

    if (fatalErrors.length) {
      reportMarkdownBody += `**❌ Fatal cases (${fatalErrors.length})**\n`;
      reportMarkdownBody += `\n`;
      // TODO in future we will try to link to these errors. we can also tell how much it reproduced
      uniq(fatalErrors).forEach((e) => {
        reportMarkdownBody += `- ${safeErrorDisplay(e)}\n`;
      });
      reportMarkdownBody += `\n`;
    }

    const m = Object.values(mutations);
    if (m.length > 0) {
      const errorAttached = [];
      reportMarkdownBody += `**mutations:**\n`;
      reportMarkdownBody += "| Mutation | Tx Success | Ops | Errors |\n";
      reportMarkdownBody += "|--|--|--|--|\n";
      reportMarkdownBody += m
        .map(
          ({ errors, success, runs, mutationName }) =>
            `|${mutationName.replace(/[|]/g, " ")}|${successRateDisplay(
              success,
              runs
            )}|${success ? success : "❌"}|${uniq(errors)
              .map((e) => {
                const reduced = safeErrorDisplay(e);
                const i = errorAttached.indexOf(reduced) + 1;
                if (!i) {
                  errorAttached.push(reduced);
                  return errorAttached.length;
                }
                return i;
              })
              .join(", ")}|\n`
        )
        .join("");
      if (errorAttached.length) {
        reportMarkdownBody += "\n";
        reportMarkdownBody +=
          "<details><summary>Detail of errors</summary>\n\n\n";
        reportMarkdownBody +=
          errorAttached.map((e, i) => `${i + 1}. ${e}\n`).join("") + "\n";
        reportMarkdownBody += "\n</details>\n\n";
      }
    }
  });

  reportSlackText = `${summary} <{{url}}|*Full Report*>`;

  return {
    reportMarkdownBody,
    reportSlackText,
  };
}

export async function getLatestCommitShaOfBranch({
  githubToken,
  branch,
}: {
  githubToken: string;
  branch: string | undefined;
}): Promise<string> {
  console.log("getting latest commit");
  const commits = await fetch(
    `https://api.github.com/repos/LedgerHQ/ledger-live/commits${
      branch ? "?sha=" + branch : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    }
  )
    .then(handleErrors)
    .then((r) => r.json());
  return commits[0].sha;
}

type GithubCommentR = {
  html_url: string;
};

export async function uploadCommentToGithubSha({
  githubToken,
  reportMarkdownBody,
  sha,
}: {
  githubToken: string;
  reportMarkdownBody: string;
  sha: string;
}): Promise<GithubCommentR> {
  const githubUrl = `https://api.github.com/repos/LedgerHQ/ledger-live/commits/${sha}/comments`;
  console.log("sending to " + githubUrl);
  const githubComment = await fetch(githubUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body: reportMarkdownBody }),
  })
    .then(handleErrors)
    .then((r) => r.json());
  return githubComment;
}

export async function uploadToSlack({
  text,
  slackChannel,
  slackIconEmoji,
  slackApiToken,
}: {
  text: string;
  slackApiToken: string;
  slackChannel: string | undefined;
  slackIconEmoji: string | undefined;
}) {
  console.log("upload to slack");
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slackApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      channel: slackChannel || "ledger-live-bot",
      icon_emoji: slackIconEmoji || ":mere_denis:",
    }),
  }).then(handleErrors);
}

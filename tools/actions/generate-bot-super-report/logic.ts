import { Parse } from "unzipper";
import { parser } from "stream-json";
import { streamValues } from "stream-json/streamers/StreamValues";
import { delay, retry, promiseAllBatched } from "./promise";
import groupBy from "lodash/groupBy";
import { Readable } from "stream";

type AppCandidate = {
  path: string;
  model: string;
  firmware: string;
  appName: string;
  appVersion: string;
};
type AccountRaw = Record<string, unknown>;

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
  existingMutationNames: string[];
};

export type MinimalSerializedReport = {
  results: Array<MinimalSerializedSpecReport>;
  environment?: string | undefined;
};

export type Artifact = {
  created_at: string;
  archive_download_url: string;
  name: string;
  workflow_run: {
    head_branch: string;
  };
};

async function downloadArchive(
  githubToken: string,
  url: string,
): Promise<MinimalSerializedReport | null> {
  console.log("retrieving " + url);

  const blob: Blob | null = await retry(() =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    }),
  )
    .then(r => {
      // no more content
      if (r.status === 410) {
        return null;
      }
      return r;
    })
    .then(r => (r ? handleErrors(r) : null))
    .then(r => (r ? r.blob() : null));
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    Readable.fromWeb(blob.stream() as any)
      .pipe(Parse())
      .on("entry", entry => {
        const fileName = entry.path;
        if (fileName === "report.json") {
          entry
            .pipe(parser())
            .pipe(streamValues())
            .on("data", (e: { value: any }) => resolve(e.value))
            .on("error", reject);
        } else {
          entry.autodrain();
        }
      });
  });
}

// true if a is before b
function isDateBefore(a: string | Date, b: string | Date) {
  return new Date(a) < new Date(b);
}

function successRateDisplay(a: number, b: number) {
  if (!b) return "N/A";
  if (!a) return "❌ 0%";
  const r = a / b;
  return (r === 1 ? "✅ " : r < 0.8 ? "⚠️ " : "") + Math.round(100 * r) + "%";
}

function handleErrors(response: Response) {
  if (!response.ok) {
    throw Error(response.url + ": " + response.status + " " + response.statusText);
  }
  return response;
}

export async function loadReports({
  branch,
  days,
  githubToken,
  environment,
}: {
  branch: string | undefined;
  days: string | undefined;
  githubToken: string;
  environment: string | undefined;
}): Promise<{ report: MinimalSerializedReport | null; artifact: Artifact }[]> {
  let page = 1;
  const maxPage = 100;

  const dateFrom = days
    ? new Date(Date.now() - 24 * 60 * 60 * 1000 * parseInt(days, 10))
    : undefined;

  let latestDateReached = false;

  const artifacts: Artifact[] = [];
  let res;
  do {
    const url = `https://api.github.com/repos/LedgerHQ/ledger-live/actions/artifacts?per_page=100&name=report&page=${page}`;
    console.log("retrieving " + url);
    res = await retry(() =>
      fetch(url, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
        },
      }),
    )
      .then(r => (r.ok ? r.json() : r.status === 502 ? {} : handleErrors(r)))
      .then((r: { artifacts?: Artifact[] }) => {
        if (r.artifacts) {
          return r.artifacts;
        }
        return [];
      });

    if (res) {
      res.forEach(a => {
        if (!branch || a.workflow_run.head_branch === branch) {
          if (!dateFrom || isDateBefore(dateFrom, a.created_at)) {
            artifacts.push(a);
          } else {
            latestDateReached = true;
          }
        }
      });
    }
    page++;
    await delay(500);
  } while (res && res.length > 0 && !latestDateReached && page < maxPage);

  const reports = (
    await promiseAllBatched(5, artifacts, artifact =>
      downloadArchive(githubToken, artifact.archive_download_url).then(report => ({
        artifact,
        report,
      })),
    )
  )
    .filter(Boolean)
    .filter(({ report }) => {
      if (environment && report) {
        return report.environment === environment;
      }
      return true;
    });

  return reports;
}

export function generateSuperReport(
  all: { report: MinimalSerializedReport | null; artifact: Artifact }[],
  days: string | undefined,
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

  // initialize all stats to make sure we have all the mutations known and so we can detect non coverage
  all.forEach(({ report }) => {
    report?.results.forEach(({ specName, existingMutationNames }) => {
      const s = (stats[specName] = stats[specName] || {
        specName,
        fatalErrors: [],
        runs: 0,
        mutations: {},
      });
      existingMutationNames?.forEach(mutationName => {
        s.mutations[mutationName] = {
          mutationName,
          runs: 0,
          success: 0,
          errors: [],
        };
      });
    });
  });

  all.forEach(({ report }) => {
    totalReports++;
    report?.results?.forEach(result => {
      const { specName, fatalError, mutations } = result;
      const specStats = stats[specName];
      if (fatalError) {
        specStats.fatalErrors.push(fatalError);
      } else {
        specStats.runs++;
      }
      mutations?.forEach(mutation => {
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

  const ctx = days ? `${days} last days` : "all available reports";

  const coverageInfo = Object.values(stats).reduce(
    ([success, total], { mutations }) => {
      const m = Object.values(mutations);
      const mutationsWithOneSuccess = m.filter(m => m.success > 0);
      return [success + mutationsWithOneSuccess.length, total + m.length];
    },
    [0, 0],
  );

  const summary = `${ctx}: ${totalReports} runs, ${totalOperations} success txs. ${successRateDisplay(
    totalOperations,
    totalMutations,
  )} success rate. ${successRateDisplay(coverageInfo[0], coverageInfo[1])} coverage rate.`;

  reportMarkdownBody += `# Bot "super report" on ${ctx}\n`;
  reportMarkdownBody +=
    "\n> What is the Bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n";
  reportMarkdownBody += summary + "\n\n";

  reportMarkdownBody +=
    "| Spec | Availability (scan success) | Transactions success | Mutations Coverage | Operations |\n";
  reportMarkdownBody += "|--|--|--|--|--|\n";
  reportMarkdownBody += Object.values(stats)
    .map(({ specName, mutations, fatalErrors, runs }) => {
      const m = Object.values(mutations);
      const txs = m.reduce((acc, m) => acc + m.success, 0) || 0;
      const txsAttempts = m.reduce((acc, m) => acc + m.runs, 0) || 0;
      const txsSuccess = successRateDisplay(txs, txsAttempts);
      const mutationsWithOneSuccess = m.filter(m => m.success > 0);
      const mutationCoverage = successRateDisplay(mutationsWithOneSuccess.length, m.length);
      return `|${specName}|${successRateDisplay(
        runs - fatalErrors.length,
        runs,
      )}|${txsSuccess}|${mutationCoverage}|${txs ? txs : "❌"}|\n`;
    })
    .join("");

  reportMarkdownBody += "## Details case by case\n";
  Object.values(stats).forEach(({ specName, mutations, fatalErrors }) => {
    reportMarkdownBody += `## Spec \`${specName}\`\n`;

    if (fatalErrors.length) {
      const grouped = groupErrors(fatalErrors);
      reportMarkdownBody += `\n<details><summary>❌ Fatal cases (${fatalErrors.length})</summary>\n\n`;
      // TODO in future we will try to link to these errors. we can also tell how much it reproduced

      reportMarkdownBody += grouped
        .map(
          ({ error, occurrences }) =>
            `- ${occurrences > 1 ? `**(x${occurrences})** ` : ""}\`${error}\`\n`,
        )
        .join("");
      reportMarkdownBody += `\n</details>\n\n`;
    }

    const m = Object.values(mutations);
    if (m.length > 0) {
      const allErrors = m.reduce((acc, m) => acc.concat(m.errors), [] as string[]);
      const groupedErrors = groupErrors(allErrors);
      reportMarkdownBody += "\n";
      reportMarkdownBody += "| Mutation | Tx Success | Ops | Errors |\n";
      reportMarkdownBody += "|--|--|--|--|\n";
      reportMarkdownBody += m
        .map(({ errors, success, runs, mutationName }) => {
          const grouped = groupErrors(errors);
          return `|${mutationName.replace(/[|]/g, " ")}|${successRateDisplay(success, runs)}|${
            success ? success : "❌"
          }|${groupedErrors
            .filter(e => grouped.some(e2 => e2.error === e.error))
            .map(({ index }) => index)
            .join(", ")}|\n`;
        })
        .join("");
      if (groupedErrors.length) {
        reportMarkdownBody += "\n";
        reportMarkdownBody +=
          "<details><summary>Detail of errors (" + (allErrors.length + 1) + ")</summary>\n\n\n";
        reportMarkdownBody +=
          groupedErrors
            .map(
              ({ error, index, occurrences }) =>
                `${index}. ${occurrences > 1 ? `**(x${occurrences})** ` : ""}\`${error}\`\n`,
            )
            .join("") + "\n";
        reportMarkdownBody += "\n</details>\n\n";
      }
    }
  });

  reportSlackText = `:confetti_ball: *${summary} <{{url}}|Full Report>*`;

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
    `https://api.github.com/repos/LedgerHQ/ledger-live/commits${branch ? "?sha=" + branch : ""}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
    },
  )
    .then(handleErrors)
    .then(r => r.json());
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
    .then(r => r.json());
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

const groupErrorsIncluding = [
  "Error: could not find optimisticOperation",
  "Error: Transaction has been reverted by the EVM",
  "LedgerAPI4xx: An error occurred: -25: Missing inputs",
  "Error: failed to get Stake Activation",
  "LedgerAPI4xx: Failed to get transactions for addresses",
  "Failure(s) occurred during RPC call : co.ledger.jrpc.model.CallError: An error occurred: -32000",
];
function groupSimilarError(str: string): string {
  const g = groupErrorsIncluding.find(t => str.includes(t));
  if (g) return g;
  return str;
}

function safeErrorDisplay(txt: string) {
  return txt.slice(0, 200).replace(/[\s`]/g, " ");
}

function groupErrors(
  errors: string[],
): Array<{ error: string; occurrences: number; index: number }> {
  const grouped = groupBy(errors.map(e => groupSimilarError(safeErrorDisplay(e))));
  return Object.keys(grouped).map((error, i) => ({
    error,
    index: i + 1,
    occurrences: grouped[error].length,
  }));
}

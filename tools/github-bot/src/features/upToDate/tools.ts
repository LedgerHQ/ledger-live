import { ProbotOctokit } from "probot";

type Octokit = InstanceType<typeof ProbotOctokit>;
type CheckRunResponse = ReturnType<Octokit["checks"]["listForRef"]>;
export const getCheckRunByName = async ({
  octokit,
  owner,
  repo,
  ref,
  check_name,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  ref: string;
  check_name: string;
}): Promise<CheckRunResponse> =>
  await octokit.checks.listForRef({
    owner,
    repo,
    ref,
    check_name,
  });

export const batch = <T>(
  tasks: (() => T)[],
  batchSize: number
): Promise<T[]> => {
  const results: T[] = [];
  const tasksLength = tasks.length;

  return new Promise<T[]>((resolve, reject) => {
    const shiftAndRun = (): void => {
      try {
        const task = tasks.shift();
        if (task) {
          Promise.resolve(task())
            .then((result) => results.push(result))
            .then(shiftAndRun)
            .catch(reject);
        } else {
          if (results.length === tasksLength) {
            resolve(results);
          }
        }
      } catch (error) {
        reject(error);
      }
    };

    for (let i = 0; i < batchSize; i++) {
      shiftAndRun();
    }
  });
};

export async function updateCheckRun({
  octokit,
  owner,
  repo,
  checkRunId,
  isFork,
  prBase,
  prHead,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  checkRunId: number;
  isFork: boolean;
  prBase: any;
  prHead: any;
}) {
  try {
    const ownerPrefix = isFork ? `${prHead.repo.owner}:` : "";

    const comparison = await octokit.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${prBase.ref}...${ownerPrefix}${prHead.ref}`,
      per_page: 1,
    });

    const isUpToDate = ["ahead", "identical"].includes(comparison.data.status);

    const output = isUpToDate
      ? {
          title: "💚 Success",
          summary:
            `Branch \`${prHead.ref}\` is identical or ahead of \`${prBase.ref}\`.\n` +
            "\n" +
            "**All good! 👍**",
        }
      : {
          title: "🔴 Failure",
          summary:
            `Branch \`${prHead.ref}\` is ${comparison.data.behind_by} commit(s) behind \`${prBase.ref}\`.\n` +
            `\n` +
            `**Please rebase your branch on top of \`${prBase.ref}\`.**\n` +
            `\n` +
            `_If you are not comfortable with git and rebasing, here is a [nice guide](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)._`,
        };

    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status: "completed",
      conclusion: isUpToDate ? "success" : "failure",
      output,
    });
  } catch (error) {
    console.error(error);
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status: "completed",
      conclusion: "failure",
      output: {
        title: "Error",
        summary: (error as Error).message,
      },
    });
  }
}

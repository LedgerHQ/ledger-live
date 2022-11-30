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
    let aborted = false;

    const shiftAndRun = (): void => {
      try {
        if (aborted) return;
        const task = tasks.shift();
        if (task) {
          Promise.resolve(task())
            .then((result) => results.push(result))
            .then(shiftAndRun)
            .catch((error) => {
              aborted = true;
              reject(error);
            });
        } else {
          if (results.length === tasksLength) {
            resolve(results);
          }
        }
      } catch (error) {
        aborted = true;
        reject(error);
      }
    };

    for (let i = 0; i < batchSize; i++) {
      shiftAndRun();
    }
  });
};

export type CheckRun = Awaited<ReturnType<Octokit["checks"]["get"]>>["data"];
export async function updateCheckRun({
  octokit,
  owner,
  repo,
  checkRun,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  checkRun: {
    id: CheckRun["id"];
    pull_requests: CheckRun["pull_requests"];
  };
}) {
  const outcome = [];
  try {
    for await (const pr of checkRun.pull_requests) {
      const { data } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: pr.number,
      });

      if (!data) continue;

      const isFork = data.head.repo?.fork;
      const prBase = pr.base;
      const prHead = pr.head;
      const ownerPrefix = isFork ? `${data.head.repo?.owner}:` : "";

      const comparison = await octokit.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${prBase.ref}...${ownerPrefix}${prHead.ref}`,
        per_page: 1,
      });

      const isUpToDate = ["ahead", "identical"].includes(
        comparison.data.status
      );

      outcome.push({
        isUpToDate,
        baseRef: prBase.ref,
        headRef: prHead.ref,
        comparison: comparison.data,
      });
    }

    const { valid, branchList } = outcome.reduce<{
      valid: boolean;
      branchList: string[];
    }>(
      (acc, { isUpToDate, baseRef, headRef, comparison }) => {
        return {
          valid: acc.valid && isUpToDate,
          branchList: [
            ...acc.branchList,
            isUpToDate
              ? `- Branch \`${headRef}\` is identical or ahead of \`${baseRef}\``
              : `- Branch \`${headRef}\` is ${comparison.behind_by} commit(s) behind \`${baseRef}\`.`,
          ],
        };
      },
      { valid: true, branchList: [] }
    );

    const output = valid
      ? {
          title: "💚 Success",
          summary:
            `All pull requests referencing the commit are identical or ahead of their target:\n` +
            `${branchList.join("\n")}\n` +
            "\n" +
            "**All good! 👍**",
        }
      : {
          title: "🔴 Failure",
          summary:
            `Some pull requests referencing the commit are behind their target:\n` +
            `${branchList.join("\n")}\n` +
            `\n` +
            `**❌ Please rebase out-of-date branches to make this check pass.**\n` +
            `\n` +
            `_If you are not comfortable with git and rebasing, here is a [nice guide](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)._`,
        };

    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.id,
      status: "completed",
      conclusion: valid ? "success" : "failure",
      output,
    });
  } catch (error) {
    console.error(error);
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.id,
      status: "completed",
      conclusion: "failure",
      output: {
        title: "Error",
        summary: (error as Error).message,
      },
    });
  }
}

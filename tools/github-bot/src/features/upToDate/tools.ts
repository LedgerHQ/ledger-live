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
    head_sha: CheckRun["head_sha"];
  };
}) {
  await octokit.checks.update({
    owner,
    repo,
    check_run_id: checkRun.id,
    status: "in_progress",
    started_at: new Date().toISOString(),
  });

  const outcome = [];
  try {
    // Inefficient, but other api calls (repos.listPullRequestsAssociatedWithCommit)
    // do not list prs coming from forked repos unfortunately…
    const associatedPRs = (
      await octokit.paginate(octokit.pulls.list, {
        owner,
        repo,
      })
    ).filter((pr) => pr.head.sha === checkRun.head_sha);

    for await (const pr of associatedPRs) {
      const isFork = pr.head.repo?.fork;
      const prBase = pr.base;
      const prHead = pr.head;
      const ownerPrefix = isFork ? `${pr.head.repo?.owner.login}:` : "";

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
        pr,
        comparison: comparison.data,
      });
    }

    const { valid, branchList } = outcome.reduce<{
      valid: boolean;
      branchList: string[];
    }>(
      (acc, { isUpToDate, pr, comparison }) => {
        return {
          valid: acc.valid && isUpToDate,
          branchList: [
            ...acc.branchList,
            isUpToDate
              ? `- ✅ **#${pr.number}:** branch \`${pr.head.ref}\` is identical or ahead of \`${pr.base.ref}\``
              : `- ❌ **#${pr.number}:** branch \`${pr.head.ref}\` is ${comparison.behind_by} commit(s) behind \`${pr.base.ref}\``,
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
            `**Please rebase out-of-date branches to make this check pass. 🙏**\n` +
            `\n` +
            `_If you are not comfortable with git and rebasing, here is a [nice guide](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)._`,
        };

    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.id,
      status: "completed",
      conclusion: valid ? "success" : "neutral",
      output,
      completed_at: new Date().toISOString(),
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
      completed_at: new Date().toISOString(),
    });
  }
}

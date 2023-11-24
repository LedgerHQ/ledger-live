export const isValidBranchName = (branch: string): boolean =>
  /^(feat|support|bugfix|releases)\/.+/.test(branch) ||
  /^revert-[0-9]+-(feat|support|bugfix|releases)\/.+/.test(branch) ||
  ["release", "hotfix", "renovate"].includes(branch);

export const isValidUser = (user: string): boolean =>
  ![
    "ledgerlive",
    "live-github-bot[bot]",
    "github-actions[bot]",
    "dependabot[bot]",
    "renovate[bot]",
    "ldg-smartling-sa",
  ].includes(user);

export const isValidBody = (body: string | null): boolean => {
  if (!body) return false;

  const requiredHeadings = [
    "### 📝 Description",
    "### ❓ Context",
    "### ✅ Checklist",
    "### 🧐 Checklist for the PR Reviewers",
  ];

  const results = body.split(/\r?\n/).reduce(
    (acc, line) => {
      // Dummy description line has not been replaced.
      if (line.includes("_Replace this text")) {
        return {
          ...acc,
          dummyDescription: true,
        };
      }

      const headingIndex = requiredHeadings.findIndex(heading => line.startsWith(heading));
      // Template required heading is still in the body.
      if (headingIndex > -1) {
        acc.matchHeadings[headingIndex] = true;
        return acc;
      }

      return acc;
    },
    {
      dummyDescription: false,
      matchHeadings: requiredHeadings.map(() => false),
    },
  );

  return !results.dummyDescription && results.matchHeadings.every(Boolean);
};

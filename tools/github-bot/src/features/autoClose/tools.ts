export const isValidBranchName = (branch: string): boolean =>
  /^(feat|support|bugfix|releases)\/.+/.test(branch) ||
  /^revert-[0-9]+-(feat|support|bugfix|releases)\/.+/.test(branch) ||
  ["release", "hotfix"].includes(branch);

export const isValidUser = (user: string): boolean =>
  ![
    "ledgerlive",
    "live-github-bot[bot]",
    "github-actions[bot]",
    "dependabot[bot]",
  ].includes(user);

export const isValidBody = (body: string | null): boolean => {
  if (!body) return false;

  const description =
    "_Replace this text by a clear and concise description of what this pull request is about and why it is needed._";

  const requiredHeadings = [
    "### 📝 Description",
    "### ❓ Context",
    "### ✅ Checklist",
    // "### 🚀 Expectations to reach",
  ];

  const results = body.split(/\r?\n/).reduce(
    (acc, line) => {
      // Dummy description line has not been replaced.
      if (line === description) {
        return {
          ...acc,
          dummyDescription: true,
        };
      }

      const headingIndex = requiredHeadings.findIndex((heading) =>
        line.startsWith(heading)
      );
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
    }
  );

  return !results.dummyDescription && results.matchHeadings.every(Boolean);
};

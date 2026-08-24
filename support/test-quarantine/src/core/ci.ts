/**
 * Flake reporting only runs in CI: a local run retrying a test says nothing
 * about the health of the shared suite, and developers should not need
 * credentials to run tests.
 */
export function isCI(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.CI;
  if (!flag) return false;
  // Some setups export CI explicitly disabled rather than leaving it unset.
  return flag !== "false" && flag !== "0";
}

/** Link back to the workflow run a flake was observed in, when on GitHub Actions. */
export function ciRunUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = env;
  if (!GITHUB_SERVER_URL || !GITHUB_REPOSITORY || !GITHUB_RUN_ID) return undefined;
  return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
}

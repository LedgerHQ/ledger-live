import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import {
  MobileMetaFile,
  Reporter,
  downloadMetafilesFromArtifact,
  mobileMetafileKeys,
  formatSize,
  getRecentArtifactFromBranch,
  submitCommentToPR,
} from "./logic";

type Inputs = {
  baseBranch: string;
  octokit: ReturnType<typeof github.getOctokit>;
  githubToken: string;
  prNumber: string;
};

export async function mobileChecks({ octokit, baseBranch, githubToken, prNumber }: Inputs) {
  const mobileMetaFile = await getRecentArtifactFromBranch(
    octokit,
    "mobile.metafile.json",
    baseBranch,
  );

  if (!mobileMetaFile) {
    core.warning(`Could not find previous metafile from ${baseBranch}`);
    return;
  }

  core.info(`Downloading most recent artifacts from ${baseBranch}`);
  const reference = (await downloadMetafilesFromArtifact(
    githubToken,
    mobileMetaFile.archive_download_url,
    "mobile",
  )) as MobileMetaFile;

  core.info(`Getting current bundles metafile`);
  const file = fs.readFileSync("mobile.metafile.json", "utf-8");
  const currentBundles: MobileMetaFile = JSON.parse(file);

  const reporter = new Reporter();
  core.info(`Checking agains builds metadata files from ${baseBranch}`);
  checksAgainstReference(reporter, currentBundles, reference);

  core.info("Submitting comment to PR");
  await submitCommentToPR({
    reporter,
    prNumber,
    githubToken,
    referenceSha: mobileMetaFile.workflow_run?.head_sha,
    currentSha: github.context.sha,
    title: "### Mobile Bundle Checks",
  });
}

const bundleSizeThreshold = 100 * 1024; // 100kb

function checksAgainstReference(
  reporter: Reporter,
  current: MobileMetaFile,
  reference: MobileMetaFile,
) {
  // diff on bundle size
  mobileMetafileKeys.forEach(slug => {
    const ref = reference[slug]?.size;
    const size = current[slug]?.size;
    core.info(`${slug} bundle size: ${formatSize(size)}`);
    if (!size) {
      reporter.error(`${slug} bundle size could not be inferred on this PR.`);
    } else if (!ref) {
      reporter.error(`${slug} bundle size could not be inferred on develop.`);
    } else if (size > ref + bundleSizeThreshold) {
      reporter.warning(
        `${slug} bundle size significantly increased: ${formatSize(ref)} -> ${formatSize(
          size,
        )}. Please check if this is expected.`,
      );
    } else if (size < ref - bundleSizeThreshold) {
      reporter.improvement(
        `${slug} bundle size decreased (${formatSize(ref)} -> ${formatSize(size)}). Thanks ❤️`,
      );
    }
  });
}

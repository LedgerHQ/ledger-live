import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  Metafiles,
  downloadMetafilesFromArtifact,
  getRecentArtifactFromBranch,
  retrieveLocalMetafiles,
  Reporter,
  submitCommentToPR,
  MetafileSlug,
  formatSize,
  getMetafileDuplicates,
  getMetafileBundleSize,
  formatMarkdownBoldList,
} from "./logic";

// here is the main logic of the action
async function main() {
  const githubToken = core.getInput("token");
  const prNumber = core.getInput("prNumber");
  // const artifactsFolder = core.getInput("artifactsFolder");
  const baseBranch = core.getInput("baseBranch");
  const octokit = github.getOctokit(githubToken);

  const latestLinux = await getRecentArtifactFromBranch(
    octokit,
    "linux-js-bundle-metafiles",
    baseBranch,
  );
  if (!latestLinux) {
    core.warning(`Could not find previous metadata files from ${baseBranch}`);
    return; // TODO handle failure when there is nothing to compare with
  }

  core.info(`Downloading most recent artifacts from ${baseBranch}`);
  const referenceMetafiles = await downloadMetafilesFromArtifact(
    githubToken,
    latestLinux.archive_download_url,
  );

  core.info(`Getting current builds metadata files`);
  const all = await Promise.all([
    retrieveLocalMetafiles("linux-js-bundle-metafiles"),
    retrieveLocalMetafiles("mac-js-bundle-metafiles"),
    retrieveLocalMetafiles("windows-js-bundle-metafiles"),
  ]);

  const reporter = new Reporter();

  core.info("Doing cross platform checks...");
  crossPlatformChecks(reporter, all, ["Linux", "Mac", "Windows"]);

  core.info(`Checking agains builds metadata files from ${baseBranch}`);
  checksAgainstReference(reporter, all[0], referenceMetafiles);

  core.info("Submitting comment to PR");
  await submitCommentToPR({
    reporter,
    prNumber,
    githubToken,
    referenceSha: latestLinux.workflow_run?.head_sha,
    currentSha: github.context.sha,
  });
}

// here is now the logic where we implement the checks

const bundleSizeThreshold = 100 * 1024; // 100kb

const slugsOfInterest: MetafileSlug[] = ["main", "renderer"];

// checks that compare the build between OSes
function crossPlatformChecks(reporter: Reporter, all: Metafiles[], osNames: string[]) {
  slugsOfInterest.forEach(slug => {
    const sizes = all.map(metafiles => getMetafileBundleSize(metafiles, slug));
    const ref = sizes[0];
    if (!ref) {
      reporter.error(`${slug} bundle size could not be inferred on ${osNames[0]}.`);
    } else {
      const isThereDiff = sizes.some(size => size && Math.abs(size - ref) > bundleSizeThreshold);
      if (isThereDiff) {
        reporter.error(
          `${slug} bundle size greatly differ between OS! ${osNames
            .map((name, i) => {
              const size = sizes[i];
              if (size) {
                return `${name}: ${formatSize(size)}`;
              } else {
                return `${name}: N/A`;
              }
            })
            .join(", ")}`,
        );
      }
    }
  });
}

// checks that compare one build against a reference (on the same OS)
function checksAgainstReference(reporter: Reporter, metafiles: Metafiles, reference: Metafiles) {
  // diff on the bundle size
  slugsOfInterest.forEach(slug => {
    const ref = getMetafileBundleSize(reference, slug);
    const size = getMetafileBundleSize(metafiles, slug);
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

  // diff on the lib duplicates state

  const newDuplicates: Record<string, string[]> = {};
  const removedDuplicates: Record<string, string[]> = {};
  for (const slug of slugsOfInterest) {
    const duplicatesRef = getMetafileDuplicates(reference, slug as MetafileSlug);
    const duplicates = getMetafileDuplicates(metafiles, slug as MetafileSlug);
    core.info(`${slug} duplicates: ${duplicates.join(", ")}`);
    const added = duplicates.filter(d => !duplicatesRef.includes(d));
    const removed = duplicatesRef.filter(d => !duplicates.includes(d));
    for (const lib of added) {
      if (!(lib in newDuplicates)) {
        newDuplicates[lib] = [slug];
      } else {
        newDuplicates[lib].push(slug);
      }
    }
    for (const lib of removed) {
      if (!(lib in removedDuplicates)) {
        removedDuplicates[lib] = [slug];
      } else {
        removedDuplicates[lib].push(slug);
      }
    }
  }
  for (const lib in newDuplicates) {
    const bundles = newDuplicates[lib];
    reporter.warning(
      `\`${lib}\` dependency is now duplicated in ${formatMarkdownBoldList(
        bundles,
      )}. [Read more](https://github.com/LedgerHQ/ledger-live/wiki/Dependencies-duplicates-management)`,
    );
  }
  for (const lib in removedDuplicates) {
    const bundles = removedDuplicates[lib];
    reporter.improvement(
      `\`${lib}\` library is no longer duplicated in ${formatMarkdownBoldList(bundles)}`,
    );
  }
}

main().catch(err => {
  core.setFailed(err);
});

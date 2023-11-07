import path from "path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  metafilesKeys,
  Metafiles,
  downloadMetafilesFromArtifact,
  getRecentArtifactFromBranch,
  retrieveLocalMetafiles,
  Reporter,
  submitCommentToPR,
  MetafileSlug,
  formatSize,
} from "./logic";

// here is the main logic of the action
async function main() {
  const githubToken = core.getInput("token");
  const prNumber = core.getInput("prNumber");
  const artifactsFolder = core.getInput("artifactsFolder");
  const baseBranch = core.getInput("baseBranch");
  const octokit = github.getOctokit(githubToken);

  const latestLinux = await getRecentArtifactFromBranch(
    octokit,
    "linux-js-bundle-metafiles",
    baseBranch,
  );
  if (!latestLinux) return; // TODO handle failure when there is nothing to compare with

  const referenceMetafiles = await downloadMetafilesFromArtifact(
    githubToken,
    latestLinux.archive_download_url,
  );

  const all = await Promise.all([
    retrieveLocalMetafiles(path.join(artifactsFolder, "linux-js-bundle-metafiles.zip")),
    retrieveLocalMetafiles(path.join(artifactsFolder, "mac-js-bundle-metafiles.zip")),
    retrieveLocalMetafiles(path.join(artifactsFolder, "windows-js-bundle-metafiles.zip")),
  ]);

  const reporter = new Reporter();

  crossPlatformChecks(reporter, all, ["Linux", "Mac", "Windows"]);

  checksAgainstReference(reporter, all[0], referenceMetafiles);

  await submitCommentToPR({ reporter, prNumber, githubToken });
}

// here is now the logic where we implement the checks

const bundleSizeThreshold = 100 * 1024; // 100kb

// checks that compare the build between OSes
function crossPlatformChecks(reporter: Reporter, all: Metafiles[], osNames: string[]) {
  const slugsOfInterest: MetafileSlug[] = ["main", "renderer"];

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
  const slugsOfInterest: MetafileSlug[] = ["main", "renderer"];

  slugsOfInterest.forEach(slug => {
    const ref = getMetafileBundleSize(reference, slug);
    const size = getMetafileBundleSize(metafiles, slug);
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

function getMetafileBundleSize(metafile: Metafiles, slug: MetafileSlug): number | undefined {
  const key = metafilesKeys[slug];
  if (key in metafile) {
    return metafile[key]?.outputs[`.webpack/${slug}.bundle.js`]?.bytes;
  }
}

main().catch(err => {
  core.setFailed(err);
});

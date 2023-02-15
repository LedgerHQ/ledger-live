import * as core from "@actions/core";
import * as github from "@actions/github";
import { promises as fs } from "fs";
import * as path from "path";

const main = async () => {
  const token = core.getInput("token");
  const isRelease = core.getBooleanInput("isRelease");
  const runId = Number(core.getInput("runId"));
  const artifactName = core.getInput("artifactName");
  const workspace = core.getInput("workspace");

  const octo = github.getOctokit(token);
  const context = github.context;

  const artifacts = await octo.rest.actions.listWorkflowRunArtifacts({
    repo: context.repo.repo,
    owner: context.repo.owner,
    run_id: runId,
  });

  core.info(isRelease ? "release build" : "prerelease build");

  let hash;
  if (isRelease) {
    hash = artifacts.data.artifacts.find((artifact) =>
      artifact.name.includes("hash")
    );
  }

  const builds = artifacts.data.artifacts.find((artifact) =>
    artifact.name.includes(artifactName)
  );

  try {
    if (isRelease) {
      core.info("downloading artifacts and hash resources");
      const [buildsDl, hashDl] = await Promise.all([
        octo.rest.actions.downloadArtifact({
          repo: context.repo.repo,
          owner: context.repo.owner,
          run_id: runId,
          archive_format: "zip",
          artifact_id: builds.id,
        }),
        octo.rest.actions.downloadArtifact({
          repo: context.repo.repo,
          owner: context.repo.owner,
          run_id: runId,
          archive_format: "zip",
          artifact_id: hash.id,
        }),
      ]);

      core.info("download done, writing to disk");

      await Promise.all([
        fs.writeFile(
          path.join(workspace, `${builds.name}.zip`),
          Buffer.from(buildsDl.data as any)
        ),
        fs.writeFile(
          path.join(workspace, `${hash.name}.zip`),
          Buffer.from(hashDl.data as any)
        ),
      ]);

      core.info("writing to disk done");
    } else {
      core.info("downloading artifacts resources");
      const buildsDl = await octo.rest.actions.downloadArtifact({
        repo: context.repo.repo,
        owner: context.repo.owner,
        run_id: runId,
        archive_format: "zip",
        artifact_id: builds.id,
      });

      core.info("download done, writing to disk");

      await fs.writeFile(
        path.join(workspace, `${builds.name}.zip`),
        Buffer.from(buildsDl.data as any)
      );
      core.info("writing to disk done");
    }
  } catch (error) {
    core.error("we hit an issue", error);
    throw error;
  }
};

main().catch((err) => core.setFailed(err));

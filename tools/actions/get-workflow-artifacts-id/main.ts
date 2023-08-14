import * as core from "@actions/core";
import * as github from "@actions/github";
// import { promises as fs } from "fs";
// import * as path from "path";

const main = async () => {
  const token = core.getInput("token");
  const isRelease = core.getBooleanInput("isRelease");
  const runId = Number(core.getInput("runId"));

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
    hash = artifacts.data.artifacts.find(artifact => artifact.name.includes("hash"));
    core.setOutput("hash", hash.id);
  }

  const builds = artifacts.data.artifacts.find(artifact => artifact.name.includes("builds"));

  core.setOutput("builds", builds.id);
};

main().catch(err => core.setFailed(err));

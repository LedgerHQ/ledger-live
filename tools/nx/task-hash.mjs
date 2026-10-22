#!/usr/bin/env node
/**
 * Prints the Nx hash of a target's configurations without running them, one `<configuration>=<hash>` line each.
 * CI uses the hash to look up `<cacheKeyPrefix>/<hash>` in the S3 cache before deciding whether a build job is needed.
 *
 * Usage: node tools/nx/task-hash.mjs <project> <target> <configuration...>
 * Example: node tools/nx/task-hash.mjs live-mobile e2e:bundle ios android
 *
 * Runs with NX_DAEMON=false so the hash comes from the same in-process hasher `nx run` uses on CI.
 */
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);
// nx run loads project .env files into the task env, so the hash must see them too
process.env.NX_LOAD_DOT_ENV_FILES = "true";
const { createProjectGraphAsync } = require("nx/src/project-graph/project-graph");
const { readNxJson } = require("nx/src/config/nx-json");
const {
  createTaskGraph,
  mapTargetDefaultsToDependencies,
} = require("nx/src/tasks-runner/create-task-graph");
const { createTaskHasher } = require("nx/src/hasher/create-task-hasher");
const { getTaskSpecificEnv } = require("nx/src/tasks-runner/task-env");

const args = process.argv.slice(2);
// --details also prints, on stderr, each input that makes up the hash, to compare two runs
const details = args.includes("--details");
const [project, target, ...configurations] = args.filter(arg => arg !== "--details");
if (!project || !target || configurations.length === 0) {
  console.error("Usage: node tools/nx/task-hash.mjs <project> <target> <configuration...>");
  process.exit(1);
}

const projectGraph = await createProjectGraphAsync({ exitOnError: true });
const nxJson = readNxJson();
const hasher = createTaskHasher(projectGraph, nxJson);
const extraTargetDependencies = mapTargetDefaultsToDependencies(nxJson.targetDefaults);

for (const configuration of configurations) {
  const taskGraph = createTaskGraph(
    projectGraph,
    extraTargetDependencies,
    [project],
    [target],
    configuration,
    {},
  );
  const task = taskGraph.tasks[`${project}:${target}:${configuration}`];
  if (!task) {
    console.error(`No task ${project}:${target}:${configuration} in the task graph`);
    process.exit(1);
  }
  const hash = await hasher.hashTask(task, taskGraph, getTaskSpecificEnv(task, projectGraph));
  console.log(`${configuration}=${hash.value}`);
  if (details) {
    console.error(JSON.stringify({ configuration, ...hash.details }, null, 2));
  }
}

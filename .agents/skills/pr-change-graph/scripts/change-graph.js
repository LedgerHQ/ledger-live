// The pr-change-graph skill's script: the Mermaid diagram of the branch, each changed file linked to its diff in
// the pull request, on stdout. `npm run build:skill` copies it into the skill, with the core modules it imports.
import { parseArgs } from "node:util";
import { readBranch } from "./core/branch.js";
import { filterGraph } from "./core/filter.js";
import { buildGraph } from "./core/graph.js";
import { layoutGraph } from "./core/layout.js";
import { diffUrl, normalizePullRequest } from "./core/links.js";
import { MAX_TEXT_SIZE, renderMermaid } from "./core/mermaid.js";

const USAGE = `Usage: node change-graph.js --pr <url> --base-branch <rev> [--head <rev>] [--code-only]

Mermaid change graph of the branch, run from anywhere inside the repository, each changed file linked to its
diff in the pull request.

  --pr <url>            The pull request
  --base-branch <rev>   Branch the merge base is taken with, such as origin/develop
  --head <rev>          Head commit (default: HEAD)
  --code-only           Only code files, without dependency changes
`;

try {
  process.stdout.write(run(process.argv.slice(2)));
} catch (error) {
  process.stderr.write(`change-graph: ${/** @type {Error} */ (error).message}\n`);
  process.exitCode = 1;
}

/**
 * The diagram, or the usage with --help. Fails on an empty diagram, or one over the characters GitHub renders.
 * @param {string[]} args
 */
function run(args) {
  const { values } = parseArgs({
    args,
    options: {
      pr: { type: "string" },
      "base-branch": { type: "string" },
      head: { type: "string" },
      "code-only": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) return USAGE;
  const pullRequest = normalizePullRequest(values.pr);
  const baseBranch = values["base-branch"];
  if (!pullRequest || !baseBranch)
    throw new Error("Pass --pr and --base-branch (--help for the usage)");

  const branch = readBranch({ cwd: process.cwd(), baseBranch, head: values.head });
  const graph = filterGraph(buildGraph(branch), { codeOnly: values["code-only"] });
  if (graph.nodes.length === 0) {
    throw new Error(
      "Nothing to draw: the branch only changes files the diagram leaves out, such as tests, package.json files " +
        "and files outside workspace packages",
    );
  }
  const mermaid = renderMermaid(layoutGraph(graph), {
    ...branch.commits,
    link: rel => diffUrl(pullRequest, rel),
  });
  if (mermaid.length > MAX_TEXT_SIZE) {
    throw new Error(
      `The diagram has ${mermaid.length.toLocaleString("en-US")} characters, more than the ` +
        `${MAX_TEXT_SIZE.toLocaleString("en-US")} GitHub renders` +
        (values["code-only"] ? "" : "; run again with --code-only to draw code files only"),
    );
  }
  return mermaid;
}

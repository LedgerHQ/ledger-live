import { getProject } from "../config/projects";
import { MaestroContext } from "../context";
import { runAddAccountSpec } from "../specs/addAccount";
import { initBridgeGlobals } from "../runtime/bridge";

type SpecName = "addAccount";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function runSpec(ctx: MaestroContext, spec: SpecName) {
  switch (spec) {
    case "addAccount":
      return runAddAccountSpec(ctx);
  }
}

async function main() {
  initBridgeGlobals();

  const project = getProject(getArg("project"));
  const spec = getArg("spec");

  if (spec !== "addAccount") {
    throw new Error("Missing or invalid --spec. Use: addAccount");
  }

  const ctx = new MaestroContext(project);
  await runSpec(ctx, spec);
}

void main().catch(error => {
  console.error(error);
  process.exit(1);
});

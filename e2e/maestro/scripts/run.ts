import { getProject } from "../config/projects";
import { MaestroContext } from "../context";
import { initBridgeGlobals } from "../runtime/bridge";
import { specs, SpecName } from "../specs";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isSpecName(value: string | undefined): value is SpecName {
  return Boolean(value && value in specs);
}

async function main() {
  initBridgeGlobals();

  const project = getProject(getArg("project"));
  const spec = getArg("spec");

  if (!isSpecName(spec)) {
    throw new Error(`Missing or invalid --spec. Use one of: ${Object.keys(specs).join(", ")}`);
  }

  const ctx = new MaestroContext(project);
  await specs[spec](ctx);
}

void main().catch(error => {
  console.error(error);
  process.exit(1);
});

import { getProject, MaestroProject } from "../config/projects";
import { MaestroContext } from "../context";
import { MaestroAllureReporter, setActiveReporter } from "../runtime/allure";
import { initBridgeGlobals } from "../runtime/globals";
import { specs, SpecName } from "../specs";

type CliArgs = { project?: string; spec?: string };

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2).filter(arg => arg !== "--");
  const result: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--project") {
      result.project = args[++i];
    } else if (arg.startsWith("--project=")) {
      result.project = arg.slice("--project=".length);
    } else if (arg.startsWith("--")) {
      i++; // skip an unknown flag's value
    } else if (result.spec === undefined) {
      result.spec = arg;
    }
  }
  return result;
}

function resolveSpecName(selector: string): SpecName {
  const name = selector.replace(/.*[/\\]/, "").replace(/\.tsx?$/, "");
  if (!(name in specs)) {
    throw new Error(`Unknown spec "${selector}". Use one of: ${Object.keys(specs).join(", ")}`);
  }
  return name as SpecName;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

async function runSpec(project: MaestroProject, name: SpecName): Promise<void> {
  initBridgeGlobals();
  const ctx = new MaestroContext(project);
  await specs[name](ctx);
}

async function main() {
  const { project: projectId, spec: selector } = parseArgs(process.argv);
  const project = getProject(projectId);
  const names: SpecName[] = selector
    ? [resolveSpecName(selector)]
    : (Object.keys(specs) as SpecName[]);

  const reporter = new MaestroAllureReporter(project);
  setActiveReporter(reporter);
  await reporter.writeEnvironmentInfo();

  const failed: SpecName[] = [];
  const startedAll = Date.now();
  for (const name of names) {
    console.info(`\n[maestro] ${name} on ${project.id} - start`);
    const startedAt = Date.now();
    reporter.startTest(name);
    try {
      await runSpec(project, name);
      reporter.endTest();
      console.info(`[maestro] ${name} - PASS (${formatDuration(Date.now() - startedAt)})`);
    } catch (error) {
      reporter.endTest(error);
      failed.push(name);
      console.error(`[maestro] ${name} - FAIL (${formatDuration(Date.now() - startedAt)})`);
      console.error(error);
    }
  }
  setActiveReporter(undefined);

  const total = formatDuration(Date.now() - startedAll);
  if (failed.length > 0) {
    throw new Error(
      `${failed.length}/${names.length} spec(s) failed in ${total}: ${failed.join(", ")}`,
    );
  }
  console.info(`\n[maestro] ${names.length} spec(s) passed on ${project.id} in ${total}.`);
}

void main().catch(error => {
  console.error(error);
  process.exit(1);
});

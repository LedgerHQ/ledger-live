// Names each check of `pnpm lint:arch` and of the CI boundaries job by its Nx target, or by its pnpm
// script when it is not an Nx target, so the two lists compare.
const NX_RUN_MANY = /\bnx\s+run-many\b.*?(?:-t|--targets?)[=\s]+(\S+)/;
const NX_RUN = /\bnx\s+run\s+[^\s:]+:(\S+)/;
const PNPM_SCRIPT = /^pnpm\s+(?:run\s+)?([\w:-]+)$/;
const RUN_LINE = /^\s*run:\s*(.+?)\s*$/gm;

const checkName = (command: string, scripts: Record<string, string>): string | null => {
  const nxTarget = NX_RUN_MANY.exec(command)?.[1] ?? NX_RUN.exec(command)?.[1];
  if (nxTarget) return nxTarget;
  const script = PNPM_SCRIPT.exec(command.trim())?.[1];
  if (!script) return null;
  const scriptCommand = scripts[script] ?? "";
  return NX_RUN_MANY.test(scriptCommand) || NX_RUN.test(scriptCommand)
    ? checkName(scriptCommand, scripts)
    : script;
};

export const lintArchChecks = (scripts: Record<string, string>): (string | null)[] =>
  (scripts["lint:arch"] ?? "").split("&&").map(command => checkName(command, scripts));

const enforceBoundariesJob = (workflow: string): string => {
  const lines = workflow.split("\n");
  const start = lines.findIndex(line => /^\s*enforce-boundaries:\s*$/.test(line));
  if (start < 0) return workflow;
  const jobIndent = lines[start].match(/^(\s*)/)?.[1].length ?? 0;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (indent <= jobIndent && /^[\w-]+:\s*$/.test(line)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
};

// Nx test harness steps in the boundaries job, not part of lint:arch.
const BOUNDARIES_JOB_SKIP = new Set(["test", "test:workspace"]);

// Other enforce-boundaries steps that are not lint:arch parity targets.
const BOUNDARIES_JOB_OTHER_STEPS = [
  /^pnpm install\b/,
  /^node --test "tools\/skills-check\/test\//,
  /^pnpm exec knip\b/,
];

const isOtherBoundariesStep = (command: string): boolean =>
  BOUNDARIES_JOB_OTHER_STEPS.some(pattern => pattern.test(command));

export const boundariesJobChecks = (
  workflow: string,
  scripts: Record<string, string>,
): { checks: string[]; unclassified: { line: number; command: string }[] } => {
  const job = enforceBoundariesJob(workflow);
  const checks: string[] = [];
  const unclassified: { line: number; command: string }[] = [];
  for (const match of job.matchAll(RUN_LINE)) {
    const command = match[1];
    const line = job.slice(0, match.index).split("\n").length;
    const name = checkName(command, scripts);
    if (name === null) {
      if (!isOtherBoundariesStep(command)) unclassified.push({ line, command });
      continue;
    }
    if (BOUNDARIES_JOB_SKIP.has(name)) continue;
    checks.push(name);
  }
  return { checks, unclassified };
};

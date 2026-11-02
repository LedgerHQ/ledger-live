// Names each check of `pnpm lint:arch` and of the CI boundaries job by its Nx target, or by its pnpm
// script when it is not an Nx target, so the two lists compare.
const NX_RUN_MANY = /\bnx\s+run-many\b.*?(?:-t|--targets?)[=\s]+(\S+)/;
const NX_RUN = /\bnx\s+run\s+[^\s:]+:(\S+)/;
const PNPM_SCRIPT = /^pnpm\s+(?:run\s+)?([\w:-]+)$/;
const RUN_LINE = /^\s*run:\s*(.+?)\s*$/gm;

const checkName = (command, scripts) => {
  const nxTarget = NX_RUN_MANY.exec(command)?.[1] ?? NX_RUN.exec(command)?.[1];
  if (nxTarget) return nxTarget;
  const script = PNPM_SCRIPT.exec(command.trim())?.[1];
  if (!script) return null;
  const scriptCommand = scripts[script] ?? "";
  return NX_RUN_MANY.test(scriptCommand) || NX_RUN.test(scriptCommand)
    ? checkName(scriptCommand, scripts)
    : script;
};

export const lintArchChecks = scripts =>
  (scripts["lint:arch"] ?? "").split("&&").map(command => checkName(command, scripts));

export const boundariesJobChecks = (workflow, scripts) =>
  [...workflow.matchAll(RUN_LINE)]
    .map(([, command]) => checkName(command, scripts))
    .filter(name => name !== null && name !== "test");

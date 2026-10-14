import { lastValueFrom, Observable } from "rxjs";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import type { SpeculosDevice } from "@ledgerhq/live-e2e-shared/speculos";
import { runCliStep } from "tests/utils/allureUtils";
import { cleanSpeculos, launchSpeculos } from "tests/utils/speculosUtils";

export type CliCommand = ((
  userdataPath?: string,
) => Observable<unknown> | Promise<unknown> | string) & {
  canUseGeneratedUserdata?: () => boolean;
};

async function executeCliCommand(cmd: CliCommand, userdataDestinationPath?: string) {
  // Factories tag commands via `named(...)`; treat the inferred "cmd" (from `const cmd = …`
  // factories) as unnamed so a missed factory degrades to "anonymous" (QAA-1433).
  const label = cmd.name && cmd.name !== "cmd" ? cmd.name : "anonymous";
  return runCliStep(label, async () => {
    const promise = await cmd(`${userdataDestinationPath}/app.json`);
    return promise instanceof Observable ? await lastValueFrom(promise) : await promise;
  });
}

const runInOrder = <T>(items: readonly T[], run: (item: T) => Promise<unknown>): Promise<void> =>
  items.reduce<Promise<void>>(
    (previous, item) => previous.then(() => run(item).then(() => undefined)),
    Promise.resolve(),
  );

export async function executeCliCommands(
  commands: CliCommand[] | undefined,
  userdataDestinationPath?: string,
) {
  if (!commands?.length) return;

  await runInOrder(commands, cmd => executeCliCommand(cmd, userdataDestinationPath));
}

export function canSkipSpeculosLaunch(
  speculosForSetupOnly: boolean | undefined,
  cliCommands: CliCommand[] | undefined,
): boolean {
  return (
    !!speculosForSetupOnly &&
    !!cliCommands?.length &&
    cliCommands.every(cmd => cmd.canUseGeneratedUserdata?.() ?? false)
  );
}

export async function runCliCommandsOnLaunchedApps(
  commands: { app: AppInfos; cmd: CliCommand }[],
  testTitle: string,
  userdataDestinationPath?: string,
): Promise<SpeculosDevice | undefined> {
  const commandsByApp = new Map<string, { app: AppInfos; cmds: CliCommand[] }>();
  for (const { app, cmd } of commands) {
    const grouped = commandsByApp.get(app.name);
    if (grouped) {
      grouped.cmds.push(cmd);
    } else {
      commandsByApp.set(app.name, { app, cmds: [cmd] });
    }
  }

  const runOnApp = async (app: AppInfos, cmds: CliCommand[]): Promise<SpeculosDevice> => {
    const device = await launchSpeculos(app.name, testTitle);
    try {
      await executeCliCommands(cmds, userdataDestinationPath);
    } finally {
      await cleanSpeculos(device);
    }
    return device;
  };

  const [first, ...rest] = [...commandsByApp.values()];
  if (!first) return undefined;

  return rest.reduce(
    (previous, { app, cmds }) => previous.then(() => runOnApp(app, cmds)),
    runOnApp(first.app, first.cmds),
  );
}

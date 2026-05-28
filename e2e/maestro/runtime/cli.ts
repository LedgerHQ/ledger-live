import { Observable, isObservable, lastValueFrom } from "rxjs";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { MaestroContext } from "../context";
import { SpeculosName } from "../devices/speculos";

export type CliCommand = (
  userdataPath?: string,
  speculosAddress?: string,
) => Observable<unknown> | Promise<unknown> | string;

export type CliCommandOnApp = {
  app: SpeculosName;
  cmd: CliCommand;
};

async function executeCliCommand(
  cmd: CliCommand,
  speculosAddress?: string,
): Promise<unknown> {
  const resultOrPromise = await cmd(undefined, speculosAddress);
  if (isObservable(resultOrPromise)) {
    return lastValueFrom(resultOrPromise);
  }
  return resultOrPromise;
}

/**
 * For each unique speculos app referenced in `cliCommandsOnApp`, launch a
 * dedicated Speculos instance, run the matching CLI commands against it,
 * then stop it. Cleanup happens in finally so a failing command still
 * tears down its Speculos.
 */
export async function runCliCommandsOnApp(
  ctx: MaestroContext,
  cliCommandsOnApp: CliCommandOnApp[],
): Promise<void> {
  if (cliCommandsOnApp.length === 0) return;

  const grouped = new Map<SpeculosName, CliCommand[]>();
  for (const { app, cmd } of cliCommandsOnApp) {
    const existing = grouped.get(app);
    if (existing) {
      existing.push(cmd);
    } else {
      grouped.set(app, [cmd]);
    }
  }

  for (const [appName, cmds] of grouped.entries()) {
    const speculos = await ctx.speculos.start(appName, `maestro-cli-${appName}`);
    ctx.speculos.registerForCli(speculos.port);
    const speculosAddress = ctx.speculos.address(speculos.port);
    try {
      for (const cmd of cmds) {
        await executeCliCommand(cmd, speculosAddress);
      }
    } finally {
      try {
        await ctx.speculos.cleanup();
      } catch (error) {
        console.warn(
          `[cli] cleanup of ${appName} CLI Speculos failed:`,
          sanitizeError(error),
        );
      }
    }
  }
}

// Wraps defineCommand to log stack traces to stderr when DEBUG=wallet-cli.
// Intercepts errors after the handler but before bunli's internal catch.
import { defineCommand as _defineCommand } from "@bunli/core";
import type { Handler, Options, RunnableCommand } from "@bunli/core";
import createDebug from "debug";

export { option } from "@bunli/core";

function logErrorStack(e: unknown): void {
  if (!createDebug.enabled("wallet-cli")) return;
  const text = e instanceof Error ? (e.stack ?? e.message) : Bun.inspect(e);
  process.stderr.write(text.endsWith("\n") ? text : text + "\n");
}

export function defineCommand<
  TOptions extends Options = Options,
  TStore = {},
  TName extends string = string,
>(
  cmd: RunnableCommand<TOptions, TStore> & { name: TName },
): RunnableCommand<TOptions, TStore> & { name: TName } {
  const orig = cmd.handler as Handler<any>;
  if (!orig) throw new Error(`Command "${cmd.name}" must have a handler`);
  return _defineCommand({
    ...cmd,
    handler: async (args: any) => {
      try {
        return await orig(args);
      } catch (e) {
        logErrorStack(e);
        throw e;
      }
    },
  });
}

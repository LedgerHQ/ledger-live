import { lastValueFrom, Observable } from "rxjs";
import commands from "@ledgerhq/live-cli/src/commands-index";

export type CommandArgs<T> = T extends Command<infer U> ? U : never;
export type CommandName = keyof typeof commands; // This type represents the keys of the commands object

// Existing command type
type Command<TArgs = any> = {
  description: string;
  args: { name: string; alias?: string; type: Function; desc: string }[];
  job: (arg: TArgs) => Promise<any> | Observable<any>;
};

// Define a function to call commands with inferred argument types
export async function runCliCommand<T extends CommandName>(
  commandName: T,
  args: CommandArgs<(typeof commands)[T]>, // Use inferred argument types
): Promise<any> {
  const command = commands[commandName];
  const result = await lastValueFrom(command.job(args));
  console.log(`CLI command result: ${result}`);
}

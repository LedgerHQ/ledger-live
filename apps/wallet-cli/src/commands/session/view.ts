import { defineCommand } from "@bunli/core";
import { z } from "zod";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../../output";

export const sessionViewInputSchema = z.object({});

export type SessionViewInput = z.infer<typeof sessionViewInputSchema>;

export function sessionViewContext(_input: SessionViewInput = {}): OutputContext {
  return { command: "session view", network: "all" };
}

export async function sessionViewCore(_input: SessionViewInput, out: CommandOutput): Promise<void> {
  await out.run(async () => {
    const { accounts } = await Session.read();
    out.sessionView(accounts);
  });
}

export default defineCommand({
  name: "view",
  description: "Display all accounts stored in the current session",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), sessionViewContext());
    await sessionViewCore({}, out);
  },
});

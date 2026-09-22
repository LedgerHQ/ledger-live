import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";

const PROFILE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/;

export default defineCommand({
  name: "show",
  description: "Show one Agent Intent profile's detail (never reveals its secret key).",
  options: {
    profile: option(
      z
        .string()
        .regex(
          PROFILE_ID_RE,
          "Profile id must contain only letters, numbers, dots, underscores, and dashes.",
        ),
      { description: "Local profile id." },
    ),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent show",
      network: "all",
      account: flags.profile,
    });
    await out.run(async () => {
      const session = await Session.read();
      const profile = session.getAgentIntentProfile(flags.profile);
      if (!profile) {
        throw new Error(`No Agent Intent profile named "${flags.profile}".`);
      }
      out.agentIntentProfileShow(profile);
    });
  },
});

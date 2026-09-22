import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../../agent-intent/profile-format";
import { createCommandOutput } from "../../output";

export default defineCommand({
  name: "show",
  description: "Show one Agent Intent profile's detail (never reveals its secret key).",
  options: {
    profile: option(z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE), {
      description: "Local profile id.",
    }),
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

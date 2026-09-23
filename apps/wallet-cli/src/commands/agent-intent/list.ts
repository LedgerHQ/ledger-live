import { defineCommand } from "@bunli/core";
import { Session } from "../../session/session-store";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput } from "../../output";
import { writeStderr } from "../../shared/ui";
import { formatInvalidAgentIntentProfilesWarning } from "../../agent-intent/profile-format";

export default defineCommand({
  name: "list",
  description: "List local Agent Intent profiles (never reveals secret keys).",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "agent-intent list",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      const warning = formatInvalidAgentIntentProfilesWarning(session.invalidAgentIntentProfileIds);
      if (warning) writeStderr(warning);
      out.agentIntentProfiles(session.agentIntentProfiles);
    });
  },
});

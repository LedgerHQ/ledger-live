import { defineCommand } from "@bunli/core";
import { colors, writeStdout } from "../../shared/ui";
import { listSkills } from "../../skills/registry";
import { outputOption, resolveOutputFormat } from "../inputs";
import { emitJson, failSkill, skillEnvelope } from "./shared";

export default defineCommand({
  name: "list",
  description: "List the agent skills embedded in this wallet-cli binary",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const format = resolveOutputFormat(flags.output);
    try {
      const skills = listSkills();

      if (format === "json") {
        emitJson(skillEnvelope("skill list", { skills }));
        return;
      }

      if (skills.length === 0) {
        writeStdout(colors.dim("No skills embedded."));
        return;
      }

      const maxName = Math.max(...skills.map(s => s.name.length));
      for (const s of skills) {
        writeStdout(`${colors.bold(s.name.padEnd(maxName))}  ${colors.dim(s.description)}`);
      }
    } catch (e) {
      failSkill(format, "skill list", e);
    }
  },
});

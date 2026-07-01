import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { writeStdout } from "../../shared/ui";
import { getSkill, listSkills, renderSkillMarkdown } from "../../skills/registry";
import { outputOption, resolveOutputFormat } from "../inputs";
import { emitJson, failSkill, skillEnvelope } from "./shared";

export default defineCommand({
  name: "retrieve",
  description:
    "Print an embedded skill's content (default SKILL.md). Use --file to print a reference file.",
  options: {
    file: option(z.string().min(1).optional(), {
      description: "Relative file to print, e.g. references/business-logic.md (default: SKILL.md).",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const format = resolveOutputFormat(flags.output);
    try {
      const name = positional[0];
      if (!name) {
        const available = listSkills()
          .map(s => s.name)
          .join(", ");
        throw new Error(
          `Missing skill name. Usage: skill retrieve <name>. Available skills: ${available || "(none)"}. Run \`skill list\` for descriptions.`,
        );
      }

      const skill = getSkill(name);
      if (!skill) {
        const available = listSkills()
          .map(s => s.name)
          .join(", ");
        throw new Error(
          `Skill "${name}" not found. Available skills: ${available || "(none)"}. Run \`skill list\`.`,
        );
      }

      const file = flags.file ?? "SKILL.md";
      const content = renderSkillMarkdown(skill, file);

      if (format === "json") {
        emitJson(
          skillEnvelope("skill retrieve", { name: skill.name, files: [{ path: file, content }] }),
        );
        return;
      }

      writeStdout(content);
    } catch (e) {
      failSkill(format, "skill retrieve", e);
    }
  },
});

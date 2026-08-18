import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { colors, writeStdout } from "../../shared/ui";
import {
  CLI_VERSION,
  DEFAULT_AGENT,
  SUPPORTED_AGENTS,
  getAllSkills,
  getSkill,
  getSoleSkill,
  listSkills,
  resolveInstallRoot,
  writeSkill,
  type SkillManifest,
} from "../../skills/registry";
import { outputOption, resolveOutputFormat } from "../inputs";
import { emitJson, failSkill, skillEnvelope } from "./shared";

export default defineCommand({
  name: "install",
  description:
    "Install an embedded skill onto disk for an agent (claude/cursor/codex/agents) or a custom --dir.",
  options: {
    agent: option(z.string().min(1).optional(), {
      description: `Target agent: ${SUPPORTED_AGENTS.join(", ")}. Default: ${DEFAULT_AGENT}.`,
    }),
    global: option(z.boolean().default(false), {
      description:
        "Install under the user home directory instead of the current working directory.",
      argumentKind: "flag",
    }),
    dir: option(z.string().min(1).optional(), {
      description: "Explicit destination directory (overrides --agent and --global).",
    }),
    all: option(z.boolean().default(false), {
      description: "Install every embedded skill.",
      argumentKind: "flag",
    }),
    force: option(z.boolean().default(false), {
      description: "Overwrite existing skill files if they already exist.",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const format = resolveOutputFormat(flags.output);
    try {
      const root = resolveInstallRoot({ agent: flags.agent, global: flags.global, dir: flags.dir });

      const skillsToInstall: SkillManifest[] = [];
      if (flags.all) {
        skillsToInstall.push(...getAllSkills());
      } else {
        const name = positional[0] ?? getSoleSkill()?.name;
        if (!name) {
          throw new Error(
            `Missing skill name. Usage: skill install <name> [--agent ${SUPPORTED_AGENTS.join("|")}] [--global] [--dir <path>]. Or use --all.`,
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
        skillsToInstall.push(skill);
      }

      const installed: string[] = [];
      for (const skill of skillsToInstall) {
        installed.push(...(await writeSkill(skill, root, { force: flags.force })));
      }

      if (format === "json") {
        emitJson(
          skillEnvelope("skill install", {
            root,
            cliVersion: CLI_VERSION,
            skills: skillsToInstall.map(s => s.name),
            contentHashes: Object.fromEntries(skillsToInstall.map(s => [s.name, s.contentHash])),
            installed,
          }),
        );
        return;
      }

      writeStdout(
        `Installed ${colors.bold(String(skillsToInstall.length))} skill(s) to ${colors.dim(root)}:`,
      );
      for (const p of installed) {
        writeStdout(`  ${p}`);
      }
    } catch (e) {
      failSkill(format, "skill install", e);
    }
  },
});

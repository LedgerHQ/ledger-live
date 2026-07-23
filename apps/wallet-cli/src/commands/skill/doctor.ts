import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { CliProcessExitError } from "../../cli-process-exit-error";
import { colors, writeStdout } from "../../shared/ui";
import {
  getSkill,
  scanInstalledSkills,
  writeSkill,
  type SkillDiagnosis,
} from "../../skills/registry";
import { outputOption, resolveOutputFormat } from "../inputs";
import { emitJson, failSkill, skillEnvelope } from "./shared";

/** Short 8-char prefix of a hash, or a placeholder when absent. */
function short(hash: string | undefined): string {
  return hash ? hash.slice(0, 8) : "--------";
}

function formatLine(d: SkillDiagnosis): string {
  const installed = d.installedVersion ? `${d.installedVersion}@${short(d.installedHash)}` : "none";
  const shipped = `${d.shippedVersion}@${short(d.shippedHash)}`;
  return `${colors.bold(d.name)}  ${d.status}  installed ${installed} -> shipped ${shipped}  ${colors.dim(d.root)}`;
}

/**
 * Reinstall the drifting skills that `--fix` should heal, returning the diagnoses
 * that were acted on. `outdated`/`missing` always heal; `modified-locally` only
 * with `--force`, so we never silently overwrite local edits. Each entry carries
 * its `root`, so the same skill healed in multiple scan roots stays distinct
 * (a bare name array would collapse to ambiguous duplicates under `--global`).
 */
async function applyFixes(diagnoses: SkillDiagnosis[], force: boolean): Promise<SkillDiagnosis[]> {
  const fixed: SkillDiagnosis[] = [];
  for (const d of diagnoses) {
    const skill = getSkill(d.name);
    if (!skill) continue;
    const shouldFix =
      d.status === "outdated" ||
      d.status === "missing" ||
      (d.status === "modified-locally" && force);
    if (!shouldFix) continue;
    await writeSkill(skill, d.root, { force: true });
    fixed.push(d);
  }
  return fixed;
}

/** Print the human-readable doctor report (skill lines, fix count, drift summary). */
function renderHumanReport(
  results: SkillDiagnosis[],
  fixed: SkillDiagnosis[],
  remainingDrift: SkillDiagnosis[],
  opts: { fix: boolean; force: boolean },
): void {
  for (const d of results) {
    writeStdout(formatLine(d));
  }
  if (opts.fix && fixed.length > 0) {
    writeStdout(`Fixed ${colors.bold(String(fixed.length))} skill(s).`);
  }
  if (remainingDrift.length > 0) {
    writeStdout(`${colors.bold(String(remainingDrift.length))} skill(s) still drifting.`);
  } else {
    writeStdout("All skills up-to-date.");
  }
  const stillModified = remainingDrift.filter(d => d.status === "modified-locally");
  // Only suppress the hint once the user has actually attempted an overwrite
  // (`--fix --force`); `--force` alone overwrites nothing, so the hint still helps.
  if (stillModified.length > 0 && !(opts.fix && opts.force)) {
    writeStdout(
      colors.dim(
        `Locally modified skill(s) left untouched: ${stillModified
          .map(d => `${d.name} (${d.root})`)
          .join(", ")}. Re-run with --fix --force to overwrite.`,
      ),
    );
  }
}

export default defineCommand({
  name: "doctor",
  description:
    "Diagnose drift between installed skills and the skills shipped in this wallet-cli, with a conservative --fix self-heal.",
  options: {
    global: option(z.boolean().default(false), {
      description: "Also scan the user home directory (in addition to the current directory).",
      argumentKind: "flag",
    }),
    dir: option(z.string().min(1).optional(), {
      description: "Scan an explicit directory instead of the agent skill directories.",
    }),
    fix: option(z.boolean().default(false), {
      description: "Reinstall outdated and missing skills (does not touch locally modified ones).",
      argumentKind: "flag",
    }),
    force: option(z.boolean().default(false), {
      description: "With --fix, also overwrite skills that were modified locally.",
      argumentKind: "flag",
    }),
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const format = resolveOutputFormat(flags.output);
    let hasDrift = false;
    try {
      const scanOptions = { global: flags.global, dir: flags.dir };
      const initial = await scanInstalledSkills(scanOptions);
      const fixed = flags.fix ? await applyFixes(initial, flags.force) : [];

      // Re-diagnose after any fixes so the reported state reflects disk truth.
      const results = flags.fix ? await scanInstalledSkills(scanOptions) : initial;
      const remainingDrift = results.filter(d => d.status !== "up-to-date");
      hasDrift = remainingDrift.length > 0;

      if (format === "json") {
        emitJson(skillEnvelope("skill doctor", { fixed, remainingDrift, results }));
      } else {
        renderHumanReport(results, fixed, remainingDrift, { fix: flags.fix, force: flags.force });
      }
    } catch (e) {
      failSkill(format, "skill doctor", e);
    }

    if (hasDrift) {
      throw new CliProcessExitError(1);
    }
  },
});

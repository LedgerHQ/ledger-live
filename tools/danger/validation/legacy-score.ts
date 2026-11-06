import {
  computeLegacyScore,
  formatReport,
  GREEN_ABOVE,
  MIN_LINES,
  RED_BELOW,
  THANKS_REMOVED,
  type ChangedFile,
} from "../legacy-score";

const OVERRIDE_LABEL = "legacy-code-approved";

async function validateLegacyScore() {
  try {
    const { owner, repo, number } = danger.github.thisPR;
    const files: ChangedFile[] = await danger.github.api.paginate(
      danger.github.api.pulls.listFiles,
      { owner, repo, pull_number: number, per_page: 100 },
    );
    const report = computeLegacyScore(files);

    if (report.legacyRemoved >= THANKS_REMOVED) {
      message(`${report.legacyRemoved} lines removed from legacy areas, thanks! 🧹`);
    }
    if (report.newLines + report.legacyLines < MIN_LINES || report.score > GREEN_ABOVE) return;

    if (report.score < RED_BELOW) {
      const labels = new Set(
        danger.github.issue.labels.map((label: { name: string }) => label.name),
      );
      const summary = `Only ${Math.floor(report.score * 100)}% of the new code lands in the new architecture layers: move it out of \`libs/\` and app feature folders into \`shared/\`, \`domain/\` or \`features/\`. See the details below.`;
      if (labels.has(OVERRIDE_LABEL)) warn(summary);
      else fail(`${summary} Add the \`${OVERRIDE_LABEL}\` label if the legacy code is intended.`);
    }
    markdown(formatReport(report));
  } catch (error) {
    // A scoring failure must not block the PR
    console.warn("Could not compute the architecture score", error);
  }
}

export default validateLegacyScore;

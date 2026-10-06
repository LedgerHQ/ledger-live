import { estimateNodeModulesSizeDelta } from "../node-modules-size";

const LABEL = "deps-size";
const THRESHOLD_MB = 50;

async function validateNodeModulesSize() {
  // Informational check: it must never fail the required "Validate PR conventions" job
  try {
    const { owner, repo, number } = danger.github.thisPR;
    const issue = { owner, repo, issue_number: number };
    const hasLabel = danger.github.issue.labels.some(
      (label: { name: string }) => label.name === LABEL,
    );
    const files: string[] = [
      ...danger.git.modified_files,
      ...danger.git.created_files,
      ...danger.git.deleted_files,
    ];

    // Without a lockfile change there is no delta, but a label from an earlier push must go
    const report = files.includes("pnpm-lock.yaml")
      ? await estimateNodeModulesSizeDelta(THRESHOLD_MB)
      : null;
    const exceeds = report?.exceedsThreshold ?? false;

    if (report && exceeds) markdown(report.markdown);
    if (exceeds && !hasLabel) {
      await danger.github.api.issues.addLabels({ ...issue, labels: [LABEL] });
    } else if (!exceeds && hasLabel) {
      await danger.github.api.issues.removeLabel({ ...issue, name: LABEL });
    }
  } catch (error) {
    console.warn("Could not estimate the node_modules size delta", error);
  }
}

export default validateNodeModulesSize;

import { estimateNodeModulesSizeDelta, formatMb } from "../node-modules-size";

const LABEL = "deps-size";
const OVERRIDE_LABEL = "deps-size-approved";
const WARN_MB = 10;
const FAIL_MB = 100;
const SHRINK_MB = 10;

async function validateNodeModulesSize() {
  try {
    const { owner, repo, number } = danger.github.thisPR;
    const issue = { owner, repo, issue_number: number };
    const labels = new Set(danger.github.issue.labels.map((label: { name: string }) => label.name));
    const files: string[] = [
      ...danger.git.modified_files,
      ...danger.git.created_files,
      ...danger.git.deleted_files,
    ];

    // Without a lockfile change there is no delta, but a label from an earlier push must go
    const report = files.includes("pnpm-lock.yaml") ? await estimateNodeModulesSizeDelta() : null;
    const deltaMb = (report?.deltaBytes ?? 0) / 1e6;
    const grows = deltaMb >= WARN_MB;

    if (report && deltaMb >= FAIL_MB && !labels.has(OVERRIDE_LABEL)) {
      fail(
        `node_modules grows by ${formatMb(report.deltaBytes)} (limit +${FAIL_MB} MB). Reduce it, or add the \`${OVERRIDE_LABEL}\` label if the growth is intended.`,
      );
    } else if (report && grows) {
      warn(`node_modules grows by ${formatMb(report.deltaBytes)}, see the details below.`);
    } else if (report && deltaMb <= -SHRINK_MB) {
      message(`node_modules shrinks by ${formatMb(report.deltaBytes)}, thanks!`);
    }
    if (report && (grows || deltaMb <= -SHRINK_MB)) markdown(report.markdown);

    if (grows && !labels.has(LABEL)) {
      await danger.github.api.issues.addLabels({ ...issue, labels: [LABEL] });
    } else if (!grows && labels.has(LABEL)) {
      await danger.github.api.issues.removeLabel({ ...issue, name: LABEL });
    }
  } catch (error) {
    // An estimation failure must not block the PR
    console.warn("Could not estimate the node_modules size delta", error);
  }
}

export default validateNodeModulesSize;

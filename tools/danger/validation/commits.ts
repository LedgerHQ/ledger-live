import { lintCommitMessage } from "../commitlint";
import { isMergeConflictsPr } from "../pull-request";

type Offender = {
  sha: string;
  subject: string;
  problems: string[];
};

async function validateCommits() {
  if (isMergeConflictsPr(danger.github.pr.title)) return;

  const commits: { sha: string; message: string }[] = danger.git.commits ?? [];
  const offenders: Offender[] = [];

  for (const { sha, message } of commits) {
    const { errors, warnings } = await lintCommitMessage(message);

    warnings.forEach(({ message: warning }) => {
      warn(`Commit \`${shortSha(sha)}\`: ${warning}`);
    });

    if (errors.length) {
      offenders.push({ sha, subject: subjectOf(message), problems: errors.map(e => e.message) });
    }
  }

  if (!offenders.length) return;

  offenders.forEach(({ sha, subject, problems }) => {
    fail(`Commit \`${shortSha(sha)}\` (${subject}): ${problems.join(", ")}.`);
  });

  markdown(
    `# ${offenders.length === 1 ? "A commit does" : `${offenders.length} commits do`} not follow the repository conventions\n\n` +
      `| Commit | Subject | Problem |\n` +
      `| --- | --- | --- |\n` +
      offenders
        .map(
          ({ sha, subject, problems }) =>
            `| \`${shortSha(sha)}\` | ${escapeCell(subject)} | ${problems.map(escapeCell).join("<br>")} |`,
        )
        .join("\n") +
      `\n\n` +
      `**Expected structure:** \n` +
      `- \`<type>(<scope>): <description>\` or \n` +
      `- \`<type>(<scope>): <description> (LIVE-XXXX)\`\n\n` +
      `**To fix**, reword the offending commits and force-push:\n\n` +
      "```bash\n" +
      `git rebase -i origin/${danger.github.pr.base.ref}\n` +
      "```\n\n" +
      `Merge and revert commits are exempt. The \`hk\` \`commit-msg\` hook applies these same rules ` +
      `locally at commit time, so \`mise\` users get this feedback before pushing.\n\n` +
      `See [Git conventions](https://github.com/LedgerHQ/ledger-live/blob/develop/docs/contributing/git-conventions.md).\n\n`,
  );
}

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

function subjectOf(message: string): string {
  return message.split("\n", 1)[0].trim();
}

// Backslashes first: escaping only the pipe would turn `\|` into `\\|`, an escaped
// backslash followed by a live pipe, which breaks out of the cell.
function escapeCell(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

export default validateCommits;

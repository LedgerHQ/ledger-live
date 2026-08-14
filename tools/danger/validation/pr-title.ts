import lint from "@commitlint/lint";
import config from "../../../commitlint.config.js";

// The `support/release-merge-conflicts` automation (see .github/workflows/release-prepare.yml)
// opens PRs with a fixed, non-conventional title such as:
//   [LWDM] :rotating_light: Release merge conflicts
// GitHub's API can return either the raw shortcode (":rotating_light:") or the rendered
// unicode emoji ("🚨") depending on the client, so both are accepted here.
// These PRs are bot-authored, always follow this exact shape, and are never renamed by a
// human, so we allow-list this specific title rather than loosening the convention itself.
const ROTATING_LIGHT_EMOJI = /(?:🚨|:rotating_light:)/;
const RELEASE_MERGE_CONFLICTS_BOT_TITLE = new RegExp(
  `^\\[LWDM\\]\\s*${ROTATING_LIGHT_EMOJI.source}\\s*Release merge conflicts$`,
);

function isReleaseMergeConflictsBotTitle(title: string): boolean {
  return RELEASE_MERGE_CONFLICTS_BOT_TITLE.test(title.trim());
}

async function validatePrTitle() {
  const title = danger.github.pr.title;

  if (isReleaseMergeConflictsBotTitle(title)) {
    return;
  }

  const report = await lint(stripPlatformPrefix(title), config.rules);

  const { errors, input, valid, warnings } = report;

  errors.forEach(({ message }) => {
    fail(message);
  });

  warnings.forEach(({ message }) => {
    warn(message);
  });

  if (!valid) {
    markdown(
      `# PR title does not follow the repository conventions\n\n` +
        `**Got:** \`${input}\`\n\n` +
        `**Expected structure:** \n` +
        `- \`<type>(<scope>): <description>\` or \n` +
        `- \`<type>(<scope>): <description> (LIVE-XXXX)\`\n\n` +
        `**Examples:** \n` +
        `- \`feat(ui): add dark mode toggle (LIVE-1234)\`\n` +
        `- \`fix(swap): resolve transaction signing issue\`\n` +
        `- \`ci(lint): harmonize git guidelines (LIVE-27608)\`\n\n` +
        `See [Git conventions](https://github.com/LedgerHQ/ledger-live/blob/develop/docs/contributing/git-conventions.md) ` +
        `and [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-live/blob/develop/CONTRIBUTING.md) for the full rules.\n\n`,
    );
  }
}

function stripPlatformPrefix(title: string) {
  return title.replace(/^\[(LWDM|LWD|LWM)\]\s*/, "");
}

export default validatePrTitle;

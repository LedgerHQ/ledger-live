import lint from "@commitlint/lint";
import config from "../../../commitlint.config.js";

async function validatePrTitle() {
  const report = await lint(stripPlatformPrefix(danger.github.pr.title), config.rules);

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

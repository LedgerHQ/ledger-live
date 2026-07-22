import { COMMIT_TYPES } from "../../../commitlint.types.js";

const ALLOWED_TYPES = COMMIT_TYPES.join("|");

const TITLE_STRUCTURE = new RegExp(`^(${ALLOWED_TYPES})(\\([a-z][a-z-]*[a-z]\\))(!)?:\\s(.+)$`);

const TICKET_SUFFIX = /^\s\([A-Z]+-\d+\)$/;

export function isValidPrTitle(title: string) {
  const stripped = stripPlatformPrefix(title);
  const match = stripped.match(TITLE_STRUCTURE);
  if (!match) return false;
  const description = match[4];
  const maybeTicket = description.match(/\s\(.*\)$/);
  return !maybeTicket || TICKET_SUFFIX.test(maybeTicket[0]);
}

function validatePrTitle() {
  if (!isValidPrTitle(danger.github.pr.title)) {
    fail(
      `**PR title does not follow the repository conventions.**\n\n` +
        `**Got:** \`${danger.github.pr.title}\`\n\n` +
        `**Expected format:** \`<type>(<scope>): <description>\` or \`<type>(<scope>): <description> (LIVE-XXXX)\`\n\n` +
        `**Allowed types:** \`${ALLOWED_TYPES.split("|").join("`, `")}\`\n\n` +
        `**Examples:**\n` +
        `- \`feat(desktop): add dark mode toggle (LIVE-1234)\`\n` +
        `- \`fix(mobile): resolve transaction signing issue\`\n` +
        `- \`chore(automation): harmonize git guidelines (LIVE-27608)\`\n\n` +
        `See [Git conventions](https://github.com/LedgerHQ/ledger-live/blob/develop/docs/contributing/git-conventions.md) ` +
        `and [CONTRIBUTING.md](https://github.com/LedgerHQ/ledger-live/blob/develop/CONTRIBUTING.md) for the full rules.\n\n`,
    );
  }
}

function stripPlatformPrefix(title: string) {
  return title.replace(/^\[(LWDM|LWD|LWM)\]\s*/, "");
}

export default validatePrTitle;

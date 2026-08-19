/**
 * Secret redaction for failure text leaving the repo.
 *
 * This is the ONE module in the tool that uses regular expressions, and it does
 * so because redaction is inherently pattern matching — everything else (path
 * and title matching) uses exact string comparison by design.
 *
 * The policy is deliberately over-cautious and still PROVISIONAL, pending the
 * security sign-off tracked in the PRD: a wallet repo's E2E failures can carry
 * mock mnemonics, addresses and RPC URLs. Stack traces are never sent at all —
 * see `toIngestEvents`.
 */
const REDACTION_RULES: { name: string; pattern: RegExp }[] = [
  // A run of 12+ lowercase words, which is what a BIP39 mnemonic looks like.
  { name: "mnemonic", pattern: /\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/g },
  // Hex addresses and private-key-shaped blobs.
  { name: "hex", pattern: /\b0x[a-fA-F0-9]{16,}\b/g },
  // Bech32-style addresses.
  { name: "bech32", pattern: /\b(?:bc1|tb1|cosmos1|ltc1)[a-z0-9]{20,}\b/g },
  // Any URL, which may carry credentials or keys in its query string.
  { name: "url", pattern: /\bhttps?:\/\/[^\s"']+/g },
];

/** Replace anything secret-shaped with a labelled placeholder. */
export function redactErrorMessage(message: string | undefined): string {
  if (!message) return "";
  let redacted = message;
  for (const rule of REDACTION_RULES) {
    redacted = redacted.replace(rule.pattern, `[redacted:${rule.name}]`);
  }
  return redacted;
}

/**
 * Drop the stack trace from a runner's failure text, keeping the human-readable
 * part above it.
 *
 * Runners hand us message and stack as one string — jest's `failureMessages` and
 * Playwright's `TestError.message` both do — so honouring "stacks are never
 * sent" means cutting them out here rather than simply declining to read a
 * separate field. What survives is the part that identifies the failure (the
 * assertion diff, the thrown message); what goes is the frame list, which is
 * mostly runner internals and absolute filesystem paths.
 *
 * Line-by-line rather than a pattern, in keeping with the tool's regex policy.
 */
export function stripStackFrames(message: string | undefined): string {
  if (!message) return "";
  const lines = message.split("\n");
  const firstFrame = lines.findIndex(line => line.trimStart().startsWith("at "));
  const kept = firstFrame === -1 ? lines : lines.slice(0, firstFrame);
  return kept.join("\n").trimEnd();
}

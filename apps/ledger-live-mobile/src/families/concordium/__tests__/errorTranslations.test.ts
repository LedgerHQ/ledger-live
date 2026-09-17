import en from "../../../locales/en/common.json";

/**
 * Every PLT error with a producer: what the bridge puts on a transaction status, and what the
 * signer throws. A class with no producer belongs in neither this list nor the package.
 *
 * TranslatedError falls back to `errors.generic`, whose title is `"{{message}}"` — so a missing key
 * does not fail loudly, it shows the class name to the user. Mirrors the PLT block of
 * `coin-concordium/src/types/errors.ts`.
 */
const PLT_ERRORS = [
  "ConcordiumTokenPaused",
  "ConcordiumRecipientNotAllowed",
  "ConcordiumRecipientDenied",
  "ConcordiumRecipientRestrictionsUnverified",
  "ConcordiumInsufficientCcdForFee",
  "ConcordiumRecipientNotFound",
  "ConcordiumInvalidPltPayloadError",
  "ConcordiumSignerProtocolError",
  "ConcordiumAppOutdatedError",
  "ConcordiumTokenTransferNotPermitted",
  "ConcordiumTokenRestrictionsUnverified",
  "ConcordiumUnsupportedTokenDecimals",
  "ConcordiumTokenAccountUnavailable",
];

const errors = en.errors as unknown as Record<
  string,
  { title?: string; description?: string } | undefined
>;

describe("concordium PLT error translations", () => {
  it.each(PLT_ERRORS)("%s has a title of its own", name => {
    expect(errors[name]?.title).toBeTruthy();
  });

  // Every one of these stops a transfer, at status time or on the device. The generic fallback
  // description says "Something went wrong", which does not tell the user whether the remedy is
  // theirs, the issuer's, or nobody's.
  it.each(PLT_ERRORS)("%s says what the user can do about it", name => {
    expect(errors[name]?.description).toBeTruthy();
  });

  // Each of these is constructed with the field named here, and the copy is written around it.
  // Dropping the placeholder loses the only part of the message that identifies the token.
  it.each([
    ["ConcordiumRecipientNotAllowed", "{{ticker}}"],
    ["ConcordiumRecipientDenied", "{{ticker}}"],
    ["ConcordiumRecipientRestrictionsUnverified", "{{ticker}}"],
  ])("%s quotes the token the bridge resolved", (name, placeholder) => {
    const entry = errors[name];
    expect(`${entry?.title ?? ""}${entry?.description ?? ""}`).toContain(placeholder);
  });

  it.each([
    ["ConcordiumUnsupportedTokenDecimals", "{{decimals}}"],
    ["ConcordiumUnsupportedTokenDecimals", "{{maxDecimals}}"],
  ])("%s quotes the bound it compared against", (name, placeholder) => {
    expect(errors[name]?.description).toContain(placeholder);
  });

  // A blocked send and an unreadable policy are different states, and the remedy differs: one is
  // the issuer's to grant, the other is a retry. Shared copy would collapse them.
  it("keeps the blocked and unverified policy copy apart", () => {
    expect(errors.ConcordiumTokenTransferNotPermitted?.title).not.toEqual(
      errors.ConcordiumTokenRestrictionsUnverified?.title,
    );
  });

  // The fee is paid in CCD from the parent account, so copy that reads as a token shortfall sends
  // the user to top up the wrong balance.
  it("says the fee shortfall is in CCD, not the token", () => {
    expect(errors.ConcordiumInsufficientCcdForFee?.description).toMatch(/CCD/);
  });
});

import en from "../../../../../static/i18n/en/app.json";

/**
 * Every error the ICP bridge can put on a transaction status, plus the one broadcast throws.
 *
 * TranslatedError falls back to `errors.generic`, whose title is `"{{message}}"` — so a missing key
 * does not fail loudly, it shows the class name to the user. Mirrors `coin-internet_computer/errors.ts`.
 */
const REACHABLE_ERRORS = [
  "InvalidMemoICP",
  "NotEnoughTransferAmount",
  "ICPDissolveDelayLTMin",
  "ICPDissolveDelayGTMax",
  "ICPDissolveDelayLTCurrent",
  "ICPNeuronNotFound",
  "ICPInvalidHotKey",
  "ICPHotKeyAlreadyExists",
  "ICPSplitNotAllowed",
  "ICPStakeMemoNotRecoverable",
  "ICPCallUnconfirmed",
  "ICPInvalidPercentage",
];

// getTransactionStatus assigns these to `warnings.staking`, which nothing in the app reads — the send
// flow renders `warnings.amount` and MemoField `warnings.transaction`. Translating them would suggest
// they reach the user; they do not. Add them here once something renders the slot.
const UNRENDERED_WARNINGS = ["ICPCreateNeuronWarning", "ICPIncreaseStakeWarning"];

// Through `unknown` because the block is not uniform: a few entries carry a null description, and
// others nest an object under `list`.
const errors = en.errors as unknown as Record<
  string,
  { title?: string; description?: string } | undefined
>;

describe("internet_computer error translations", () => {
  it.each(REACHABLE_ERRORS)("%s has a title of its own", name => {
    expect(errors[name]?.title).toBeTruthy();
  });

  it.each(UNRENDERED_WARNINGS)("%s is deliberately left untranslated", name => {
    expect(errors[name]).toBeUndefined();
  });

  // Without their own description these fall back to "Something went wrong. Please retry or contact
  // Ledger Support.", which is the wrong instruction for a value the user can simply correct.
  it.each(["ICPDissolveDelayLTMin", "ICPDissolveDelayGTMax", "ICPInvalidPercentage"])(
    "%s explains how to correct the value",
    name => {
      expect(errors[name]?.description).toBeTruthy();
    },
  );

  it.each([
    ["ICPDissolveDelayLTMin", "{{minDays}}"],
    ["ICPDissolveDelayGTMax", "{{maxDays}}"],
  ])("%s quotes the bound in days, the unit the input uses", (name, placeholder) => {
    expect(errors[name]?.description).toContain(placeholder);
  });
});

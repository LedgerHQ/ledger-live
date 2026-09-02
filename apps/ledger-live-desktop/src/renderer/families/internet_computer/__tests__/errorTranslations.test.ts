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
  "ICPInvalidDissolveDelayIncrease",
  "ICPNeuronNotFound",
  "ICPInvalidHotKey",
  "ICPHotKeyAlreadyExists",
  "ICPSplitNotAllowed",
  "ICPStakeMemoNotRecoverable",
  "ICPCallUnconfirmed",
  "ICPNeuronsNotRead",
  "ICPGovernanceRejected",
  "ICPCallRejected",
  "ICPInvalidPercentage",
  // getTransactionStatus assigns these to `warnings.staking`, a slot the generic send flow does not
  // read. The family's own SendAmountFields renders it, which is what makes them reachable.
  "ICPCreateNeuronWarning",
  "ICPIncreaseStakeWarning",
];

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

  // A warning whose only job is to explain a consequence is useless without one, and the generic
  // fallback description ("Something went wrong…") is the wrong instruction for a notice.
  it.each(["ICPCreateNeuronWarning", "ICPIncreaseStakeWarning"])(
    "%s explains the consequence it is warning about",
    name => {
      expect(errors[name]?.description).toBeTruthy();
    },
  );

  // A read that returned nothing changed nothing, and the copy has to say so: reusing
  // ICPCallUnconfirmed here would tell the user a refresh "may or may not have taken effect".
  it("tells the user a failed neuron read left them unchanged", () => {
    expect(errors.ICPNeuronsNotRead?.description).toMatch(/unchanged/);
  });

  // Without their own description these fall back to "Something went wrong. Please retry or contact
  // Ledger Support.", which is the wrong instruction for a value the user can simply correct.
  it.each([
    "ICPDissolveDelayLTMin",
    "ICPDissolveDelayGTMax",
    "ICPInvalidPercentage",
    "ICPInvalidDissolveDelayIncrease",
  ])("%s explains how to correct the value", name => {
    expect(errors[name]?.description).toBeTruthy();
  });

  it.each([
    ["ICPDissolveDelayLTMin", "{{minDays}}"],
    ["ICPDissolveDelayGTMax", "{{maxDays}}"],
  ])("%s quotes the bound in days, the unit the input uses", (name, placeholder) => {
    expect(errors[name]?.description).toContain(placeholder);
  });

  // Both are thrown with the network's own text in `reason`. Dropping the placeholder would lose the
  // only part of the message that says what actually went wrong.
  it.each(["ICPGovernanceRejected", "ICPCallRejected"])(
    "%s passes the network's own wording through",
    name => {
      expect(errors[name]?.description).toContain("{{reason}}");
    },
  );
});

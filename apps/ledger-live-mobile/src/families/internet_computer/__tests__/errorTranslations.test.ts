import en from "~/locales/en/common.json";

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
  "ICPNeuronsNotRead",
  "ICPGovernanceRejected",
  "ICPCallRejected",
  "ICPInvalidPercentage",
  // getTransactionStatus assigns these to `warnings.staking`, a slot the generic send flow does not
  // read. The family's own ActionFooter renders it, which is what makes them reachable.
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

  // The dissolve-delay bounds are protocol seconds, but the copy quotes whole days, so the errors
  // carry both and the description has to interpolate the day count rather than the seconds.
  it("quotes the dissolve-delay bounds in days", () => {
    expect(errors.ICPDissolveDelayLTMin?.description).toContain("{{minDays}}");
    expect(errors.ICPDissolveDelayGTMax?.description).toContain("{{maxDays}}");
  });

  // A read that returned nothing changed nothing, and the copy has to say so: reusing
  // ICPCallUnconfirmed here would tell the user a refresh "may or may not have taken effect".
  it("tells the user a failed neuron read left them unchanged", () => {
    expect(errors.ICPNeuronsNotRead?.description).toMatch(/unchanged/);
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

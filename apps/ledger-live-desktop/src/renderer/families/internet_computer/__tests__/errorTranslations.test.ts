import * as icpErrors from "@ledgerhq/live-common/families/internet_computer/errors";
import en from "../../../../../static/i18n/en/app.json";

/**
 * Every error the ICP coin module exports can reach the user, so each needs copy of its own.
 *
 * TranslatedError falls back to `errors.generic`, whose title is `"{{message}}"` — so a missing key
 * does not fail loudly, it shows the class name to the user.
 */
const REACHABLE_ERRORS = Object.values(icpErrors).map(ErrorClass => new ErrorClass().name);

// Through `unknown` because the block is not uniform: a few entries carry a null description, and
// others nest an object under `list`.
const errors = en.errors as unknown as Record<
  string,
  | {
      title?: string;
      description?: string;
      // The dissolve-delay bounds quote a day count, so their copy is pluralized.
      description_one?: string;
      description_other?: string;
    }
  | undefined
>;

/** The description a reader sees, whichever of the singular or plural forms the entry carries. */
const describes = (name: string): string | undefined =>
  errors[name]?.description ?? errors[name]?.description_other;

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
    "ICPHotKeyIsController",
    "ICPTooManyHotKeys",
    "ICPTopUpBelowMinimumStake",
    "ICPTooManyFollowees",
    "ICPInvalidFolloweeId",
    "ICPDuplicateFollowee",
    "ICPFolloweeIsSelf",
  ])("%s explains how to correct the value", name => {
    expect(describes(name)).toBeTruthy();
  });

  it.each([
    ["ICPDissolveDelayLTMin", "{{minDays}}"],
    ["ICPDissolveDelayGTMax", "{{maxDays}}"],
  ])("%s quotes the bound in days, the unit the input uses", (name, placeholder) => {
    expect(describes(name)).toContain(placeholder);
  });

  it.each([
    ["ICPTooManyHotKeys", "{{max}}"],
    ["ICPTopUpBelowMinimumStake", "{{missing}}"],
    ["ICPTooManyFollowees", "{{max}}"],
  ])("%s quotes the figure the bridge computed", (name, placeholder) => {
    expect(describes(name)).toContain(placeholder);
  });

  it.each(["ICPInvalidFolloweeId", "ICPDuplicateFollowee", "ICPFolloweeIsSelf"])(
    "%s names the followee to remove",
    name => {
      expect(describes(name)).toContain("{{id}}");
    },
  );

  // The transfer has settled by the time governance refuses the refresh, so copy that reads as a
  // failed transaction would tell the user their ICP is gone.
  it("says the ICP is still there when a stake refresh is refused", () => {
    expect(errors.ICPStakeNotRefreshed?.description).toMatch(/Nothing is lost/);
  });

  // i18next picks the form off `count`, so both forms have to exist or a bound reads "1 days".
  it.each(["ICPDissolveDelayLTMin", "ICPDissolveDelayGTMax"])(
    "%s pluralizes its day count",
    name => {
      expect(errors[name]?.description_one).toBeTruthy();
      expect(errors[name]?.description_other).toBeTruthy();
      expect(errors[name]?.description).toBeUndefined();
    },
  );

  // All are thrown with the network's own text in `reason`. Dropping the placeholder would lose the
  // only part of the message that says what actually went wrong.
  it.each(["ICPGovernanceRejected", "ICPCallRejected", "ICPNodeRefused", "ICPStakeNotRefreshed"])(
    "%s passes the network's own wording through",
    name => {
      expect(errors[name]?.description).toContain("{{reason}}");
    },
  );
});

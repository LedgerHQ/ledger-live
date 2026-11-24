import { accountsVersions } from "../accountsVersions";
import { ACCOUNTS_RECORD_KEY } from "../envelope";
import cliSample from "./__fixtures__/accounts.v0.cli.json";
import desktopSample from "./__fixtures__/accounts.v0.desktop.json";
import mobileNoVersionSample from "./__fixtures__/accounts.v0.mobile.no-version.json";
import mobileSample from "./__fixtures__/accounts.v0.mobile.json";

describe("accountsVersions", () => {
  it("should have v0 as the latest version", () => {
    expect(accountsVersions.latest).toBe(0);
  });

  it.each([
    ["desktop", desktopSample],
    ["mobile", mobileSample],
    ["mobile with no version", mobileNoVersionSample],
    ["cli", cliSample],
  ])("should upgrade the %s sample to the latest version", (_writer, sample) => {
    expect(accountsVersions.decode(sample, ACCOUNTS_RECORD_KEY)).toEqual(sample);
  });
});

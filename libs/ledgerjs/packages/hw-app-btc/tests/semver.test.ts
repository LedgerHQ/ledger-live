import semver from "semver";

/**
 * To detect any semver regression that could impact the behavior of the package
 * implementation when working with versions having prefix.
 * One might say this is not necessary since it should already be covered by the
 * semver package own testsuite, but better be safe than sorry.
 *
 * Following this comment:
 * Are you 100% sure this does the same as the current implem?
 * Just being paranoid, because app versions can be different from a clean
 * major.minor.patch
 * e.g they can have -rc0 -next0 or such additional stuff at the end,
 * and it happened in the past that semver doesn't behave as we think it does.
 * cf. https://github.com/LedgerHQ/ledger-live/pull/5675/files#r1417174514
 */

describe("semver", () => {
  describe("should be able to properly compare version with prefix", () => {
    it("2.0.0-rc0 should be lower than 2.1.0", () => {
      const version = "2.0.0-rc1";
      expect(semver.lt(version, "2.1.0"));
    });
    it("2.0.0-next0 should be lower than 2.1.0", () => {
      const version = "2.0.0-next0";
      expect(semver.lt(version, "2.1.0"));
    });
    it("2.1.0-rc0 should be greater than 2.1.0", () => {
      const version = "2.1.0-rc0";
      expect(semver.gt(version, "2.1.0"));
    });
    it("2.1.0-next0 should be greater than 2.1.0", () => {
      const version = "2.1.0-next0";
      expect(semver.gt(version, "2.1.0"));
    });
  });
});

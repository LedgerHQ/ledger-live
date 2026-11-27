import type { Features } from "@shared/feature-flags";
import { getVersionedRedirects } from "./useVersionedStakePrograms";

type StakePrograms = Features["stakePrograms"];
type Redirect = NonNullable<NonNullable<StakePrograms["params"]>["redirects"]>[string];
type VersionEntry = NonNullable<NonNullable<StakePrograms["params"]>["versions"]>[number];

/** Placeholder releases, not real ones: the first release of a change is known only once it ships. */
const FLOORS = [
  {
    name: "a patch boundary",
    floor: "50.3.5",
    below: "50.3.4",
    above: ["50.3.6", "50.4.0", "51.0.0"],
  },
  { name: "a minor boundary", floor: "50.4.0", below: "50.3.99", above: ["50.4.1", "51.0.0"] },
  { name: "a major boundary", floor: "51.0.0", below: "50.99.99", above: ["51.0.1", "52.0.0"] },
];
const OLDER_FLOOR = "40.0.0";

const SOLANA_ON_EARN: Redirect = {
  platform: "earn",
  name: "Earn",
  queryParams: { intent: "deposit", cryptoAssetId: "solana" },
};
const TEZOS_ON_STAKEKIT: Redirect = { platform: "stakekit", name: "StakeKit" };
const TOP_LEVEL: Record<string, Redirect> = {
  tron: { platform: "stakekit", name: "StakeKit" },
};

function stakePrograms(versions?: VersionEntry[], enabled = true): StakePrograms {
  return {
    enabled,
    params: { list: ["solana", "ethereum"], redirects: TOP_LEVEL, ...(versions && { versions }) },
  };
}

function redirectsAt(flag: StakePrograms, appVersion: string): Record<string, Redirect> {
  return getVersionedRedirects(flag, appVersion).params?.redirects ?? {};
}

const appliesSolana = (flag: StakePrograms, appVersion: string) =>
  redirectsAt(flag, appVersion).solana !== undefined;

describe("getVersionedRedirects (mobile)", () => {
  describe.each(FLOORS)("with the floor at $name", ({ floor, below, above }) => {
    const flag = stakePrograms([
      { mobile_version: `>=${floor}`, redirects: { solana: SOLANA_ON_EARN } },
    ]);

    it("keeps the Solana redirect off below the floor", () => {
      expect(redirectsAt(flag, below)).toEqual(TOP_LEVEL);
    });

    it("turns the Solana redirect on at the floor, next to the top-level redirects", () => {
      expect(redirectsAt(flag, floor)).toEqual({ ...TOP_LEVEL, solana: SOLANA_ON_EARN });
    });

    it.each(above)("keeps it on at %s", appVersion => {
      expect(appliesSolana(flag, appVersion)).toBe(true);
    });

    it("keeps it off for the prerelease of the floor when the range stops at the release", () => {
      expect(appliesSolana(flag, `${floor}-next.1`)).toBe(false);
    });

    it("turns it on for the prerelease of the floor when the range starts at its first prerelease", () => {
      const prereleaseFlag = stakePrograms([
        { mobile_version: `>=${floor}-0`, redirects: { solana: SOLANA_ON_EARN } },
      ]);

      expect(appliesSolana(prereleaseFlag, `${floor}-next.1`)).toBe(true);
      expect(appliesSolana(prereleaseFlag, `${floor}-next.12`)).toBe(true);
      expect(appliesSolana(prereleaseFlag, floor)).toBe(true);
    });

    it("keeps it off for the prereleases of the release before, even from the first prerelease", () => {
      const prereleaseFlag = stakePrograms([
        { mobile_version: `>=${floor}-0`, redirects: { solana: SOLANA_ON_EARN } },
      ]);

      expect(appliesSolana(prereleaseFlag, `${below}-next.9`)).toBe(false);
      expect(appliesSolana(prereleaseFlag, below)).toBe(false);
    });
  });

  describe.each(FLOORS)("an older entry and a new one around $name", ({ floor, below, above }) => {
    const oldRedirects = { tezos: TEZOS_ON_STAKEKIT };

    it("never reaches the new entry when the older one has no upper bound", () => {
      const flag = stakePrograms([
        { mobile_version: `>=${OLDER_FLOOR}`, redirects: oldRedirects },
        { mobile_version: `>=${floor}`, redirects: { ...oldRedirects, solana: SOLANA_ON_EARN } },
      ]);

      expect(appliesSolana(flag, above[0])).toBe(false);
      expect(redirectsAt(flag, above[0])).toEqual({ ...TOP_LEVEL, ...oldRedirects });
    });

    describe("when the older entry stops below the floor", () => {
      const flag = stakePrograms([
        { mobile_version: `>=${OLDER_FLOOR} <${floor}-0`, redirects: oldRedirects },
        { mobile_version: `>=${floor}-0`, redirects: { ...oldRedirects, solana: SOLANA_ON_EARN } },
      ]);

      it("gives the older version the older redirects only", () => {
        expect(redirectsAt(flag, below)).toEqual({ ...TOP_LEVEL, ...oldRedirects });
        expect(redirectsAt(flag, `${below}-next.9`)).toEqual({ ...TOP_LEVEL, ...oldRedirects });
      });

      it("gives the floor and above the new entry, which carries the older redirects too", () => {
        expect(redirectsAt(flag, floor)).toEqual({
          ...TOP_LEVEL,
          ...oldRedirects,
          solana: SOLANA_ON_EARN,
        });
        expect(appliesSolana(flag, above[above.length - 1])).toBe(true);
      });

      it("is not sensitive to the order of the entries", () => {
        const reversed = stakePrograms([...(flag.params?.versions ?? [])].reverse());

        expect(redirectsAt(reversed, floor)).toEqual(redirectsAt(flag, floor));
        expect(redirectsAt(reversed, below)).toEqual(redirectsAt(flag, below));
      });
    });
  });

  describe("a gap between two entries", () => {
    const flag = stakePrograms([
      { mobile_version: ">=40.0.0 <41.0.0", redirects: { tezos: TEZOS_ON_STAKEKIT } },
      { mobile_version: ">=42.0.0", redirects: { solana: SOLANA_ON_EARN } },
    ]);

    it.each(["41.0.0", "41.5.2", "41.99.99"])(
      "leaves %s with the top-level redirects",
      appVersion => {
        expect(redirectsAt(flag, appVersion)).toEqual(TOP_LEVEL);
      },
    );

    it("applies each entry on its own side of the gap", () => {
      expect(redirectsAt(flag, "40.5.0")).toEqual({ ...TOP_LEVEL, tezos: TEZOS_ON_STAKEKIT });
      expect(redirectsAt(flag, "42.0.0")).toEqual({ ...TOP_LEVEL, solana: SOLANA_ON_EARN });
    });
  });

  describe("the mobile and desktop partitions", () => {
    const flag = stakePrograms([
      { mobile_version: ">=50.0.0", redirects: { solana: SOLANA_ON_EARN } },
      { desktop_version: ">=10.0.0", redirects: { tezos: TEZOS_ON_STAKEKIT } },
    ]);

    it("reads only the mobile range, whatever the desktop one says", () => {
      expect(redirectsAt(flag, "50.0.0")).toEqual({ ...TOP_LEVEL, solana: SOLANA_ON_EARN });
      expect(redirectsAt(flag, "55.0.0")).toEqual({ ...TOP_LEVEL, solana: SOLANA_ON_EARN });
    });

    it("never applies an entry that only has a desktop range", () => {
      const desktopOnly = stakePrograms([
        { desktop_version: ">=1.0.0", redirects: { solana: SOLANA_ON_EARN } },
      ]);

      expect(appliesSolana(desktopOnly, "55.0.0")).toBe(false);
    });

    it("keeps a mobile floor that is not the desktop one", () => {
      const split = stakePrograms([
        {
          desktop_version: ">=55.0.0",
          mobile_version: ">=50.0.0",
          redirects: { solana: SOLANA_ON_EARN },
        },
      ]);

      expect(appliesSolana(split, "50.0.0")).toBe(true);
    });
  });

  describe("a flag without version entries", () => {
    it.each([
      ["no versions key", stakePrograms()],
      ["an empty list of versions", stakePrograms([])],
    ])("serves the top-level redirects for %s", (_name, flag) => {
      expect(redirectsAt(flag, "50.0.0")).toEqual(TOP_LEVEL);
    });

    it("serves nothing for a flag without params", () => {
      expect(getVersionedRedirects({ enabled: true }, "50.0.0").params).toEqual({
        list: [],
        redirects: {},
      });
    });
  });

  it("never applies an entry without a mobile range", () => {
    const flag = stakePrograms([{ redirects: { solana: SOLANA_ON_EARN } }]);

    expect(appliesSolana(flag, "50.0.0")).toBe(false);
  });

  it("keeps the list and the enabled state, which versions do not change", () => {
    const flag = stakePrograms(
      [{ mobile_version: ">=50.0.0", redirects: { solana: SOLANA_ON_EARN } }],
      false,
    );

    const versioned = getVersionedRedirects(flag, "50.0.0");

    expect(versioned.enabled).toBe(false);
    expect(versioned.params?.list).toEqual(["solana", "ethereum"]);
  });
});

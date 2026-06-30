import type { CantonResources } from "@ledgerhq/coin-canton/types";
import { createMockAccount } from "../../../__tests__/testUtils";
import { getImportableAccounts } from "../accountPreparation";

const cantonResources = (isOnboarded: boolean): CantonResources => ({
  isOnboarded,
  instrumentUtxoCounts: {},
  pendingTransferProposals: [],
});

describe("accountPreparation (MAD)", () => {
  describe("getImportableAccounts", () => {
    it("returns funded (used) accounts", () => {
      const used = createMockAccount({ id: "used", used: true });
      const unused = createMockAccount({ id: "unused", used: false });

      expect(getImportableAccounts([used, unused])).toEqual([used]);
    });

    it("includes already-onboarded Canton accounts even when unfunded (used=false)", () => {
      // Re-adding a previously-onboarded account: the party exists on-chain (isOnboarded=true)
      // but it is unfunded, so used=false. It must still be importable, not dropped.
      const onboardedUnfunded = createMockAccount({
        id: "onboarded",
        used: false,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        cantonResources: cantonResources(true),
      } as Partial<ReturnType<typeof createMockAccount>>);

      expect(getImportableAccounts([onboardedUnfunded])).toEqual([onboardedUnfunded]);
    });

    it("excludes not-onboarded unfunded Canton accounts", () => {
      const notOnboarded = createMockAccount({
        id: "fresh",
        used: false,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        cantonResources: cantonResources(false),
      } as Partial<ReturnType<typeof createMockAccount>>);

      expect(getImportableAccounts([notOnboarded])).toEqual([]);
    });

    it("keeps both funded and already-onboarded accounts", () => {
      const used = createMockAccount({ id: "used", used: true });
      const onboardedUnfunded = createMockAccount({
        id: "onboarded",
        used: false,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        cantonResources: cantonResources(true),
      } as Partial<ReturnType<typeof createMockAccount>>);

      expect(getImportableAccounts([used, onboardedUnfunded])).toEqual([used, onboardedUnfunded]);
    });
  });
});

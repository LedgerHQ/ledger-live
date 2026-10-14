import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { STACKS_DUMMY_ADDRESS } from "@ledgerhq/coin-stacks/constants";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import {
  loadAccountRawAssignForFamily,
  loadBridgeExtensionsForFamily,
} from "../../../coin-modules/registry";
import stacksBridge from "../bridge/api";
import type { StacksAccount } from "../types";

// These hooks only take effect on the generic-coin-framework path, so they are exercised here
// directly rather than through `genericCoinFrameworkFamilies.json`.
describe("stacks generic-bridge hooks", () => {
  const currency = getCryptoCurrencyById("stacks");

  it("keeps the legacy public-key account id", () => {
    expect(stacksBridge(currency).accountIdFromPublicKey).toBe(true);
  });

  it("names the same estimation recipient as the classic bridge", async () => {
    const extensions = await loadBridgeExtensionsForFamily("stacks");

    expect(extensions.getEstimationRecipient?.(genAccount("stacks", { currency }))).toBe(
      STACKS_DUMMY_ADDRESS,
    );
  });

  describe("account raw assign", () => {
    const roundTrip = async (account: StacksAccount): Promise<StacksAccount> => {
      const hooks = await loadAccountRawAssignForFamily("stacks");
      const raw = {} as AccountRaw;
      hooks?.assignToAccountRaw?.(account as Account, raw);
      const revived = {} as StacksAccount;
      hooks?.assignFromAccountRaw?.(JSON.parse(JSON.stringify(raw)), revived);
      return revived;
    };

    it("persists an empty position list, which gates the Stake action", async () => {
      const account = { ...genAccount("stacks", { currency }), stakingPositions: [] };

      expect((await roundTrip(account)).stakingPositions).toEqual([]);
    });

    it("persists a stake position with BigNumber amounts", async () => {
      const position = {
        uid: "stake-1",
        address: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
        delegate: "SP000000000000000000002Q6VF78.native-pool-signer-manager",
        state: "active",
        asset: { type: "native" },
        amount: new BigNumber(1_000_000),
      } as unknown as NonNullable<StacksAccount["stakingPositions"]>[number];
      const account = { ...genAccount("stacks", { currency }), stakingPositions: [position] };

      const [revived] = (await roundTrip(account)).stakingPositions ?? [];
      expect(revived.uid).toBe("stake-1");
      expect(revived.amount).toEqual(new BigNumber(1_000_000));
    });

    it("leaves an unknown (never fetched) position list absent", async () => {
      const account = genAccount("stacks", { currency }) as StacksAccount;

      expect((await roundTrip(account)).stakingPositions).toBeUndefined();
    });
  });
});

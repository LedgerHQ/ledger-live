import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  emptyHistoryCache,
  generateHistoryFromOperations,
} from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
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

    it.each(["stake", "unstake", "swap-x-for-y", "constructor", "toString", "__proto__"])(
      "retypes a contract call stored under its function name %s as CONTRACT_CALL",
      async functionName => {
        const base = genAccount("stacks", { currency, operationsSize: 1 });
        const account = {
          ...base,
          operations: [{ ...base.operations[0], type: functionName }],
        } as unknown as Account;
        const hooks = await loadAccountRawAssignForFamily("stacks");

        hooks?.assignFromAccountRaw?.({} as AccountRaw, account);

        expect(account.operations[0].type).toBe("CONTRACT_CALL");
      },
    );

    describe("values of retyped contract calls", () => {
      const FEE = new BigNumber(180);
      const storedAccount = (): Account => {
        const base = genAccount("stacks", { currency, operationsSize: 2 });
        return {
          ...base,
          operations: [
            { ...base.operations[0], type: "stake", fee: FEE, value: new BigNumber(0) },
            { ...base.operations[1], type: "stake", fee: FEE, value: FEE, hasFailed: true },
          ],
          balanceHistoryCache: emptyHistoryCache,
        } as unknown as Account;
      };

      it("adds the fee to a successful call and keeps a failed one at its fee", async () => {
        const account = storedAccount();
        const hooks = await loadAccountRawAssignForFamily("stacks");

        hooks?.assignFromAccountRaw?.({} as AccountRaw, account);

        expect(account.operations.map(op => op.value)).toEqual([FEE, FEE]);
      });

      it("rebuilds the balance history from the retyped operations", async () => {
        const account = storedAccount();
        const hooks = await loadAccountRawAssignForFamily("stacks");

        hooks?.assignFromAccountRaw?.({} as AccountRaw, account);

        expect(account.balanceHistoryCache).not.toBe(emptyHistoryCache);
        expect(account.balanceHistoryCache).toEqual(generateHistoryFromOperations(account));
      });

      it("leaves the values and the balance history unchanged on a repeated load", async () => {
        const account = storedAccount();
        const hooks = await loadAccountRawAssignForFamily("stacks");
        hooks?.assignFromAccountRaw?.({} as AccountRaw, account);
        const cache = account.balanceHistoryCache;

        hooks?.assignFromAccountRaw?.({} as AccountRaw, account);

        expect(account.operations.map(op => op.value)).toEqual([FEE, FEE]);
        expect(account.balanceHistoryCache).toBe(cache);
      });
    });

    it("keeps valid operation types and token state when retyping stored contract calls", async () => {
      const base = genAccount("stacks", { currency, operationsSize: 2 });
      const swapHistory = [{ swapId: "swap-1" }];
      const tokenAccount = { id: "token-account", swapHistory, operations: [] };
      const account = {
        ...base,
        operations: [
          { ...base.operations[0], type: "OUT" },
          { ...base.operations[1], type: "DELEGATE" },
        ],
        subAccounts: [tokenAccount],
      } as unknown as Account;
      const hooks = await loadAccountRawAssignForFamily("stacks");

      hooks?.assignFromAccountRaw?.({} as AccountRaw, account);

      expect(account.operations.map(op => op.type)).toEqual(["OUT", "DELEGATE"]);
      expect(account.subAccounts?.[0].swapHistory).toBe(swapHistory);
    });

    it("leaves an unknown (never fetched) position list absent", async () => {
      const account = genAccount("stacks", { currency }) as StacksAccount;

      expect((await roundTrip(account)).stakingPositions).toBeUndefined();
    });
  });
});

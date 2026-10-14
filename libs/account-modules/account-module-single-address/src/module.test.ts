import {
  createMemoryHistoryStore,
  discoverAccounts,
  type AccountDescriptor,
  type AccountIntent,
  type AccountOperation,
  type CraftedAccountTransaction,
  type DiscoveredAccount,
} from "@ledgerhq/account-module-framework";
import { anOperation, testContext } from "@ledgerhq/account-module-framework/test-utils";
import type { TransactionValidation } from "@ledgerhq/coin-module-framework/api/types";
import { createSingleAddressAccountModule } from "./module";
import { emptyState, versioned } from "./state";
import type { SingleAddressAccountTypes, SingleAddressCoinModule } from "./types";

const context = testContext();
const date = new Date("2026-01-01T00:00:00.000Z");
const now = date.getTime();
const native = { type: "native" } as const;
const token = { type: "erc20", assetReference: "0xtoken" };

const descriptor: AccountDescriptor = {
  currencyId: "ethereum",
  derivationMode: "",
  index: 0,
  key: "address",
  derivationPath: "44'/60'/0'",
};

const validation: TransactionValidation = {
  errors: {},
  warnings: {},
  estimatedFees: 5n,
  amount: 10n,
  totalSpent: 15n,
};

const intent: AccountIntent<never> = {
  intentType: "transaction",
  type: "send",
  recipient: "recipient",
  amount: 10n,
  asset: native,
};

const coinIntent = { ...intent, sender: "address" };

function aCoinModule(): SingleAddressCoinModule {
  return {
    lastBlock: jest.fn(async () => ({ height: 100, hash: "tip", time: date })),
    listOperations: jest.fn(async () => ({ items: [] })),
    getBalance: jest.fn(async () => []),
    getStakes: jest.fn(async () => ({ items: [] })),
    getNextSequence: jest.fn(async () => 4n),
    estimateFees: jest.fn(async () => ({ value: 5n })),
    validateIntent: jest.fn(async () => validation),
    craftTransaction: jest.fn(async () => ({ transaction: "unsigned", details: { size: 1 } })),
    combine: jest.fn(() => "signed"),
    broadcast: jest.fn(async () => "tx-hash"),
  };
}

const syncedState = versioned({
  syncedHeight: 100,
  balances: [
    { value: "100", asset: native, locked: "10" },
    { value: "30", asset: token },
  ],
  stakes: [
    {
      uid: "stake",
      address: "address",
      state: "active",
      actions: [],
      asset: native,
      amount: "7",
    },
  ],
});

const aSyncedAccount = (operations: AccountOperation[] = []) => ({
  descriptor,
  state: syncedState,
  history: createMemoryHistoryStore(operations),
});

const aNewAccount = () => ({
  descriptor,
  state: undefined,
  history: createMemoryHistoryStore(),
});

function expectNoNetworkCall(coinModule: SingleAddressCoinModule) {
  for (const method of Object.values(coinModule)) expect(method).not.toHaveBeenCalled();
}

describe("createSingleAddressAccountModule", () => {
  describe("sync", () => {
    it("discovers the accounts of a device up to the first empty one", async () => {
      const coinModule = aCoinModule();
      jest.mocked(coinModule.listOperations).mockImplementation(async (_context, address) => ({
        items:
          address === "used"
            ? [
                {
                  id: "op",
                  type: "IN",
                  senders: ["sender"],
                  recipients: ["used"],
                  value: 50n,
                  asset: native,
                  tx: {
                    hash: "hash",
                    block: { height: 90, hash: "b90", time: date },
                    fees: 1n,
                    date,
                    failed: false,
                  },
                },
              ]
            : [],
      }));
      jest
        .mocked(coinModule.getBalance)
        .mockImplementation(async (_context, address) =>
          address === "used" ? [{ value: 50n, asset: native }] : [],
        );
      const module = createSingleAddressAccountModule(coinModule);

      const discovered: DiscoveredAccount<SingleAddressAccountTypes>[] = [];
      for await (const account of discoverAccounts(module, context, {
        currencyId: "ethereum",
        derivationMode: "",
        derivationScheme: "44'/60'",
        getAccountKey: async path => (path === "44'/60'/0'" ? "used" : "fresh"),
      })) {
        discovered.push(account);
      }

      expect(discovered.map(({ descriptor: { key }, empty }) => ({ key, empty }))).toEqual([
        { key: "used", empty: false },
        { key: "fresh", empty: true },
      ]);
      expect(discovered[0]!.state?.data.syncedHeight).toBe(100);
      expect(await module.getBalances(context, discovered[0]!)).toEqual([
        { value: 50n, asset: native },
      ]);
    });
  });

  describe("reads", () => {
    it("reads balances and stakes from the state, without any network call", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);

      expect(await module.getBalances(context, aSyncedAccount())).toEqual([
        { value: 100n, asset: native, locked: 10n },
        { value: 30n, asset: token },
      ]);
      expect(await module.getStakes(context, aSyncedAccount())).toEqual([
        {
          uid: "stake",
          address: "address",
          state: "active",
          actions: [],
          asset: native,
          amount: 7n,
        },
      ]);
      expectNoNetworkCall(coinModule);
    });

    it.each([
      ["never synced", undefined],
      ["of another version", { version: 0, data: emptyState() }],
    ])("has no balance nor stake for an account %s", async (_, state) => {
      const module = createSingleAddressAccountModule(aCoinModule());
      const account = { ...aNewAccount(), state };

      expect(await module.getBalances(context, account)).toEqual([]);
      expect(await module.getStakes(context, account)).toEqual([]);
    });

    it("lists the operations of the history, page by page", async () => {
      const module = createSingleAddressAccountModule(aCoinModule());
      const account = aSyncedAccount([
        anOperation({ id: "new", date: new Date(now + 1) }),
        anOperation({ id: "old", date: new Date(now) }),
      ]);

      const first = await module.listOperations(context, account, { limit: 1 });
      const second = await module.listOperations(context, account, { cursor: first.next! });

      expect([...first.items, ...second.items].map(op => op.id)).toEqual(["new", "old"]);
      expect(second.next).toBeUndefined();
    });

    it("tells the pending operations: optimistic, or not in a block", async () => {
      const module = createSingleAddressAccountModule(aCoinModule());
      const account = aSyncedAccount([
        anOperation({ id: "confirmed" }),
        anOperation({ id: "mempool", block: null }),
        anOperation({ id: "broadcast", block: null, optimistic: true }),
      ]);

      const pending = await module.getPendingOperations(context, account);

      expect(pending.map(op => op.id).sort()).toEqual(["broadcast", "mempool"]);
    });

    it("has one address, the account key, used once it holds history", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);

      expect(await module.getAddresses(context, aNewAccount())).toEqual([
        { address: "address", derivationPath: "44'/60'/0'", used: false },
      ]);
      expect(await module.getAddresses(context, aSyncedAccount([anOperation()]))).toEqual([
        { address: "address", derivationPath: "44'/60'/0'", used: true },
      ]);
      expect(await module.getFreshAddress(context, aNewAccount())).toEqual({
        address: "address",
        derivationPath: "44'/60'/0'",
      });
      expectNoNetworkCall(coinModule);
    });

    it("derives the address path with addressPath", async () => {
      const module = createSingleAddressAccountModule(aCoinModule(), {
        addressPath: ({ derivationPath }) => `${derivationPath}/0/0`,
      });

      expect(await module.getFreshAddress(context, aNewAccount())).toEqual({
        address: "address",
        derivationPath: "44'/60'/0'/0/0",
      });
      expect((await module.getAddresses(context, aNewAccount()))[0]!.derivationPath).toBe(
        "44'/60'/0'/0/0",
      );
    });
  });

  describe("estimateFees", () => {
    it("estimates the intent sent by the account", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);
      const feeOptions = { feeOption: { feeOptionId: "fast" } };

      const fees = await module.estimateFees(
        context,
        aSyncedAccount(),
        { ...intent, sender: "someone else", senderPublicKey: "pubkey" },
        feeOptions,
      );

      expect(fees).toEqual({ value: 5n });
      expect(coinModule.estimateFees).toHaveBeenCalledWith(
        context,
        { ...coinIntent, senderPublicKey: "pubkey" },
        feeOptions,
      );
    });
  });

  describe("validateIntent", () => {
    it("validates the intent against the balances of the state", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);
      const customFees = { customFees: { value: 9n } };

      const result = await module.validateIntent(context, aSyncedAccount(), intent, customFees);

      expect(result).toBe(validation);
      expect(coinModule.validateIntent).toHaveBeenCalledWith(
        context,
        coinIntent,
        [
          { value: 100n, asset: native, locked: 10n },
          { value: 30n, asset: token },
        ],
        customFees,
      );
    });

    it("validates the intent of an account never synced against no balance", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);

      await module.validateIntent(context, aNewAccount(), intent);

      expect(coinModule.validateIntent).toHaveBeenCalledWith(context, coinIntent, [], undefined);
    });
  });

  describe("estimateMaxSpendable", () => {
    it("spends the native balance but its locked part and the fee of sending it all", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);
      const feeOptions = { customFeesParameters: { gasPrice: 1n } };

      const max = await module.estimateMaxSpendable(context, aSyncedAccount(), intent, feeOptions);

      expect(max).toBe(85n);
      expect(coinModule.estimateFees).toHaveBeenCalledWith(
        context,
        { ...coinIntent, amount: 90n, useAllAmount: true },
        feeOptions,
      );
    });

    it("spends nothing when the fee exceeds the native balance", async () => {
      const coinModule = aCoinModule();
      jest.mocked(coinModule.estimateFees).mockResolvedValue({ value: 500n });
      const module = createSingleAddressAccountModule(coinModule);

      expect(await module.estimateMaxSpendable(context, aSyncedAccount(), intent)).toBe(0n);
      expect(await module.estimateMaxSpendable(context, aNewAccount(), intent)).toBe(0n);
    });

    it("spends the whole balance of a token, whose fee is paid in the native asset", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);

      expect(
        await module.estimateMaxSpendable(context, aSyncedAccount(), { ...intent, asset: token }),
      ).toBe(30n);
      expect(coinModule.estimateFees).not.toHaveBeenCalled();
    });

    it("spends nothing of a token the account does not hold", async () => {
      const module = createSingleAddressAccountModule(aCoinModule());
      const otherToken = { type: "erc20", assetReference: "0xother" };

      expect(
        await module.estimateMaxSpendable(context, aSyncedAccount(), {
          ...intent,
          asset: otherToken,
        }),
      ).toBe(0n);
    });
  });

  describe("craftTransaction", () => {
    it("crafts the intent with its sequence, and the optimistic operation it becomes", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule, { now: () => now });

      const crafted = await module.craftTransaction(context, aSyncedAccount(), {
        ...intent,
        sequence: 7n,
      });

      expect(coinModule.getNextSequence).not.toHaveBeenCalled();
      expect(coinModule.craftTransaction).toHaveBeenCalledWith(
        context,
        { ...coinIntent, sequence: 7n },
        undefined,
      );
      expect(crafted).toEqual({
        transaction: "unsigned",
        details: { size: 1 },
        operation: {
          id: "",
          hash: "",
          type: "OUT",
          value: 15n,
          fee: 5n,
          asset: native,
          senders: ["address"],
          recipients: ["recipient"],
          block: null,
          date,
          failed: false,
          optimistic: true,
          details: { sequence: "7" },
        },
      });
    });

    it("takes the next sequence past the ones pending operations took", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);
      const account = aSyncedAccount([
        anOperation({ id: "a", block: null, optimistic: true, details: { sequence: "4" } }),
        anOperation({ id: "b", block: null, optimistic: true, details: { sequence: "5" } }),
        anOperation({ id: "synced", type: "OUT", details: { sequence: "9" } }),
      ]);

      const crafted = await module.craftTransaction(context, account, intent);

      expect(coinModule.getNextSequence).toHaveBeenCalledWith(context, "address");
      expect(coinModule.craftTransaction).toHaveBeenCalledWith(
        context,
        { ...coinIntent, sequence: 6n },
        undefined,
      );
      expect(crafted.operation.details).toEqual({ sequence: "6" });
    });

    it("crafts without a sequence on a chain without one", async () => {
      const coinModule = aCoinModule();
      jest.mocked(coinModule.getNextSequence).mockImplementation(() => {
        throw new Error("getNextSequence is not supported");
      });
      const module = createSingleAddressAccountModule(coinModule);

      const crafted = await module.craftTransaction(context, aSyncedAccount(), intent);

      expect(coinModule.craftTransaction).toHaveBeenCalledWith(context, coinIntent, undefined);
      expect(crafted.operation).not.toHaveProperty("details");
    });

    it("records the custom fee, without estimating one", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);
      const craftOptions = { customFees: { value: 9n } };

      const crafted = await module.craftTransaction(
        context,
        aSyncedAccount(),
        intent,
        craftOptions,
      );

      expect(coinModule.craftTransaction).toHaveBeenCalledWith(
        context,
        { ...coinIntent, sequence: 4n },
        craftOptions,
      );
      expect(coinModule.estimateFees).not.toHaveBeenCalled();
      expect(crafted.operation).toMatchObject({ value: 19n, fee: 9n });
    });

    it("values a token operation at its amount, its fee being paid in the native asset", async () => {
      const module = createSingleAddressAccountModule(aCoinModule());

      const crafted = await module.craftTransaction(context, aSyncedAccount(), {
        ...intent,
        asset: token,
      });

      expect(crafted.operation).toMatchObject({ value: 10n, fee: 5n, asset: token });
    });
  });

  describe("combine and broadcast", () => {
    const crafted: CraftedAccountTransaction = {
      transaction: "unsigned",
      operation: anOperation({ id: "", hash: "", type: "OUT", block: null, optimistic: true }),
    };

    it("combines the crafted transaction with its signatures", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);

      const signed = await module.combine(context, aSyncedAccount(), crafted, ["sig"], {
        pubkey: "pubkey",
      });

      expect(signed).toBe("signed");
      expect(coinModule.combine).toHaveBeenCalledWith(context, "unsigned", ["sig"], {
        pubkey: "pubkey",
      });
    });

    it("broadcasts, then records the optimistic operation under its hash", async () => {
      const coinModule = aCoinModule();
      const module = createSingleAddressAccountModule(coinModule);
      const account = aSyncedAccount();
      const broadcastOptions = { broadcastConfig: { mevProtected: true } };

      const operation = await module.broadcast(
        context,
        account,
        "signed",
        crafted,
        broadcastOptions,
      );

      expect(coinModule.broadcast).toHaveBeenCalledWith(context, "signed", broadcastOptions);
      expect(operation).toEqual({ ...crafted.operation, hash: "tx-hash", id: "tx-hash-OUT" });
      expect(account.history.snapshot()).toEqual([operation]);
      expect(await module.getPendingOperations(context, account)).toEqual([operation]);
    });
  });
});

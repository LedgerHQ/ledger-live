import { toJsonOperation } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { createMemoryPortfolioStore } from "./store";
import {
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  anAccountData,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { LocalNetwork, LocalPortfolioDeps } from "./types";
import { toValidationView, writeEndpoints } from "./write";

const state = { version: 1, data: { height: 10 } };
const accountIntent = { type: "send", sender: "key-account", recipient: "bc1-out", amount: "100" };
const otherIntent = { ...accountIntent, sender: "bc1-external" };
const crafted = {
  transaction: "raw-account",
  details: { inputs: [{ value: 5n }] },
  operation: anOperation({ id: "pending", hash: "" }),
};
const usdc = { type: "erc20", assetReference: "0xusdc" };
const validation = {
  errors: {},
  warnings: {},
  estimatedFees: 21n,
  amount: 100n,
  totalSpent: 121n,
};

const setUp = async (
  deps: Partial<LocalPortfolioDeps> = {},
  fields: Partial<Pick<LocalNetwork, "balanceOptions">> = {},
) => {
  const bitcoin: FakeNetwork = aLocalNetwork(fields);
  const ethereum: FakeNetwork = aLocalNetwork({ currencyId: "ethereum" });
  const { store, ...rest } = someDeps({ networks: { bitcoin, ethereum }, ...deps });
  await store.put(aStoredPortfolio({ accounts: [aStoredAccount({ state })] }));
  const accountData = anAccountData(store);
  bitcoin.accountModule.craftTransaction.mockResolvedValue(crafted);
  bitcoin.accountModule.combine.mockResolvedValue("signed-account");
  bitcoin.accountModule.broadcast.mockResolvedValue(anOperation({ hash: "account-hash" }));
  bitcoin.coinModule.combine.mockResolvedValue("signed-coin");
  bitcoin.coinModule.broadcast.mockResolvedValue("coin-hash");
  bitcoin.coinModule.craftTransactionData.mockReturnValue(undefined);
  return { bitcoin, ethereum, store, accountData, ...writeEndpoints({ store, ...rest }) };
};

const expectedAccountIntent = {
  intentType: "transaction",
  type: "send",
  recipient: "bc1-out",
  amount: 100n,
  asset: { type: "native" },
};
const expectedCoinIntent = { ...expectedAccountIntent, sender: "bc1-external", data: undefined };

describe("writeEndpoints", () => {
  describe("estimateTransactionFee", () => {
    it("estimates through the account module when the sender is the key of an account", async () => {
      const { bitcoin, accountData, estimateTransactionFee } = await setUp();
      bitcoin.accountModule.estimateFees.mockResolvedValue({
        value: 150n,
        parameters: { feeRate: 3n },
      });

      expect(await estimateTransactionFee("bitcoin", { intent: accountIntent })).toEqual({
        value: "150",
        parameters: { feeRate: "3" },
      });
      expect(bitcoin.accountModule.estimateFees).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        expectedAccountIntent,
        undefined,
      );
      expect(bitcoin.coinModule.craftTransactionData).not.toHaveBeenCalled();
    });

    it("finds the asset of an account intent among the account's balances", async () => {
      const { bitcoin, accountData, estimateTransactionFee } = await setUp();
      bitcoin.accountModule.getBalances.mockResolvedValue({ value: [{ asset: usdc, value: 5n }] });
      bitcoin.accountModule.estimateFees.mockResolvedValue({ value: 150n });

      await estimateTransactionFee("bitcoin", { intent: { ...accountIntent, asset: "0xusdc" } });

      expect(bitcoin.accountModule.getBalances).toHaveBeenCalledWith(bitcoin.context, accountData);
      expect(bitcoin.accountModule.estimateFees).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        { ...expectedAccountIntent, asset: usdc },
        undefined,
      );
    });

    it("hands the fees strategy and the fee parameters to the modules as fee options", async () => {
      const { bitcoin, accountData, estimateTransactionFee } = await setUp();
      bitcoin.accountModule.estimateFees.mockResolvedValue({ value: 150n });
      bitcoin.coinModule.estimateFees.mockResolvedValue({ value: 21000n });
      const intent = {
        ...accountIntent,
        feesStrategy: "fast" as const,
        networkParams: { feeParameters: { maxFeePerGas: 7n }, memo: "hi" },
      };

      await estimateTransactionFee("bitcoin", { intent });
      await estimateTransactionFee("bitcoin", { intent: { ...intent, sender: "bc1-external" } });

      const customFeesParameters = { feesStrategy: "fast", maxFeePerGas: 7n };
      expect(bitcoin.accountModule.estimateFees).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        { ...expectedAccountIntent, memo: "hi", feesStrategy: "fast" },
        { customFeesParameters },
      );
      expect(bitcoin.coinModule.estimateFees).toHaveBeenCalledWith(
        bitcoin.context,
        { ...expectedCoinIntent, memo: "hi", feesStrategy: "fast" },
        { customFeesParameters },
      );
    });

    it("hands empty fee parameters as sent", async () => {
      const { bitcoin, estimateTransactionFee } = await setUp();
      bitcoin.coinModule.estimateFees.mockResolvedValue({ value: 1n });

      await estimateTransactionFee("bitcoin", {
        intent: { ...otherIntent, networkParams: { feeParameters: {} } },
      });

      expect(bitcoin.coinModule.estimateFees).toHaveBeenCalledWith(
        bitcoin.context,
        expectedCoinIntent,
        { customFeesParameters: {} },
      );
    });

    it("estimates through the coin module for any other sender, its data completed", async () => {
      const { bitcoin, estimateTransactionFee } = await setUp();
      bitcoin.coinModule.estimateFees.mockResolvedValue({ value: 21000n });
      bitcoin.coinModule.craftTransactionData.mockReturnValue("0xdata");

      expect(await estimateTransactionFee("bitcoin", { intent: otherIntent })).toEqual({
        value: "21000",
      });
      expect(bitcoin.coinModule.estimateFees).toHaveBeenCalledWith(
        bitcoin.context,
        { ...expectedCoinIntent, data: "0xdata" },
        undefined,
      );
      expect(bitcoin.accountModule.getBalances).not.toHaveBeenCalled();
    });

    it("estimates through the coin module when the account found is gone", async () => {
      const store = {
        ...createMemoryPortfolioStore(),
        findAccount: async () => ({ portfolioId: "gone", accountId: "gone" }),
      };
      const { bitcoin, estimateTransactionFee } = await setUp({ store });
      bitcoin.coinModule.estimateFees.mockResolvedValue({ value: 1n });

      await estimateTransactionFee("bitcoin", { intent: accountIntent });

      expect(bitcoin.coinModule.estimateFees).toHaveBeenCalled();
    });
  });

  describe("validateTransaction", () => {
    it("validates through the account module against the account's balances", async () => {
      const { bitcoin, accountData, validateTransaction } = await setUp();
      bitcoin.accountModule.getBalances.mockResolvedValue({
        value: [{ asset: usdc, value: 500n }],
        updatedAt: 1,
      });
      bitcoin.accountModule.validateIntent.mockResolvedValue({
        ...validation,
        errors: { amount: new Error("Not enough") },
        totalFees: 25n,
      });

      expect(
        await validateTransaction("bitcoin", {
          intent: { ...accountIntent, asset: "0xusdc", networkParams: { feeParameters: {} } },
          customFees: "21",
        }),
      ).toEqual({
        errors: { amount: { name: "Error", message: "Not enough" } },
        warnings: {},
        estimatedFees: "21",
        totalFees: "25",
        amount: "100",
        totalSpent: "121",
      });
      expect(bitcoin.accountModule.validateIntent).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        { ...expectedAccountIntent, asset: usdc },
        { customFees: { value: 21n, parameters: {} } },
      );
    });

    it("validates through the coin module against the sender's balances on the network", async () => {
      const { bitcoin, validateTransaction } = await setUp(
        {},
        { balanceOptions: { knownAssets: [usdc] } },
      );
      const balances = [{ asset: usdc, value: 500n }];
      bitcoin.coinModule.getBalance.mockResolvedValue(balances);
      bitcoin.coinModule.validateIntent.mockResolvedValue(validation);
      bitcoin.coinModule.craftTransactionData.mockReturnValue("0xdata");

      expect(
        await validateTransaction("bitcoin", { intent: { ...otherIntent, asset: "0xusdc" } }),
      ).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: "21",
        amount: "100",
        totalSpent: "121",
      });
      expect(bitcoin.coinModule.getBalance).toHaveBeenCalledWith(bitcoin.context, "bc1-external", {
        knownAssets: [usdc],
      });
      expect(bitcoin.coinModule.validateIntent).toHaveBeenCalledWith(
        bitcoin.context,
        { ...expectedCoinIntent, asset: usdc, data: "0xdata" },
        balances,
        {},
      );
    });

    it("reads the coin sender's balances with no options when the network has none", async () => {
      const { bitcoin, validateTransaction } = await setUp();
      bitcoin.coinModule.getBalance.mockResolvedValue([]);
      bitcoin.coinModule.validateIntent.mockResolvedValue(validation);

      await validateTransaction("bitcoin", {
        intent: { ...otherIntent, feesStrategy: "slow" },
        customFees: "3",
      });

      expect(bitcoin.coinModule.getBalance.mock.calls[0]).toEqual([
        bitcoin.context,
        "bc1-external",
      ]);
      expect(bitcoin.coinModule.validateIntent).toHaveBeenCalledWith(
        bitcoin.context,
        expect.objectContaining({ feesStrategy: "slow" }),
        [],
        { customFees: { value: 3n, parameters: { feesStrategy: "slow" } } },
      );
    });

    it("answers unsupported when the coin module validates no intent", async () => {
      const { bitcoin, validateTransaction } = await setUp();
      bitcoin.coinModule.supports = jest.fn(() => false);

      await expect(validateTransaction("bitcoin", { intent: otherIntent })).rejects.toThrow(
        new PortfolioApiError("METHOD_NOT_ALLOWED", "validateIntent is not supported on bitcoin"),
      );
      expect(bitcoin.coinModule.getBalance).not.toHaveBeenCalled();
    });
  });

  describe("encodeTransaction", () => {
    it("crafts through the account module, with the custom fees, answering its operation", async () => {
      const { bitcoin, accountData, encodeTransaction } = await setUp();

      expect(
        await encodeTransaction("bitcoin", { intent: accountIntent, customFees: "200" }),
      ).toEqual({
        rawTransaction: "raw-account",
        details: { inputs: [{ value: "5" }], operation: toJsonOperation(crafted.operation) },
      });
      expect(bitcoin.accountModule.craftTransaction).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        expectedAccountIntent,
        { customFees: { value: 200n } },
      );
      expect(bitcoin.coinModule.craftTransactionData).not.toHaveBeenCalled();
    });

    it("answers the operation of an account module transaction crafted without details", async () => {
      const { bitcoin, encodeTransaction } = await setUp();
      const { details: _details, ...withoutDetails } = crafted;
      bitcoin.accountModule.craftTransaction.mockResolvedValue(withoutDetails);

      expect(await encodeTransaction("bitcoin", { intent: accountIntent })).toEqual({
        rawTransaction: "raw-account",
        details: { operation: toJsonOperation(crafted.operation) },
      });
    });

    it("crafts with the fee parameters under the custom fees, none without custom fees", async () => {
      const { bitcoin, encodeTransaction } = await setUp();
      bitcoin.coinModule.craftTransaction.mockResolvedValue({ transaction: "raw-coin" });
      const intent = {
        ...otherIntent,
        feesStrategy: "slow" as const,
        networkParams: { feeParameters: { gasPrice: 3n } },
      };

      await encodeTransaction("bitcoin", { intent, customFees: "200" });
      await encodeTransaction("bitcoin", { intent });
      await encodeTransaction("bitcoin", { intent: otherIntent, customFees: "200" });

      expect(
        bitcoin.coinModule.craftTransaction.mock.calls.map(([, , options]) => options),
      ).toEqual([
        { customFees: { value: 200n, parameters: { feesStrategy: "slow", gasPrice: 3n } } },
        {},
        { customFees: { value: 200n } },
      ]);
    });

    it("crafts through the coin module for any other sender, its data completed", async () => {
      const { bitcoin, encodeTransaction } = await setUp();
      bitcoin.coinModule.craftTransaction.mockResolvedValue({ transaction: "raw-coin" });
      bitcoin.coinModule.craftTransactionData.mockReturnValue("0xdata");

      expect(await encodeTransaction("bitcoin", { intent: otherIntent })).toEqual({
        rawTransaction: "raw-coin",
      });
      expect(bitcoin.coinModule.craftTransaction).toHaveBeenCalledWith(
        bitcoin.context,
        { ...expectedCoinIntent, data: "0xdata" },
        {},
      );
    });

    it("rejects invalid custom fees as a bad request", async () => {
      const { encodeTransaction } = await setUp();

      await expect(
        encodeTransaction("bitcoin", { intent: accountIntent, customFees: "fast" }),
      ).rejects.toThrow(new PortfolioApiError("BAD_REQUEST", "Invalid customFees fast"));
    });
  });

  describe("encodeRawTransaction", () => {
    const request = { transaction: "0xraw", sender: "0xsender", senderPublicKey: "pubkey" };

    it("wraps a raw transaction at the sequence sent", async () => {
      const { ethereum, encodeRawTransaction } = await setUp();
      ethereum.coinModule.craftRawTransaction.mockResolvedValue({
        transaction: "0xwrapped",
        details: { gas: 21000n },
      });

      expect(await encodeRawTransaction("ethereum", { ...request, sequence: "7" })).toEqual({
        rawTransaction: "0xwrapped",
        details: { gas: "21000" },
      });
      expect(ethereum.coinModule.craftRawTransaction).toHaveBeenCalledWith(
        ethereum.context,
        "0xraw",
        "0xsender",
        "pubkey",
        7n,
      );
      expect(ethereum.coinModule.getNextSequence).not.toHaveBeenCalled();
    });

    it("wraps it at the network's next sequence of the sender when none is sent", async () => {
      const { ethereum, encodeRawTransaction } = await setUp();
      ethereum.coinModule.getNextSequence.mockResolvedValue(12n);
      ethereum.coinModule.craftRawTransaction.mockResolvedValue({ transaction: "0xwrapped" });

      expect(await encodeRawTransaction("ethereum", request)).toEqual({
        rawTransaction: "0xwrapped",
      });
      expect(ethereum.coinModule.getNextSequence).toHaveBeenCalledWith(
        ethereum.context,
        "0xsender",
      );
      expect(ethereum.coinModule.craftRawTransaction).toHaveBeenCalledWith(
        ethereum.context,
        "0xraw",
        "0xsender",
        "pubkey",
        12n,
      );
    });

    it("answers unsupported when the coin module wraps no raw transaction or has no sequence", async () => {
      const { ethereum, encodeRawTransaction } = await setUp();
      const unsupported = new Set(["craftRawTransaction"]);
      ethereum.coinModule.supports = jest.fn((method: string) => !unsupported.has(method));

      await expect(encodeRawTransaction("ethereum", request)).rejects.toThrow(
        new PortfolioApiError(
          "METHOD_NOT_ALLOWED",
          "craftRawTransaction is not supported on ethereum",
        ),
      );
      unsupported.clear();
      unsupported.add("getNextSequence");
      await expect(encodeRawTransaction("ethereum", request)).rejects.toThrow(
        new PortfolioApiError("METHOD_NOT_ALLOWED", "getNextSequence is not supported on ethereum"),
      );
      expect(ethereum.coinModule.craftRawTransaction).not.toHaveBeenCalled();
    });

    it("rejects an invalid sequence as a bad request", async () => {
      const { encodeRawTransaction } = await setUp();

      await expect(
        encodeRawTransaction("ethereum", { ...request, sequence: "next" }),
      ).rejects.toThrow(new PortfolioApiError("BAD_REQUEST", "Invalid sequence next"));
    });
  });

  describe("combineTransaction and broadcastTransaction", () => {
    const broadcastConfig = {
      mevProtected: true,
      source: { type: "dApp" as const, name: "a dApp" },
    };

    it("combine and broadcast an account transaction through its account module", async () => {
      const { bitcoin, accountData, ...endpoints } = await setUp();
      await endpoints.encodeTransaction("bitcoin", { intent: accountIntent });

      const combined = await endpoints.combineTransaction("bitcoin", {
        rawTransaction: "raw-account",
        signature: "sig",
        pubkey: "pk",
      });
      const broadcast = await endpoints.broadcastTransaction("bitcoin", {
        signedTransaction: "signed-account",
        broadcastConfig,
      });

      expect(combined).toEqual({ signedTransaction: "signed-account" });
      expect(broadcast).toEqual({ transactionId: "account-hash" });
      expect(bitcoin.accountModule.combine).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        crafted,
        ["sig"],
        { pubkey: "pk" },
      );
      expect(bitcoin.accountModule.broadcast).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        "signed-account",
        crafted,
        { broadcastConfig },
      );
    });

    it("forgets an account transaction once broadcast", async () => {
      const { bitcoin, ...endpoints } = await setUp();
      await endpoints.encodeTransaction("bitcoin", { intent: accountIntent });
      await endpoints.combineTransaction("bitcoin", {
        rawTransaction: "raw-account",
        signature: "s",
      });
      await endpoints.broadcastTransaction("bitcoin", { signedTransaction: "signed-account" });

      await endpoints.combineTransaction("bitcoin", {
        rawTransaction: "raw-account",
        signature: "s",
      });
      await endpoints.broadcastTransaction("bitcoin", { signedTransaction: "signed-account" });

      expect(bitcoin.accountModule.combine).toHaveBeenCalledTimes(1);
      expect(bitcoin.accountModule.broadcast).toHaveBeenCalledTimes(1);
      expect(bitcoin.accountModule.broadcast.mock.calls[0]?.[4]).toBeUndefined();
      expect(bitcoin.coinModule.combine).toHaveBeenCalledWith(
        bitcoin.context,
        "raw-account",
        ["s"],
        {},
      );
      expect(bitcoin.coinModule.broadcast).toHaveBeenCalledWith(
        bitcoin.context,
        "signed-account",
        undefined,
      );
    });

    it("combine and broadcast any other transaction through the coin module", async () => {
      const { bitcoin, combineTransaction, broadcastTransaction } = await setUp();

      expect(
        await combineTransaction("bitcoin", { rawTransaction: "raw-coin", signature: "sig" }),
      ).toEqual({ signedTransaction: "signed-coin" });
      expect(
        await broadcastTransaction("bitcoin", {
          signedTransaction: "signed-coin",
          broadcastConfig,
        }),
      ).toEqual({ transactionId: "coin-hash" });
      expect(bitcoin.accountModule.combine).not.toHaveBeenCalled();
      expect(bitcoin.coinModule.broadcast).toHaveBeenCalledWith(bitcoin.context, "signed-coin", {
        broadcastConfig,
      });
    });

    it("use the coin module for an account transaction combined on another network", async () => {
      const { ethereum, ...endpoints } = await setUp();
      ethereum.coinModule.combine.mockResolvedValue("signed-on-ethereum");
      await endpoints.encodeTransaction("bitcoin", { intent: accountIntent });

      await endpoints.combineTransaction("ethereum", {
        rawTransaction: "raw-account",
        signature: "s",
      });

      expect(ethereum.coinModule.combine).toHaveBeenCalled();
      expect(ethereum.accountModule.combine).not.toHaveBeenCalled();
    });

    it("use the coin module once the account of the transaction is removed", async () => {
      const { bitcoin, store, ...endpoints } = await setUp();
      await endpoints.encodeTransaction("bitcoin", { intent: accountIntent });
      await store.put(aStoredPortfolio({ accounts: [] }));

      await endpoints.combineTransaction("bitcoin", {
        rawTransaction: "raw-account",
        signature: "s",
      });

      expect(bitcoin.coinModule.combine).toHaveBeenCalled();
      expect(bitcoin.accountModule.combine).not.toHaveBeenCalled();
    });
  });

  it("rejects a network not served locally as a bad request", async () => {
    const endpoints = await setUp();
    const badRequest = new PortfolioApiError("BAD_REQUEST", "Network solana is not served locally");

    await expect(
      endpoints.estimateTransactionFee("solana", { intent: accountIntent }),
    ).rejects.toThrow(badRequest);
    await expect(
      endpoints.validateTransaction("solana", { intent: accountIntent }),
    ).rejects.toThrow(badRequest);
    await expect(endpoints.encodeTransaction("solana", { intent: accountIntent })).rejects.toThrow(
      badRequest,
    );
    await expect(
      endpoints.encodeRawTransaction("solana", {
        transaction: "raw",
        sender: "sol",
        senderPublicKey: "pk",
      }),
    ).rejects.toThrow(badRequest);
    await expect(
      endpoints.combineTransaction("solana", { rawTransaction: "raw", signature: "sig" }),
    ).rejects.toThrow(badRequest);
    await expect(
      endpoints.broadcastTransaction("solana", { signedTransaction: "signed" }),
    ).rejects.toThrow(badRequest);
  });
});

describe("toValidationView", () => {
  it("answers errors and warnings in JSON form, amounts as decimal strings", () => {
    const warning = Object.assign(new Error("High fees"), { fees: 30n });

    expect(
      toValidationView({
        ...validation,
        warnings: { feeTooHigh: warning },
      }),
    ).toEqual({
      errors: {},
      warnings: { feeTooHigh: { name: "Error", message: "High fees", fees: "30" } },
      estimatedFees: "21",
      amount: "100",
      totalSpent: "121",
    });
  });
});

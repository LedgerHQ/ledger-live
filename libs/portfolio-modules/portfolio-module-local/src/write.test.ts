import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { createMemoryPortfolioStore } from "./store";
import {
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { LocalPortfolioDeps } from "./types";
import { writeEndpoints } from "./write";

const state = { version: 1, data: { height: 10 } };
const accountIntent = { type: "send", sender: "key-account", recipient: "bc1-out", amount: "100" };
const otherIntent = { ...accountIntent, sender: "bc1-external" };
const crafted = {
  transaction: "raw-account",
  details: { inputs: [{ value: 5n }] },
  operation: anOperation({ id: "pending", hash: "" }),
};

const setUp = async (deps: Partial<LocalPortfolioDeps> = {}) => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const ethereum: FakeNetwork = aLocalNetwork({ currencyId: "ethereum" });
  const { store, ...rest } = someDeps({ networks: { bitcoin, ethereum }, ...deps });
  await store.put(aStoredPortfolio({ accounts: [aStoredAccount({ state })] }));
  const accountData = {
    descriptor: aStoredAccount().descriptor,
    state,
    history: store.history("account"),
  };
  bitcoin.accountModule.craftTransaction.mockResolvedValue(crafted);
  bitcoin.accountModule.combine.mockResolvedValue("signed-account");
  bitcoin.accountModule.broadcast.mockResolvedValue(anOperation({ hash: "account-hash" }));
  bitcoin.coinModule.combine.mockResolvedValue("signed-coin");
  bitcoin.coinModule.broadcast.mockResolvedValue("coin-hash");
  return { bitcoin, ethereum, store, accountData, ...writeEndpoints({ store, ...rest }) };
};

const expectedAccountIntent = {
  intentType: "transaction",
  type: "send",
  recipient: "bc1-out",
  amount: 100n,
  asset: { type: "native" },
};

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
      );
    });

    it("estimates through the coin module for any other sender", async () => {
      const { bitcoin, estimateTransactionFee } = await setUp();
      bitcoin.coinModule.estimateFees.mockResolvedValue({ value: 21000n });

      expect(await estimateTransactionFee("bitcoin", { intent: otherIntent })).toEqual({
        value: "21000",
      });
      expect(bitcoin.coinModule.estimateFees).toHaveBeenCalledWith(bitcoin.context, {
        ...expectedAccountIntent,
        sender: "bc1-external",
      });
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

  describe("encodeTransaction", () => {
    it("crafts through the account module, with the custom fees", async () => {
      const { bitcoin, accountData, encodeTransaction } = await setUp();

      expect(
        await encodeTransaction("bitcoin", { intent: accountIntent, customFees: "200" }),
      ).toEqual({ rawTransaction: "raw-account", details: { inputs: [{ value: "5" }] } });
      expect(bitcoin.accountModule.craftTransaction).toHaveBeenCalledWith(
        bitcoin.context,
        accountData,
        expectedAccountIntent,
        { customFees: { value: 200n } },
      );
    });

    it("crafts through the coin module for any other sender", async () => {
      const { bitcoin, encodeTransaction } = await setUp();
      bitcoin.coinModule.craftTransaction.mockResolvedValue({ transaction: "raw-coin" });

      expect(await encodeTransaction("bitcoin", { intent: otherIntent })).toEqual({
        rawTransaction: "raw-coin",
      });
      expect(bitcoin.coinModule.craftTransaction).toHaveBeenCalledWith(
        bitcoin.context,
        expect.objectContaining({ sender: "bc1-external" }),
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

  describe("combineTransaction and broadcastTransaction", () => {
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
      expect(bitcoin.coinModule.combine).toHaveBeenCalledWith(
        bitcoin.context,
        "raw-account",
        ["s"],
        {},
      );
      expect(bitcoin.coinModule.broadcast).toHaveBeenCalledWith(bitcoin.context, "signed-account");
    });

    it("combine and broadcast any other transaction through the coin module", async () => {
      const { bitcoin, combineTransaction, broadcastTransaction } = await setUp();

      expect(
        await combineTransaction("bitcoin", { rawTransaction: "raw-coin", signature: "sig" }),
      ).toEqual({ signedTransaction: "signed-coin" });
      expect(await broadcastTransaction("bitcoin", { signedTransaction: "signed-coin" })).toEqual({
        transactionId: "coin-hash",
      });
      expect(bitcoin.accountModule.combine).not.toHaveBeenCalled();
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
    await expect(endpoints.encodeTransaction("solana", { intent: accountIntent })).rejects.toThrow(
      badRequest,
    );
    await expect(
      endpoints.combineTransaction("solana", { rawTransaction: "raw", signature: "sig" }),
    ).rejects.toThrow(badRequest);
    await expect(
      endpoints.broadcastTransaction("solana", { signedTransaction: "signed" }),
    ).rejects.toThrow(badRequest);
  });
});

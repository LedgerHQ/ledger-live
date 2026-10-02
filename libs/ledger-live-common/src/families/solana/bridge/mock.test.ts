import BigNumber from "bignumber.js";
import { VersionedTransaction } from "@solana/web3.js";
import { firstValueFrom, filter } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import mockBridge from "./mock";
import type { Transaction } from "../types";

const SENDER = "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx";
const RECIPIENT = "63M7kPJvLsG46jbR2ZriEU8xwPqkMNKNoBBQ46pobbvo";

const account = {
  id: `mock:1:solana:${SENDER}:`,
  freshAddress: SENDER,
  balance: new BigNumber(1_000_000_000),
  currency: getCryptoCurrencyById("solana"),
} as Account;

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const tokenAccount = {
  id: `${account.id}+${USDC_MINT}`,
  type: "TokenAccount",
  token: {
    id: "solana/spl/usdc",
    tokenType: "spl-token",
    contractAddress: USDC_MINT,
    name: "USD Coin",
    units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  },
} as unknown as NonNullable<Account["subAccounts"]>[number];

describe("solana mock bridge", () => {
  it("creates a transaction with useAllAmount set, so the send flows offer Max", () => {
    expect(mockBridge.accountBridge.createTransaction(account).useAllAmount).toBe(false);
  });

  it("prepares a token send so it is not crafted as a native one", async () => {
    const withToken = { ...account, subAccounts: [tokenAccount] } as Account;
    const transaction = {
      family: "solana",
      mode: "send",
      amount: new BigNumber(1_000),
      recipient: RECIPIENT,
      subAccountId: tokenAccount.id,
    } as Transaction;

    const prepared = await mockBridge.accountBridge.prepareTransaction(withToken, transaction);

    expect(prepared.assetReference).toBe(USDC_MINT);
    expect(prepared.assetOwner).toBe(SENDER);
  });

  it("leaves a transaction whose sub account is unknown untouched", async () => {
    const transaction = {
      family: "solana",
      mode: "send",
      amount: new BigNumber(1_000),
      recipient: RECIPIENT,
      subAccountId: "unknown",
    } as Transaction;

    expect(await mockBridge.accountBridge.prepareTransaction(account, transaction)).toBe(
      transaction,
    );
  });

  it("spends the whole balance at most", async () => {
    expect(await mockBridge.accountBridge.estimateMaxSpendable({ account })).toEqual(
      account.balance,
    );
  });

  describe("getTransactionStatus", () => {
    const status = (patch: Partial<Transaction>) =>
      mockBridge.accountBridge.getTransactionStatus(account, {
        family: "solana",
        mode: "send",
        amount: new BigNumber(1_000),
        recipient: RECIPIENT,
        ...patch,
      } as Transaction);

    it("accepts a funded send", async () => {
      expect((await status({})).errors).toEqual({});
    });

    it("requires a recipient, except to open a token account or revoke a delegation", async () => {
      expect((await status({ recipient: "" })).errors.recipient).toBeDefined();
      expect((await status({ recipient: "", mode: "opt-in" })).errors).toEqual({});
      expect((await status({ recipient: "", mode: "revoke" })).errors).toEqual({});
    });

    it("rejects more than the balance, and spends it all on send max", async () => {
      expect((await status({ amount: new BigNumber(2_000_000_000) })).errors.amount).toBeDefined();
      expect(await status({ useAllAmount: true })).toMatchObject({
        errors: {},
        amount: account.balance,
        totalSpent: account.balance,
      });
    });
  });

  it("signs a transaction the wallet API can deserialize", async () => {
    const transaction = {
      family: "solana",
      mode: "send",
      amount: new BigNumber(1_000_000),
      recipient: RECIPIENT,
    } as Transaction;

    const event = await firstValueFrom(
      mockBridge.accountBridge
        .signOperation({ account, transaction, deviceId: "" })
        .pipe(filter(e => e.type === "signed")),
    );

    const signed = VersionedTransaction.deserialize(
      Buffer.from(event.signedOperation.signature, "base64"),
    );
    const keys = signed.message.staticAccountKeys.map(k => k.toBase58());

    expect(keys).toEqual([
      SENDER,
      RECIPIENT,
      "ComputeBudget111111111111111111111111111111",
      "11111111111111111111111111111111",
    ]);
    expect(signed.message.compiledInstructions).toHaveLength(2);
  });

  it("signs a partner-built transaction, keeping its instructions", async () => {
    const raw =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";

    const event = await firstValueFrom(
      mockBridge.accountBridge
        .signRawOperation({ account, transaction: raw, deviceId: "" })
        .pipe(filter(e => e.type === "signed")),
    );

    const signed = VersionedTransaction.deserialize(
      Buffer.from(event.signedOperation.signature, "base64"),
    );

    expect(signed.message.compiledInstructions).toHaveLength(1);
    expect(signed.signatures[0]).not.toEqual(new Uint8Array(64));
  });
});

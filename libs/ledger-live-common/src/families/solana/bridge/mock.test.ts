import BigNumber from "bignumber.js";
import { VersionedTransaction } from "@solana/web3.js";
import { firstValueFrom, filter } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import mockBridge from "./mock";
import type { Transaction } from "../types";

const SENDER = "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx";
const RECIPIENT = "63M7kPJvLsG46jbR2ZriEU8xwPqkMNKNoBBQ46pobbvo";

const account = {
  id: `mock:1:solana:${SENDER}:`,
  freshAddress: SENDER,
  balance: new BigNumber(1_000_000_000),
} as Account;

describe("solana mock bridge", () => {
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

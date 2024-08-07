import BigNumber from "bignumber.js";
import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import coinConfig, { type StellarCoinConfig } from "../config";
import { NetworkInfo } from "../types";

describe("buildTransaction", () => {
  const sender = "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV";

  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): StellarCoinConfig => ({
        status: { type: "active" },
        explorer: {
          url: "https://stellar.coin.ledger.com", //"https://horizon-testnet.stellar.org/",
          fetchLimit: 100,
        },
      }),
    );
  });

  it("throws an error if transaction has no NetworkInfo", async () => {
    // Given
    const account = createFixtureAccount({ freshAddress: sender });
    const transaction = createFixtureTransaction({ fees: BigNumber(1) });

    // When
    await expect(buildTransaction(account, transaction)).rejects.toThrow("stellar family");
  });

  it("throws an error when no fees are setted in the transaction", async () => {
    // Given
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({
      networkInfo: { family: "stellar" } as NetworkInfo,
    });

    // When
    await expect(buildTransaction(account, transaction)).rejects.toThrow("FeeNotLoaded");
  });

  it.skip("crash if transaction amount is 0", async () => {
    // Given
    const account = createFixtureAccount({ freshAddress: sender });
    const transaction = createFixtureTransaction({
      amount: BigNumber(0),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
    });

    // When
    const builtTransaction = await buildTransaction(account, transaction);

    // Then
    expect(builtTransaction).toBeUndefined();
  });

  it("throws an error when recipient is an invalid address", async () => {
    // Given
    const account = createFixtureAccount({ freshAddress: sender });
    const transaction = createFixtureTransaction({
      amount: BigNumber(10),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
      recipient: "NEW",
    });

    // When
    await expect(buildTransaction(account, transaction)).rejects.toThrow("destination is invalid");
  });

  it("returns a built transaction in Stellar format", async () => {
    // Given
    const account = createFixtureAccount({ freshAddress: sender });
    const transaction = createFixtureTransaction({
      amount: BigNumber(10),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
    });

    // When
    const builtTransaction = await buildTransaction(account, transaction);

    // Then
    expect(builtTransaction.fee).toEqual("1");
    expect(builtTransaction.source).toEqual(sender);
    expect(builtTransaction.operations).toHaveLength(1);
    const operation = builtTransaction.operations[0];
    expect(operation.type).toEqual("payment");
    expect((operation as any).destination).toEqual(transaction.recipient);
    expect((operation as any).amount).toEqual("0.0000010");
    expect((operation as any).asset.code).toEqual("XLM");
    expect((operation as any).asset.issuer).toBeUndefined();
    expect(builtTransaction.toXDR().slice(0, 67)).toEqual(
      "AAAAAgAAAAAnxYb4SZKUxk1X+NeVbu9EMd5YqyDhyIAB9s8THJfW8wAAAAEBn2AnAAA",
    );
    expect(builtTransaction.toXDR().slice(70)).toEqual(
      "AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAADw9kGYtpM1vsCgDoHjZOVO/sjTKLsmA51f8vdM9oaecgAAAAAAAAAAAAAACgAAAAAAAAAA",
    );
  });

  it("returns a built transaction in Stellar format when useAllAmount", async () => {
    // Given
    const account = createFixtureAccount({
      freshAddress: sender,
      balance: BigNumber(600239412),
      spendableBalance: BigNumber(500239412),
    });
    const transaction = createFixtureTransaction({
      amount: BigNumber(10),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
      useAllAmount: true,
    });

    // When
    const builtTransaction = await buildTransaction(account, transaction);

    // Then
    expect(builtTransaction.fee).toEqual("1");
    expect(builtTransaction.source).toEqual(sender);
    expect(builtTransaction.operations).toHaveLength(1);
    const operation = builtTransaction.operations[0];
    expect(operation.type).toEqual("payment");
    expect((operation as any).destination).toEqual(transaction.recipient);
    expect((operation as any).amount).toEqual("50.0239411");
    expect((operation as any).asset.code).toEqual("XLM");
    expect((operation as any).asset.issuer).toBeUndefined();
    expect(builtTransaction.toXDR().slice(0, 67)).toEqual(
      "AAAAAgAAAAAnxYb4SZKUxk1X+NeVbu9EMd5YqyDhyIAB9s8THJfW8wAAAAEBn2AnAAA",
    );
    expect(builtTransaction.toXDR().slice(70)).toEqual(
      "AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAADw9kGYtpM1vsCgDoHjZOVO/sjTKLsmA51f8vdM9oaecgAAAAAAAAAAHdEMMwAAAAAAAAAA",
    );
  });

  it("returns a built transaction in Stellar format when asset used is USDC", async () => {
    // Given
    const account = createFixtureAccount({ freshAddress: sender });
    const transaction = createFixtureTransaction({
      amount: BigNumber(10),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
      recipient: "GDRQAROTM7WYEHZ42SXUVUOHO36MLQKLFIZ5Y2JBWVQRPCJ3SQBBA3LH",
      assetCode: "USDC",
      assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });

    // When
    const builtTransaction = await buildTransaction(account, transaction);

    // Then
    expect(builtTransaction.fee).toEqual("1");
    expect(builtTransaction.source).toEqual(sender);
    expect(builtTransaction.operations).toHaveLength(1);
    const operation = builtTransaction.operations[0];
    expect(operation.type).toEqual("payment");
    expect((operation as any).asset.code).toEqual("USDC");
    expect((operation as any).asset.issuer).toEqual(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    );
    expect(builtTransaction.toXDR().slice(0, 67)).toEqual(
      "AAAAAgAAAAAnxYb4SZKUxk1X+NeVbu9EMd5YqyDhyIAB9s8THJfW8wAAAAEBn2AnAAA",
    );
  });

  it("returns a built transaction in Stellar format", async () => {
    // Given
    const account = createFixtureAccount({ freshAddress: sender });
    const transaction = createFixtureTransaction({
      amount: BigNumber(10),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
      memoType: "MEMO_TEXT",
      memoValue: "Hello",
    });

    // When
    const builtTransaction = await buildTransaction(account, transaction);

    // Then
    expect(builtTransaction.fee).toEqual("1");
    expect(builtTransaction.source).toEqual(sender);
    expect(builtTransaction.operations).toHaveLength(1);
    expect(builtTransaction.memo.type).toEqual("text");
    expect(builtTransaction.memo.value).toEqual("Hello");
    const operation = builtTransaction.operations[0];
    expect(operation.type).toEqual("payment");
    expect((operation as any).asset.code).toEqual("XLM");
    expect((operation as any).asset.issuer).toBeUndefined();
    expect(builtTransaction.toXDR().slice(0, 67)).toEqual(
      "AAAAAgAAAAAnxYb4SZKUxk1X+NeVbu9EMd5YqyDhyIAB9s8THJfW8wAAAAEBn2AnAAA",
    );
    expect(builtTransaction.toXDR().slice(70)).toEqual(
      "AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAVIZWxsbwAAAAAAAAEAAAAAAAAAAQAAAADw9kGYtpM1vsCgDoHjZOVO/sjTKLsmA51f8vdM9oaecgAAAAAAAAAAAAAACgAAAAAAAAAA",
    );
  });
});

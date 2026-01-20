import invariant from "invariant";
import * as sdk from "@hashgraph/sdk";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import { craftTransaction } from "./craftTransaction";
import type { HederaMemo, HederaTxData } from "../types";

describe("craftTransaction", () => {
  it("should accept account id or long zero EVM address when crafting ERC20 token transfer transaction", async () => {
    // recipient account has no EVM alias, long-zero EVM address is used

    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      amount: BigInt(1000),
      sender: "0.0.54321",
      asset: {
        type: "erc20",
        assetReference: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Token transfer",
      },
      data: {
        type: "erc20",
        gasLimit: BigInt(100000),
      },
    } satisfies Omit<TransactionIntent<HederaMemo, HederaTxData>, "recipient">;

    const txIntentAccountId = {
      ...txIntent,
      recipient: "0.0.12345",
    } satisfies TransactionIntent<HederaMemo, HederaTxData>;

    const txIntentEVMAddress = {
      ...txIntentAccountId,
      recipient: "0x0000000000000000000000000000000000003039",
    } satisfies TransactionIntent<HederaMemo, HederaTxData>;

    const resultAccountId = await craftTransaction(txIntentAccountId);
    const resultEVMAddress = await craftTransaction(txIntentEVMAddress);

    expect(resultAccountId.tx).toBeInstanceOf(sdk.ContractExecuteTransaction);
    expect(resultEVMAddress.tx).toBeInstanceOf(sdk.ContractExecuteTransaction);
    invariant(
      resultAccountId.tx instanceof sdk.ContractExecuteTransaction,
      "ContractExecuteTransaction type guard",
    );
    invariant(
      resultEVMAddress.tx instanceof sdk.ContractExecuteTransaction,
      "ContractExecuteTransaction type guard",
    );

    expect(resultAccountId.tx.functionParameters).toEqual(resultEVMAddress.tx.functionParameters);
  });

  it("should accept account id or EVM alias address when crafting ERC20 token transfer transaction", async () => {
    // recipient account has an EVM alias, it is resolved by fetching account info from mirror node
    const txIntent = {
      intentType: "transaction",
      type: HEDERA_TRANSACTION_MODES.Send,
      amount: BigInt(1000),
      sender: "0.0.9806001",
      asset: {
        type: "erc20",
        assetReference: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
      },
      memo: {
        kind: "text",
        type: "string",
        value: "Token transfer",
      },
      data: {
        type: "erc20",
        gasLimit: BigInt(100000),
      },
    } satisfies Omit<TransactionIntent<HederaMemo, HederaTxData>, "recipient">;

    const txIntentAccountId = {
      ...txIntent,
      recipient: "0.0.9806001",
    } satisfies TransactionIntent<HederaMemo, HederaTxData>;

    const txIntentEVMAddress = {
      ...txIntentAccountId,
      recipient: "0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc",
    } satisfies TransactionIntent<HederaMemo, HederaTxData>;

    const resultAccountId = await craftTransaction(txIntentAccountId);
    const resultEVMAddress = await craftTransaction(txIntentEVMAddress);

    expect(resultAccountId.tx).toBeInstanceOf(sdk.ContractExecuteTransaction);
    expect(resultEVMAddress.tx).toBeInstanceOf(sdk.ContractExecuteTransaction);
    invariant(
      resultAccountId.tx instanceof sdk.ContractExecuteTransaction,
      "ContractExecuteTransaction type guard",
    );
    invariant(
      resultEVMAddress.tx instanceof sdk.ContractExecuteTransaction,
      "ContractExecuteTransaction type guard",
    );

    expect(resultAccountId.tx.functionParameters).toEqual(resultEVMAddress.tx.functionParameters);
  });
});

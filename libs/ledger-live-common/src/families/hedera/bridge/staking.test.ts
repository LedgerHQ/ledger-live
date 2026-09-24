/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { craftTransaction } from "@ledgerhq/coin-hedera/logic/craftTransaction";
import { rpcClient } from "@ledgerhq/coin-hedera/network/rpc";
import { getMockedConfig } from "@ledgerhq/coin-hedera/test/fixtures/config.fixture";
import type { HederaMemo, HederaTxData } from "@ledgerhq/coin-hedera/types";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { transactionToIntent } from "../../../bridge/generic-coin-framework/utils";
import type { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import hederaBridge from "./api";

jest.mock("@ledgerhq/coin-hedera/network/rpc", () => ({
  rpcClient: require("@ledgerhq/coin-hedera/test/fixtures/rpc.fixture").getMockedRpcClient(),
}));

const currency = getCryptoCurrencyById("hedera");
const { computeIntentType, buildIntentData } = hederaBridge(currency);
const account = { freshAddress: "0.0.54321", currency } as Account;

async function craftedStakedNodeId(
  transaction: Partial<GenericTransaction>,
): Promise<number | undefined> {
  const intent = transactionToIntent(
    account,
    { family: "hedera", amount: new BigNumber(0), recipient: "", ...transaction },
    computeIntentType,
    undefined,
    buildIntentData,
  );

  const { tx } = await craftTransaction({
    txIntent: intent as TransactionIntent<HederaMemo, HederaTxData>,
    configOrCurrencyId: getMockedConfig(),
  });

  invariant("stakedNodeId" in tx, `${tx.constructor.name} stakes to no node`);

  return tx.stakedNodeId?.toNumber();
}

describe("hedera staking, from the generic transaction to the crafted transaction", () => {
  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  it.each(["delegate", "redelegate"] as const)("%s stakes to the selected node", async mode => {
    expect(await craftedStakedNodeId({ mode, valId: "3" })).toBe(3);
  });

  // The Hedera SDK encodes a cleared staked node as -1.
  it("undelegate clears the staked node", async () => {
    expect(await craftedStakedNodeId({ mode: "undelegate", valId: "3" })).toBe(-1);
  });
});

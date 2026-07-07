import { BigNumber } from "bignumber.js";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import { prepareTransaction } from "./prepareTransaction";
import type { Transaction } from "./types";

// Passing protocolParams on the transaction makes prepareTransaction skip its network fetch.
const baseTransaction = (): Transaction => ({
  family: "cardano",
  recipient:
    "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
  amount: new BigNumber(0),
  mode: "send",
  poolId: undefined,
  protocolParams: getProtocolParamsFixture(),
});

describe("prepareTransaction", () => {
  it("reports the real network fee, not the whole balance, on a low-balance account with no amount entered (LIVE-33176)", async () => {
    const account = getCardanoAccountFixture({ delegation: undefined });
    account.balance = new BigNumber(1e6);
    account.spendableBalance = new BigNumber(1e6);
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
    account.cardanoResources.utxos = [
      { ...account.cardanoResources.utxos[0], amount: new BigNumber(1e6) },
    ];

    const prepared = await prepareTransaction(account, baseTransaction());

    // Before the fix Typhon's dust guard set the fee to the whole ~1 ADA balance; it must now show
    // the protocol-minimum fee (a few hundred thousand lovelace), well under the balance.
    expect(prepared.amount.toString()).toBe("0");
    expect(prepared.fees?.gt(0)).toBe(true);
    expect(prepared.fees?.lt(1e6)).toBe(true);
  });
});

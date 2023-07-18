import BigNumber from "bignumber.js";
import type { PolkadotAccount } from "../types";
import { fromTransactionRaw } from "../transaction";
import { PolkadotAPI } from "../api";
import { getSendTransactionStatus } from "../js-getTransactionStatus";
import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { makeNoCache } from "@ledgerhq/coin-framework/cache";

describe("getTransactionStatus", () => {
  it("there should not be any error to send funds from an account that has enough locking balance but less than 1 DOT as available balance", async () => {
    const account: Partial<PolkadotAccount> = {
      balance: new BigNumber(25000000000),
      spendableBalance: new BigNumber(5000000000),
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(0),
        unlockedBalance: new BigNumber(20000000000),
        unlockingBalance: new BigNumber(0),
        nominations: [],
        unlockings: [],
      },
    };
    const transaction = fromTransactionRaw({
      family: "polkadot",
      recipient: "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV",
      amount: "1000000000",
      mode: "send",
      era: null,
      validators: [],
      fees: "0",
      rewardDestination: null,
      numSlashingSpans: 0,
    });
    const mockNetwork: NetworkRequestCall = (_): Promise<unknown> => {
      return Promise.resolve({
        data: {
          nonce: "13",
          free: "1000000000",
        },
      });
    };
    const polkadotAPI = new PolkadotAPI(mockNetwork, makeNoCache);
    const status = await getSendTransactionStatus(
      polkadotAPI,
      account as PolkadotAccount,
      transaction,
      new BigNumber(1000000000),
    );
    expect(status.errors).toEqual({});
  });
});

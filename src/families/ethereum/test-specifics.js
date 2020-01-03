// @flow

import { BigNumber } from "bignumber.js";
import { InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";
import type { Account, Transaction } from "../../types";
import { fromAccountRaw } from "../../account";
import { getAccountBridge } from "../../bridge";
import dataset from "./test-dataset";

// FIXME move the tests into using the test-dataset transactions
// FIXME simplify tests to the minimal specific that ain't covered by accountBridges

export default () => {
  describe("ethereum transaction tests", () => {
    let account: Account = fromAccountRaw(
      dataset.currencies.ethereum.accounts[1].raw
    );

    const bridge = getAccountBridge(account, null);

    beforeAll(async () => {
      account = await bridge
        .sync(account, { paginationConfig: {} })
        .toPromise()
        .then(f => f(account));
    });

    test("invalid recipient have a recipientError", async () => {
      const t: Transaction = {
        ...bridge.createTransaction(account),
        recipient: "invalidADDRESS"
      };
      const status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.recipient).toEqual(new InvalidAddress());
    });

    test("valid recipient OR valid recipient lowercase should succeed", async () => {
      let t = {
        ...bridge.createTransaction(account),
        amount: BigNumber(1),
        recipient: "0x5df0C369641B8Af3c7e9ae076E5466eF678319Cd"
      };
      let status = await bridge.getTransactionStatus(account, t);
      t = await bridge.prepareTransaction(account, t);
      status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.amount).toBeUndefined();
      expect(status.errors.recipient).toBeUndefined();
      t = {
        ...bridge.createTransaction(account),
        amount: BigNumber(1),
        recipient: "0x5df0c369641b8af3c7e9ae076e5466ef678319cd"
      };
      t = await bridge.prepareTransaction(account, t);
      status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.amount).toBeUndefined();
      expect(status.errors.recipient).toBeUndefined();
    });

    test("insufficient balance have an error", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "0x5df0C369641B8Af3c7e9ae076E5466eF678319Cd",
        amount: BigNumber(
          9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
        )
      };
      t = await bridge.prepareTransaction(account, t);
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.amount).toEqual(new NotEnoughBalance());
    });
  });
};

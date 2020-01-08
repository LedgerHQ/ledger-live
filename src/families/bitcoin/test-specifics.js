// @flow

import { BigNumber } from "bignumber.js";
import {
  InvalidAddress,
  FeeNotLoaded,
  FeeRequired,
  NotEnoughBalance
} from "@ledgerhq/errors";
import type { Account } from "../../types";
import { fromAccountRaw } from "../../account";
import { getAccountBridge } from "../../bridge";
import dataset from "./test-dataset";

// FIXME move the tests into using the test-dataset transactions
// FIXME simplify tests to the minimal specific that ain't covered by accountBridges

export default () => {
  describe("bitcoin transaction tests", () => {
    let account: Account = fromAccountRaw(
      dataset.currencies.bitcoin.accounts[1].raw
    );

    const bridge = getAccountBridge(account, null);

    beforeAll(async () => {
      account = await bridge
        .sync(account, { paginationConfig: {} })
        .toPromise()
        .then(f => f(account));
    });

    test("Lowercase recipient address should have a recipientError", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "dcovduyafuefmk2qvuw5xdtaunla2lp72n"
      };
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.recipient).toEqual(new InvalidAddress());
    });

    test("Valid recipient address should Succeed", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "39KaU7ksuQqmEGzLUCZzb9VYMm2H5yQ3QL"
      };
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.recipient).toBeUndefined();
    });

    test("Missing Fees should have a FeeError", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "bc1qwqfns0rs5zxrrwf80k4xlp4lpnuyc69feh2r3d"
      };
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.feePerByte).toEqual(new FeeNotLoaded());
    });

    test("fees", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "bc1qwqfns0rs5zxrrwf80k4xlp4lpnuyc69feh2r3d",
        amount: BigNumber(100),
        feePerByte: null
      };
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.recipient).toBeUndefined();
      expect(status.errors.feePerByte).toEqual(new FeeNotLoaded());
      t = await bridge.prepareTransaction(account, t);
      expect(t.feePerByte).toBeInstanceOf(BigNumber);
      t.feePerByte = BigNumber(1); // for predictible tests
      status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.feePerByte).toBeUndefined();
      t = {
        ...t,
        feePerByte: BigNumber(0)
      };
      t = await bridge.prepareTransaction(account, t);
      status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.feePerByte).toEqual(new FeeRequired());
    });

    test("Amount to high should have a balanceError", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "1FMpdbiC8dj7kHJ8tPWFcihvAcqEqramoN",
        feePerByte: BigNumber(1),
        amount: BigNumber(979079019)
      };
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.recipient).toBeUndefined();
      let transaction = await bridge.prepareTransaction(account, t);
      status = await bridge.getTransactionStatus(account, transaction);
      expect(status.errors.amount).toEqual(new NotEnoughBalance());
      t = {
        ...t,
        feePerByte: BigNumber(9999999),
        amount: BigNumber(300)
      };
      status = await bridge.getTransactionStatus(account, t); //NB not used?
      transaction = await bridge.prepareTransaction(account, t);
      status = await bridge.getTransactionStatus(account, transaction);
      expect(status.errors.amount).toEqual(new NotEnoughBalance());
    });

    test("Valid amount should Succeed", async () => {
      let t = {
        ...bridge.createTransaction(account),
        recipient: "1FMpdbiC8dj7kHJ8tPWFcihvAcqEqramoN",
        feePerByte: BigNumber(2),
        amount: BigNumber(2489)
      };
      let status = await bridge.getTransactionStatus(account, t);
      expect(status.errors.recipient).toBeUndefined();
      let transaction = await bridge.prepareTransaction(account, t);
      status = await bridge.getTransactionStatus(account, transaction);
      expect(status.errors.amount).toBeUndefined();
    });
  });
};

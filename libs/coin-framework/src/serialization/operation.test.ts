import BigNumber from "bignumber.js";
import Prando from "prando";
import { OperationType } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { genAccount, genOperation } from "../mocks/account";
import { toOperationRaw, fromOperationRaw } from "./operation";

const ethereum = getCryptoCurrencyById("ethereum");
const stellar = getCryptoCurrencyById("stellar");

describe("Operation.ts", () => {
  describe("convert from/to Operation", () => {
    const accountEth = genAccount("myAccount", { currency: ethereum });
    const accountStellar = genAccount("myAccount", { currency: stellar });

    const baseEthOperation = {
      ...genOperation(accountEth, accountEth, accountEth.operations, new Prando("")),
      transactionSequenceNumber: new BigNumber(1),
    };

    const baseStellarOperation = {
      id: "js:2:stellar:GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J:sep5-10ef79fc46d2da31aafe0ea68e7a435b1e274f6a12e88b7533feaacd89fa7c8d-IN",
      hash: "10ef79fc46d2da31aafe0ea68e7a435b1e274f6a12e88b7533feaacd89fa7c8d",
      type: "IN" as OperationType,
      senders: ["GAVITYOI5M6WGPVYP2KNZ44TVXCODDCDZP3S3N6LHOZQXCAA4J4WLMQX"],
      recipients: ["GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J"],
      accountId: "js:2:stellar:GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J:sep5",
      blockHash: "2fa331926c855cc2f8013019d8b1d37c93b585aa1ed871dcf3b3c08380cc240e",
      blockHeight: 59516845,
      extra: { memo: { type: "MEMO_TEXT", value: "Buy XEN Earn Native XLM!" } },
      date: "2025-10-23T17:44:23.000Z",
      value: "1",
      fee: "10000",
      transactionSequenceNumber: 255106510328181600,
      hasFailed: false,
    };

    const commonDate = new Date(1986, 0, 1).toString();

    const createOperation = (overrides: any) => ({
      ...baseEthOperation,
      subOperations: [],
      internalOperations: [],
      nftOperations: [],
      value: "1",
      fee: "1",
      date: commonDate,
      ...overrides,
    });

    it("converts operation → raw (with sequence number)", () => {
      const testAccount = { ...accountEth, operations: [baseEthOperation] };
      const raw = toOperationRaw(testAccount.operations[0]);
      expect(raw.transactionSequenceNumber).toEqual("1");
    });

    it("converts operation → raw (undefined sequence number)", () => {
      const testAccount = {
        ...accountEth,
        operations: [{ ...baseEthOperation, transactionSequenceNumber: undefined }],
      };
      const raw = toOperationRaw(testAccount.operations[0]);
      expect(raw.transactionSequenceNumber).toBeUndefined();
    });

    it("converts raw → operation (valid numeric string)", () => {
      const testAccount = {
        ...accountEth,
        operations: [createOperation({ transactionSequenceNumber: "1" })],
      };
      const op = fromOperationRaw(testAccount.operations[0], testAccount.id);
      expect(op.transactionSequenceNumber).toEqual(new BigNumber(1));
    });

    it("converts raw → operation (NaN sequence string)", () => {
      const testAccount = {
        ...accountEth,
        operations: [createOperation({ transactionSequenceNumber: "undefined" })],
      };
      const op = fromOperationRaw(testAccount.operations[0], testAccount.id);
      expect(op.transactionSequenceNumber).toBeUndefined();
    });

    it("converts raw → operation (undefined sequence number)", () => {
      const testAccount = {
        ...accountEth,
        operations: [createOperation({ transactionSequenceNumber: undefined })],
      };
      // Need to cast as any so we can test undefined which is not in type OperationRaw
      const op = fromOperationRaw(testAccount.operations[0] as any, testAccount.id);
      expect(op.transactionSequenceNumber).toBeUndefined();
    });

    it("converts Stellar raw → operation (numeric sequence number)", () => {
      const testAccount = { ...accountStellar, operations: [baseStellarOperation] };
      // Since we change the type of transactionSequenceNumber from number to string
      // we need to cast as any so we can test number which is not in type OperationRaw
      // in order to test migration of users for LIVE-XXXX, since it started exceeding the MAX_INTEGER_LIMIT
      const op = fromOperationRaw(testAccount.operations[0] as any, testAccount.id);
      expect(op.transactionSequenceNumber).toEqual(new BigNumber(255106510328181600));
    });
  });
});

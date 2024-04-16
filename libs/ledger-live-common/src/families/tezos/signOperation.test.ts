import BigNumber from "bignumber.js";
import { makeAccount } from "./fixtures/makeAccount";
import { getOperationContents } from "./signOperation";
import { Transaction } from "./types";
import { OpKind, TezosToolkit } from "@taquito/taquito";

const tezos = new TezosToolkit("MOCK_API_KEY");

describe("signOperation", () => {
  describe("getOperationContents - revealed account", () => {
    const account = makeAccount("mock-revealed-account", "public_key", "tz1addr", true);

    it("mode - send", async () => {
      const transaction: Transaction = {
        family: "tezos",
        amount: new BigNumber(0),
        recipient: "",
        fees: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        networkInfo: undefined,
        mode: "send",
        gasLimit: new BigNumber(0),
        storageLimit: new BigNumber(0),
        taquitoError: null,
      };

      const { type, contents } = await getOperationContents({
        account,
        transaction,
        tezos,
        counter: 0,
        public_key: "pk",
        public_key_hash: "pkh",
      });

      expect(type).toBe("OUT");
      expect(contents.length).toEqual(1);
      expect(contents).toStrictEqual([
        {
          kind: OpKind.TRANSACTION,
          amount: transaction.amount.toString(),
          destination: transaction.recipient,
          source: "tz1addr",
          counter: "1",
          fee: new BigNumber(0).toString(),
          gas_limit: new BigNumber(0).toString(),
          storage_limit: new BigNumber(0).toString(),
        },
      ]);
    });

    it("mode - delegate", async () => {
      const transaction: Transaction = {
        family: "tezos",
        amount: new BigNumber(0),
        recipient: "",
        fees: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        networkInfo: undefined,
        mode: "delegate",
        gasLimit: new BigNumber(0),
        storageLimit: new BigNumber(0),
        taquitoError: null,
      };

      const { type, contents } = await getOperationContents({
        account,
        transaction,
        tezos,
        counter: 0,
        public_key: "pk",
        public_key_hash: "pkh",
      });

      expect(type).toBe("DELEGATE");
      expect(contents.length).toEqual(1);
      expect(contents).toStrictEqual([
        {
          kind: OpKind.DELEGATION,
          source: "tz1addr",
          counter: "1",
          fee: new BigNumber(0).toString(),
          gas_limit: new BigNumber(0).toString(),
          storage_limit: new BigNumber(0).toString(),
          delegate: "",
        },
      ]);
    });

    it("mode - undelegate", async () => {
      const transaction: Transaction = {
        family: "tezos",
        amount: new BigNumber(0),
        recipient: "",
        fees: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        networkInfo: undefined,
        mode: "undelegate",
        gasLimit: new BigNumber(0),
        storageLimit: new BigNumber(0),
        taquitoError: null,
      };

      const { type, contents } = await getOperationContents({
        account,
        transaction,
        tezos,
        counter: 0,
        public_key: "pk",
        public_key_hash: "pkh",
      });

      expect(type).toBe("UNDELEGATE");
      expect(contents.length).toEqual(1);
      expect(contents).toStrictEqual([
        {
          kind: OpKind.DELEGATION,
          source: "tz1addr",
          counter: "1",
          fee: new BigNumber(0).toString(),
          gas_limit: new BigNumber(0).toString(),
          storage_limit: new BigNumber(0).toString(),
        },
      ]);
    });
  });
});

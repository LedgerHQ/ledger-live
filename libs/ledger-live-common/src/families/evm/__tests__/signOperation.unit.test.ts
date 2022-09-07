import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Transaction as EvmTransaction } from "../types";
import * as Device from "../../../hw/deviceAccess";
import signOperation from "../signOperation";
import { getEstimatedFees } from "../logic";
import { makeAccount } from "../testUtils";
import * as API from "../api/rpc.common";

const currency: CryptoCurrency = {
  ...findCryptoCurrencyById("ethereum")!,
  ethereumLikeInfo: {
    chainId: 1,
    rpc: "my-rpc.com",
  },
};
const account: Account = makeAccount(
  "0x7265a60acAeaf3A5E18E10BC1128e72F27B2e176", // trump.eth
  currency
);
const transaction: EvmTransaction = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
};
const estimatedFees = getEstimatedFees(transaction);

// Mocking here in order to be ack by the signOperation.ts file
jest.mock(
  "@ledgerhq/hw-app-eth",
  () =>
    class {
      signTransaction = () => ({
        r: "123",
        s: "abc",
        v: "27",
      });
    }
);

describe("EVM Family", () => {
  describe("signOperation.ts", () => {
    describe("signOperation", () => {
      beforeAll(() => {
        jest.spyOn(Device, "withDevice").mockImplementation(
          () =>
            (job: any): any =>
              job({})
        );
        jest
          .spyOn(API, "getTransactionCount")
          .mockImplementation(async () => 1);
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      it("should return an optimistic operation and a signed hash based on hardware ECDSA signatures returned by the app bindings", (done) => {
        const signOpObservable = signOperation({
          account,
          transaction,
          deviceId: "",
        });

        signOpObservable.subscribe((obs) => {
          if (obs.type === "signed") {
            const {
              signedOperation: { signature, operation },
            } = obs;

            expect(operation).toEqual({
              id: "js:1:ethereum:0x7265a60acAeaf3A5E18E10BC1128e72F27B2e176:--OUT",
              hash: "",
              type: "OUT",
              value: new BigNumber(100).plus(estimatedFees),
              fee: estimatedFees,
              blockHash: null,
              blockHeight: null,
              senders: [account.freshAddress],
              recipients: [transaction.recipient],
              accountId: account.id,
              transactionSequenceNumber: 0,
              date: expect.any(Date),
              extra: {},
            });
            expect(signature).toBe(
              "0x02e601016464825208946775e49108cb77cda06fc3bef51bcd497602ad886480c080820123820abc"
            );
            done();
          }
        });
      });
    });
  });
});

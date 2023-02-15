import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import signOperation, {
  applyEIP155,
  getSerializedTransaction,
} from "../signOperation";
import { Transaction as EvmTransaction } from "../types";
import * as Device from "../../../hw/deviceAccess";
import { getEstimatedFees } from "../logic";
import { makeAccount } from "../testUtils";
import * as rpcAPI from "../api/rpc.common";

const currency: CryptoCurrency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
    rpc: "my-rpc.com",
  },
};
const account: Account = makeAccount(
  "0x7265a60acAeaf3A5E18E10BC1128e72F27B2e176", // trump.eth
  currency
);

const transactionLegacy: EvmTransaction = {
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
  gasPrice: new BigNumber(100),
  type: 0,
};

const transactionEIP1559: EvmTransaction = {
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
const estimatedFees = getEstimatedFees(transactionEIP1559);

// Mocking here in order to be ack by the signOperation.ts file
jest.mock("@ledgerhq/hw-app-eth", () => ({
  __esModule: true,
  default: class {
    signTransaction = () => ({
      r: "123",
      s: "abc",
      v: "27",
    });
  },
  ledgerService: {
    resolveTransaction: () =>
      Promise.resolve({
        erc20Tokens: [],
        nfts: [],
        externalPlugin: [],
        plugin: [],
      }),
  },
}));

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
          .spyOn(rpcAPI, "getTransactionCount")
          .mockImplementation(async () => 1);
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      it("should return an optimistic operation and a signed hash based on hardware ECDSA signatures returned by the app bindings", (done) => {
        const signOpObservable = signOperation({
          account,
          transaction: transactionEIP1559,
          deviceId: "",
        });

        signOpObservable.subscribe((obs) => {
          if (obs.type === "signed") {
            const {
              signedOperation: { signature, operation },
            } = obs;

            expect(operation).toEqual({
              id: "js:2:ethereum:0x7265a60acAeaf3A5E18E10BC1128e72F27B2e176:--OUT",
              hash: "",
              type: "OUT",
              value: new BigNumber(100).plus(estimatedFees),
              fee: estimatedFees,
              blockHash: null,
              blockHeight: null,
              senders: [account.freshAddress],
              recipients: [transactionEIP1559.recipient],
              accountId: account.id,
              transactionSequenceNumber: 1,
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

    describe("getSerializedTransaction", () => {
      beforeAll(() => {
        jest
          .spyOn(rpcAPI, "getTransactionCount")
          .mockImplementation(() => Promise.resolve(0));
      });

      it("should serialize a type 0 transaction", async () => {
        const serializedTx = await getSerializedTransaction(
          account,
          transactionLegacy
        );

        expect(serializedTx).toBe(
          "0xdf8064825208946775e49108cb77cda06fc3bef51bcd497602ad886480018080"
        );
      });

      it("should serialize a type 2 transaction", async () => {
        const serializedTx = await getSerializedTransaction(
          account,
          transactionEIP1559
        );

        expect(serializedTx).toBe(
          "0x02df01806464825208946775e49108cb77cda06fc3bef51bcd497602ad886480c0"
        );
      });
    });

    describe("applyEIP155", () => {
      const chainIds = [
        1, //ethereum
        5, // goerli
        10, // optimism
        14, // flare
        19, // songbird
        56, // bsc
        137, // polygon
        250, // fantom
        1284, // moonbeam
      ];
      const possibleHexV = [
        "00", // 0 - ethereum + testnets should always retrun 0/1 from hw-app-eth
        "01", // 1
        "1b", // 27 - type 0 transactions from other chains (when chain id > 109) should always return 27/28
        "1c", // 28
      ];

      chainIds.forEach((chainId) => {
        possibleHexV.forEach((v) => {
          it(`should return an EIP155 compatible v for chain id ${chainId} with v = ${parseInt(
            v,
            16
          )}`, () => {
            const eip155Logic = chainId * 2 + 35;
            expect(
              [eip155Logic, eip155Logic + 1] // eip155 + parity
            ).toContain(applyEIP155(v, chainId));
          });
        });

        it("should return the value given by the nano as is if we can't figure out parity from it", () => {
          expect(applyEIP155("1b39", chainId)).toBe(6969);
        });
      });
    });
  });
});

import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Transaction as EvmTransaction } from "../../types";
import { makeAccount } from "../fixtures/common.fixtures";
import { buildSignOperation } from "../../signOperation";
import { DEFAULT_NONCE } from "../../createTransaction";
import * as nodeApi from "../../api/node/rpc.common";
import type { EvmSigner } from "../../types/signer";
import { getEstimatedFees } from "../../logic";
import { getCoinConfig } from "../../config";

jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

const currency: CryptoCurrency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
  },
};
const account: Account = makeAccount(
  "0x7265a60acAeaf3A5E18E10BC1128e72F27B2e176", // trump.eth
  currency,
);

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

const mockSignerContext: SignerContext<EvmSigner> = <T>(
  _: string,
  fn: (signer: EvmSigner) => Promise<T>,
) => {
  return fn({
    setLoadConfig: jest.fn(),
    getAddress: jest.fn(),
    clearSignTransaction: () =>
      Promise.resolve({
        r: "123",
        s: "abc",
        v: "27",
      }),
    signEIP712HashedMessage: jest.fn(),
    signEIP712Message: jest.fn(),
    signPersonalMessage: jest.fn(),
  } as any);
};

describe("EVM Family", () => {
  mockGetConfig.mockImplementation((): any => {
    return {
      info: {
        node: {
          type: "external",
          uri: "my-rpc.com",
        },
      },
    };
  });

  describe("signOperation.ts", () => {
    describe("signOperation", () => {
      beforeAll(() => {
        jest.spyOn(nodeApi, "getTransactionCount").mockImplementation(async () => 1);
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      it("should return an optimistic operation and a signed hash based on hardware ECDSA signatures returned by the app bindings", done => {
        const signOperation = buildSignOperation(mockSignerContext);

        const signOpObservable = signOperation({
          account,
          transaction: { ...transactionEIP1559, nonce: DEFAULT_NONCE },
          deviceId: "",
        });

        signOpObservable.subscribe(obs => {
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
              subOperations: [],
              nftOperations: [],
              extra: {},
              transactionRaw: {
                amount: "100",
                chainId: 1,
                family: "evm",
                feesStrategy: "custom",
                gasLimit: "21000",
                maxFeePerGas: "100",
                maxPriorityFeePerGas: "100",
                mode: "send",
                nonce: 1,
                recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88",
                subAccountId: "id",
                type: 2,
                useAllAmount: false,
              },
            });
            expect(signature).toBe(
              "0x02e601016464825208946775e49108cb77cda06fc3bef51bcd497602ad886480c080820123820abc",
            );
            done();
          }
        });
      });
    });
  });
});

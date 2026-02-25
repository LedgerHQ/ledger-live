import BigNumber from "bignumber.js";
import {
  types as TyphonTypes,
  Transaction as TyphonTransaction,
  address as TyphonAddress,
} from "@stricahq/typhonjs";

import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import { getAccountStakeCredential } from "./logic";
import { CardanoAccount, PaymentCredential, Transaction } from "./types";

jest.mock("./logic");

describe("buildOptimisticOperation", () => {
  const paymentCredKey = "1234";
  const stakeCredKey = "5678";

  const mockedGetAccountStakeCredential = jest.mocked(getAccountStakeCredential);

  let account: CardanoAccount;
  let transaction: Transaction;
  let accountAddress: TyphonAddress.EnterpriseAddress;

  beforeEach(() => {
    account = getCardanoAccountFixture({
      delegation: undefined,
    });
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
    account.cardanoResources.externalCredentials = [{ key: paymentCredKey } as PaymentCredential];
    accountAddress = new TyphonAddress.EnterpriseAddress(TyphonTypes.NetworkId.TESTNET, {
      hash: Buffer.from(paymentCredKey, "hex"),
      type: TyphonTypes.HashType.ADDRESS,
    });

    transaction = {
      family: "cardano",
      recipient: "",
      amount: new BigNumber(0),
      mode: "send",
      poolId: undefined,
      protocolParams: getProtocolParamsFixture(),
    };

    // mock getAccountStakeCredential
    mockedGetAccountStakeCredential.mockReturnValue({
      key: stakeCredKey,
      path: {} as any,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Conway era certificates operation identification", () => {
    const createMockUnsignedTx = (
      overrides?: Partial<{
        inputs: unknown[];
        outputs: unknown[];
        certificates: unknown[];
        withdrawals: unknown[];
        fee: BigNumber;
        txHash: string;
      }>,
    ) => {
      const defaultInputs = [
        {
          address: accountAddress,
          amount: new BigNumber(10e6), // 10 ADA Input
        },
      ];
      const defaultOutputs = [
        {
          address: accountAddress,
          amount: new BigNumber(7e6), // 7 ADA Output
        },
      ];
      const defaultFee = new BigNumber(1e6); // 1 ADA fee

      const tx = {
        getInputs: () => overrides?.inputs ?? defaultInputs,
        getOutputs: () => overrides?.outputs ?? defaultOutputs,
        getCertificates: () => overrides?.certificates ?? [],
        getWithdrawals: () => overrides?.withdrawals ?? [],
        getFee: () => overrides?.fee ?? defaultFee,
        getTransactionHash: () => ({
          toString: (_encoding: string) => overrides?.txHash ?? "txhash123",
        }),
        getAuxiliaryData: () => null,
      } as unknown as TyphonTransaction;

      return tx;
    };

    it("should correctly identify stake registration", () => {
      const mockUnsignedTx = createMockUnsignedTx({
        certificates: [
          {
            type: TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
            cert: {
              stakeCredential: {
                type: TyphonTypes.HashType.ADDRESS,
                hash: {
                  toString: (_encoding: string) => stakeCredKey,
                },
              },
              deposit: new BigNumber(2e6), // 2 ADA deposit
            },
          },
          {
            type: TyphonTypes.CertificateType.STAKE_DELEGATION,
            cert: {
              stakeCredential: {
                type: TyphonTypes.HashType.ADDRESS,
                hash: {
                  toString: (_encoding: string) => stakeCredKey,
                },
              },
              poolKeyHash: "pool1xyz...",
            },
          },
        ],
      });

      const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

      expect(operation).toBeDefined();
      expect(operation.type).toBe("DELEGATE");
      // operation value = 1 ADA fee + 2 ADA deposit = 3 ADA
      expect(operation.value.toString()).toBe((3e6).toString());
      expect(operation.extra.deposit).toMatch(/^2\s*ADA$/);
    });

    it("should correctly identify deregistration with withdrawals", () => {
      /**
       * Mock unsigned transaction with stake key deregistration and withdrawal
       * Transaction has total 13 ADA available to use
       *  (8 ADA input + 2 ADA deregister refund + 3 ADA rewards withdrawal)
       */
      const mockUnsignedTx = createMockUnsignedTx({
        inputs: [
          {
            address: accountAddress,
            amount: new BigNumber(8e6), // 8 ADA Input
          },
        ],
        outputs: [
          {
            address: accountAddress,
            amount: new BigNumber(12e6), // 12 ADA Output
          },
        ],
        certificates: [
          {
            type: TyphonTypes.CertificateType.STAKE_KEY_DE_REGISTRATION,
            cert: {
              stakeCredential: {
                type: TyphonTypes.HashType.ADDRESS,
                hash: {
                  toString: (_encoding: string) => stakeCredKey,
                },
              },
              deposit: new BigNumber(2e6), // 2 ADA refund
            },
          },
        ],
        withdrawals: [
          {
            rewardAccount: {
              stakeCredential: {
                type: TyphonTypes.HashType.ADDRESS,
                hash: {
                  toString: (_encoding: string) => stakeCredKey,
                },
              },
            },
            amount: new BigNumber(3e6), // 3 ADA withdrawal
          },
        ],
        txHash: "txhash456",
      });

      const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

      expect(operation).toBeDefined();
      expect(operation.type).toBe("UNDELEGATE");
      // operation value = 1 ADA fee (do not consider refund and rewards in op value)
      expect(operation.value.toString()).toBe((1e6).toString());
      expect(operation.extra.refund).toMatch(/^2\s*ADA$/);
      expect(operation.extra.rewards).toMatch(/^3\s*ADA$/);
    });

    describe("Vote delegation identification", () => {
      it("should correctly identify abstain vote", () => {
        const mockUnsignedTx = createMockUnsignedTx({
          certificates: [
            {
              type: TyphonTypes.CertificateType.VOTE_DELEGATION,
              cert: {
                stakeCredential: {
                  type: TyphonTypes.HashType.ADDRESS,
                  hash: {
                    toString: (_encoding: string) => stakeCredKey,
                  },
                },
                dRep: {
                  type: TyphonTypes.DRepType.ABSTAIN,
                },
              },
            },
          ],
        });

        const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

        expect(operation).toBeDefined();
        expect(operation.type).toBe("VOTE");
        expect(operation.extra.vote).toBe("ABSTAIN");
      });

      it("should correctly identify no confidence vote", () => {
        const mockUnsignedTx = createMockUnsignedTx({
          certificates: [
            {
              type: TyphonTypes.CertificateType.VOTE_DELEGATION,
              cert: {
                stakeCredential: {
                  type: TyphonTypes.HashType.ADDRESS,
                  hash: {
                    toString: (_encoding: string) => stakeCredKey,
                  },
                },
                dRep: {
                  type: TyphonTypes.DRepType.NO_CONFIDENCE,
                },
              },
            },
          ],
        });

        const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

        expect(operation).toBeDefined();
        expect(operation.type).toBe("VOTE");
        expect(operation.extra.vote).toBe("NO CONFIDENCE");
      });

      it("should correctly identify dRep vote", () => {
        const mockUnsignedTx = createMockUnsignedTx({
          certificates: [
            {
              type: TyphonTypes.CertificateType.VOTE_DELEGATION,
              cert: {
                stakeCredential: {
                  type: TyphonTypes.HashType.ADDRESS,
                  hash: {
                    toString: (_encoding: string) => stakeCredKey,
                  },
                },
                dRep: {
                  type: TyphonTypes.DRepType.ADDRESS,
                  key: {
                    toString: (_encoding: string) => "testDRep",
                  },
                },
              },
            },
          ],
        });

        const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

        expect(operation).toBeDefined();
        expect(operation.type).toBe("VOTE");
        expect(operation.extra.vote).toBe("testDRep");
      });
    });
  });
});

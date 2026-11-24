import {
  types as TyphonTypes,
  Transaction as TyphonTransaction,
  address as TyphonAddress,
} from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";

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
    it("should correctly identify stake registration", () => {
      const mockUnsignedTx = {
        getInputs: () => [
          {
            address: accountAddress,
            amount: new BigNumber(10e6), // 10 ADA Input
          },
        ],
        getOutputs: () => [
          {
            address: accountAddress,
            amount: new BigNumber(7e6), // 7 ADA Output
          },
        ],
        getCertificates: () => [
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
        getWithdrawals: () => [],
        getFee: () => new BigNumber(1e6), // 1 ADA fee
        getTransactionHash: () => ({
          toString: (_encoding: string) => "txhash123",
        }),
        getAuxiliaryData: () => null,
      } as unknown as TyphonTransaction;

      const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

      expect(operation).toMatchObject({
        type: "DELEGATE",
        value: new BigNumber(3e6),
        extra: {
          deposit: expect.stringMatching(/^2\s*ADA$/),
        },
      });
    });

    it("should report a vote delegation as fee plus stake-key deposit", () => {
      const mockUnsignedTx = {
        getInputs: () => [{ address: accountAddress, amount: new BigNumber(10e6) }],
        getOutputs: () => [{ address: accountAddress, amount: new BigNumber(7e6) }],
        getCertificates: () => [
          {
            type: TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
            cert: {
              stakeCredential: {
                type: TyphonTypes.HashType.ADDRESS,
                hash: { toString: () => stakeCredKey },
              },
              deposit: new BigNumber(1e6),
            },
          },
          {
            type: TyphonTypes.CertificateType.VOTE_DELEGATION,
            cert: {},
          },
        ],
        getWithdrawals: () => [],
        getFee: () => new BigNumber(1e6),
        getTransactionHash: () => ({ toString: () => "vote-tx" }),
        getAuxiliaryData: () => null,
      } as unknown as TyphonTransaction;

      const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

      expect(operation).toMatchObject({
        type: "VOTE_DELEGATION",
        value: new BigNumber(3e6),
        fee: new BigNumber(1e6),
        extra: { deposit: expect.stringMatching(/^1\s*ADA$/) },
      });
    });

    it("preserves delegate classification when the transaction includes an abstain certificate", () => {
      const mockUnsignedTx = {
        getInputs: () => [{ address: accountAddress, amount: new BigNumber(10e6) }],
        getOutputs: () => [{ address: accountAddress, amount: new BigNumber(9e6) }],
        getCertificates: () => [
          {
            type: TyphonTypes.CertificateType.STAKE_DELEGATION,
            cert: { stakeCredential: {}, poolKeyHash: "pool1xyz" },
          },
          { type: TyphonTypes.CertificateType.VOTE_DELEGATION, cert: {} },
        ],
        getWithdrawals: () => [],
        getFee: () => new BigNumber(1e6),
        getTransactionHash: () => ({ toString: () => "delegate-tx" }),
        getAuxiliaryData: () => null,
      } as unknown as TyphonTransaction;

      expect(buildOptimisticOperation(account, mockUnsignedTx, transaction).type).toBe("DELEGATE");
    });

    it("should correctly identify deregistration with withdrawals", () => {
      const mockUnsignedTx = {
        getInputs: () => [
          {
            address: accountAddress,
            amount: new BigNumber(8e6), // 8 ADA Input
          },
        ],
        getOutputs: () => [
          {
            address: accountAddress,
            amount: new BigNumber(12e6), // 12 ADA Output
          },
        ],
        getCertificates: () => [
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
        getWithdrawals: () => [
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
        getFee: () => new BigNumber(1e6), // 1 ADA fee
        getTransactionHash: () => ({
          toString: (_encoding: string) => "txhash456",
        }),
        getAuxiliaryData: () => null,
      } as unknown as TyphonTransaction;

      const operation = buildOptimisticOperation(account, mockUnsignedTx, transaction);

      expect(operation).toMatchObject({
        type: "UNDELEGATE",
        value: new BigNumber(1e6),
        extra: {
          refund: expect.stringMatching(/^2\s*ADA$/),
          rewards: expect.stringMatching(/^3\s*ADA$/),
        },
      });
    });
  });
});

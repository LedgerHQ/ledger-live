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

      expect(operation).toBeDefined();
      expect(operation.type).toBe("DELEGATE");
      expect(operation.value.toString()).toBe((3e6).toString()); // fee + deposit spent
      expect(operation.extra.deposit).toMatch(/^2\s*ADA$/);
    });

    it("should correctly identify deregistration with withdrawals", () => {
      /**
       * Mock unsigned transaction with stake key deregistration and withdrawal
       * Transaction has total 13 ADA available to use
       *  (8 ADA input + 2 ADA deregister refund + 3 ADA rewards withdrawal)
       */
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

      expect(operation).toBeDefined();
      expect(operation.type).toBe("UNDELEGATE");
      expect(operation.value.toString()).toBe((1e6).toString()); // only fee is spent
      expect(operation.extra.refund).toMatch(/^2\s*ADA$/);
      expect(operation.extra.rewards).toMatch(/^3\s*ADA$/);
    });
  });
});

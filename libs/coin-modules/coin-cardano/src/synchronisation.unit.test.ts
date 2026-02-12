import BigNumber from "bignumber.js";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AccountShapeInfo, GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { address as TyphonAddress, types as TyphonTypes } from "@stricahq/typhonjs";

import { BipPath, CardanoAccount, CardanoDelegation, PaymentCredential } from "./types";
import { getDelegationInfo } from "./api/getDelegationInfo";
import { makeGetAccountShape, mapTxToAccountOperation } from "./synchronisation";
import { getTransactions } from "./api/getTransactions";
import { buildSubAccounts } from "./buildSubAccounts";
import { fetchNetworkInfo } from "./api/getNetworkInfo";
import { APINetworkInfo, APITransaction } from "./api/api-types";
import { CardanoSigner } from "./signer";

jest.mock("./buildSubAccounts");
jest.mock("./api/getTransactions");
jest.mock("./api/getNetworkInfo");
jest.mock("./api/getDelegationInfo");

describe("makeGetAccountShape", () => {
  let signerContext: SignerContext<CardanoSigner>;
  let shape: GetAccountShape<CardanoAccount>;
  let accountShapeInfo: AccountShapeInfo<CardanoAccount>;
  let getTransactionsMock: jest.MaybeMockedDeep<typeof getTransactions>;
  let getDelegationInfoMock: jest.MaybeMockedDeep<typeof getDelegationInfo>;

  beforeEach(() => {
    const pubKeyMock = {
      chainCodeHex: "chainCodeHex",
      publicKeyHex: "publicKeyHex",
    };
    const fakeSigner: CardanoSigner = {
      getAddress: jest.fn(),
      sign: jest.fn(),
      getPublicKey: jest.fn().mockResolvedValue(pubKeyMock),
    };
    signerContext = <T>(_: string, fn: (signer: CardanoSigner) => Promise<T>) => fn(fakeSigner);
    shape = makeGetAccountShape(signerContext);
    accountShapeInfo = {
      currency: { id: "cardano" } as any,
      address: "add",
      index: 0,
      initialAccount: {
        cardanoResources: {
          utxos: [],
        },
      } as unknown as CardanoAccount,
      derivationPath: "",
      derivationMode: "cardano",
      deviceId: "id",
    };
    const buildSubAccountsMock = jest.mocked(buildSubAccounts);
    buildSubAccountsMock.mockResolvedValue([]);
    getTransactionsMock = jest.mocked(getTransactions);
    getDelegationInfoMock = jest.mocked(getDelegationInfo);
    const getNetworkInfoMock = jest.mocked(fetchNetworkInfo);
    getNetworkInfoMock.mockResolvedValue({
      protocolParams: { lovelacePerUtxoWord: "1" },
    } as APINetworkInfo);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("balance", () => {
    beforeAll(() => {
      setupMockCryptoAssetsStore({
        getTokensSyncHash: jest.fn().mockResolvedValue("some_random_hash"),
      });
    });
    it("should return 0 balance when there is no utxos", async () => {
      getTransactionsMock.mockResolvedValue({
        transactions: [],
        externalCredentials: [{ path: { index: 0 } as BipPath, isUsed: false, key: "" }],
        internalCredentials: [],
        blockHeight: 0,
      });
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.balance).toEqual(new BigNumber(0));
    });

    it("should return the sum of utxos with delegation reward value", async () => {
      getTransactionsMock.mockResolvedValue({
        transactions: [],
        externalCredentials: [{ path: { index: 0 } as BipPath, isUsed: false, key: "" }],
        internalCredentials: [
          {
            isUsed: true,
            key: "cred",
          } as PaymentCredential,
        ],
        blockHeight: 0,
      });
      getDelegationInfoMock.mockResolvedValue({ rewards: new BigNumber(42) } as CardanoDelegation);
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.balance).toEqual(new BigNumber(42));
    });
  });

  describe("spendableBalance", () => {
    it("should return 0 spendable balance when there is no utxos", async () => {
      getTransactionsMock.mockResolvedValue({
        transactions: [],
        externalCredentials: [
          { path: { index: 0 } as BipPath, networkId: "id", isUsed: false, key: "" },
        ],
        internalCredentials: [],
      } as any);
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.spendableBalance).toEqual(new BigNumber(0));
    });

    it("should return spendable balance with rewards when delegated to dRep", async () => {
      getTransactionsMock.mockResolvedValue({
        transactions: [
          {
            hash: "tx1",
            fees: "0",
            timestamp: new Date(),
            blockHeight: 1,
            inputs: [],
            outputs: [
              {
                address: "addr",
                value: new BigNumber(5), // 5 lovelace
                tokens: [],
                paymentKey: "key", // match with external credential key
              },
            ],
            certificate: {
              stakeRegistrations: [],
              stakeDeRegistrations: [],
              stakeDelegations: [],
            },
          },
        ],
        externalCredentials: [
          { path: { index: 0 } as BipPath, networkId: "id", isUsed: false, key: "key" },
        ],
        internalCredentials: [],
      } as any);
      getDelegationInfoMock.mockResolvedValue({
        rewards: new BigNumber(10), // 10 lovelace
        dRepHex: "dRepHex", // delegated to dRep
      } as CardanoDelegation);
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      // spendable balance = 5 (utxo) + 10 (rewards) = 15 lovelace
      expect(result.spendableBalance).toEqual(new BigNumber(15));
    });

    it("should return spendable balance without rewards when not delegated to dRep", async () => {
      getTransactionsMock.mockResolvedValue({
        transactions: [
          {
            hash: "tx1",
            fees: "0",
            timestamp: new Date(),
            blockHeight: 1,
            inputs: [],
            outputs: [
              {
                address: "addr",
                value: new BigNumber(5), // 5 lovelace
                tokens: [],
                paymentKey: "key", // match with external credential key
              },
            ],
            certificate: {
              stakeRegistrations: [],
              stakeDeRegistrations: [],
              stakeDelegations: [],
            },
          },
        ],
        externalCredentials: [
          { path: { index: 0 } as BipPath, networkId: "id", isUsed: false, key: "key" },
        ],
        internalCredentials: [],
      } as any);
      getDelegationInfoMock.mockResolvedValue({
        rewards: new BigNumber(10), // 10 lovelace
        dRepHex: undefined, // not delegated to dRep
      } as CardanoDelegation);
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      // spendable balance = 5 (utxo), rewards should be excluded
      expect(result.spendableBalance).toEqual(new BigNumber(5));
    });
  });

  describe("delegation", () => {
    it("should check dRepHex and rewards are available", async () => {
      getTransactionsMock.mockResolvedValue({
        blockHeight: 0,
        transactions: [],
        externalCredentials: [{ isUsed: false, key: "0", path: {} } as PaymentCredential],
        internalCredentials: [],
      });
      getDelegationInfoMock.mockResolvedValue({
        rewards: new BigNumber(10),
        dRepHex: "dRepHex",
      } as CardanoDelegation);
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.cardanoResources?.delegation?.dRepHex).toEqual("dRepHex");
      expect(result.cardanoResources?.delegation?.rewards).toEqual(new BigNumber(10));
    });
  });
});

describe("mapTxToAccountOperation", () => {
  const paymentCredKey = "1234";
  const stakeCredKey = "5678";
  const stakeAddress = new TyphonAddress.RewardAddress(TyphonTypes.NetworkId.TESTNET, {
    type: TyphonTypes.HashType.ADDRESS,
    hash: Buffer.from(stakeCredKey, "hex"),
  });
  const stakeCredHex = stakeAddress.getHex();

  let accountShapeInfo: AccountShapeInfo<CardanoAccount>;
  let accountAddress: TyphonAddress.EnterpriseAddress;
  let accountCredentialMap: Record<string, PaymentCredential>;

  beforeEach(() => {
    accountCredentialMap = {
      [paymentCredKey]: { key: paymentCredKey } as PaymentCredential,
    };
    accountAddress = new TyphonAddress.EnterpriseAddress(TyphonTypes.NetworkId.TESTNET, {
      hash: Buffer.from(paymentCredKey, "hex"),
      type: TyphonTypes.HashType.ADDRESS,
    });
    accountShapeInfo = {
      currency: {
        id: "cardano_testnet",
        units: [{ name: "Cardano", code: "ADA", magnitude: 6 }],
      } as any,
      address: "address",
      index: 0,
      initialAccount: {} as any,
      derivationPath: "",
      derivationMode: "cardano",
      deviceId: "id",
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Conway era certificates operation identification", () => {
    it("should correctly map stake registration transaction", async () => {
      const mockTxResult: APITransaction = {
        fees: (1e6).toString(), // 1 ADA
        hash: "txHash",
        inputs: [
          {
            index: 1,
            txId: "txId1",
            address: accountAddress.getHex(),
            value: (10e6).toString(), // 10 ADA
            tokens: [],
            paymentKey: paymentCredKey,
          },
        ],
        outputs: [
          {
            address: accountAddress.getHex(),
            value: (7e6).toString(), // 7 ADA
            tokens: [],
            paymentKey: paymentCredKey,
          },
        ],
        timestamp: "2024-01-01T00:00:00.000Z",
        blockHeight: 0,
        certificate: {
          stakeRegistrations: [],
          stakeRegsConway: [
            {
              deposit: (2e6).toString(), // 2 ADA,
              index: 0,
              stakeHex: stakeCredHex,
            },
          ],
          stakeDeRegistrations: [],
          stakeDelegations: [
            {
              index: 0,
              poolKeyHash: "pool",
              stakeCredential: {
                key: stakeCredKey,
                type: 0,
              },
            },
          ],
        },
        withdrawals: [],
      };

      const op = mapTxToAccountOperation(
        mockTxResult,
        "accountId",
        accountCredentialMap,
        { key: stakeCredKey } as any,
        [],
        accountShapeInfo,
        { stakeKeyDeposit: "1" } as any,
      );

      expect(op).toBeDefined();
      expect(op.type).toBe("DELEGATE");
      expect(op.value.toString()).toBe((3e6).toString()); // fee + deposit spent
      expect(op.extra.deposit).toMatch(/^2\s*ADA$/);
    });

    it("should correctly map the deregistration with withdrawal transaction", async () => {
      const mockTxResult: APITransaction = {
        fees: (1e6).toString(), // 1 ADA
        hash: "txHash",
        inputs: [
          {
            index: 1,
            txId: "txId1",
            address: accountAddress.getHex(),
            value: (1e6).toString(), // 1 ADA
            tokens: [],
            paymentKey: paymentCredKey,
          },
        ],
        outputs: [
          {
            address: accountAddress.getHex(),
            value: (12e6).toString(), // 12 ADA
            tokens: [],
            paymentKey: paymentCredKey,
          },
        ],
        timestamp: "2024-01-01T00:00:00.000Z",
        blockHeight: 0,
        certificate: {
          stakeDeRegsConway: [
            {
              deposit: (2e6).toString(), // 2 ADA,
              index: 0,
              stakeHex: stakeCredHex,
            },
          ],
          stakeRegistrations: [],
          stakeDeRegistrations: [],
          stakeDelegations: [],
        },
        withdrawals: [
          {
            stakeCredential: {
              key: stakeCredKey,
              type: 0,
            },
            amount: (10e6).toString(), // 10 ADA
            stakeHex: stakeCredHex,
          },
        ],
      };

      const op = mapTxToAccountOperation(
        mockTxResult,
        "accountId",
        accountCredentialMap,
        { key: stakeCredKey } as any,
        [],
        accountShapeInfo,
        { stakeKeyDeposit: "1" } as any,
      );

      expect(op).toBeDefined();
      expect(op.type).toBe("UNDELEGATE");
      expect(op.value.toString()).toBe((1e6).toString()); // only fee is spent
      expect(op.extra.refund).toMatch(/^2\s*ADA$/);
      expect(op.extra.rewards).toMatch(/^10\s*ADA$/);
    });
  });
});

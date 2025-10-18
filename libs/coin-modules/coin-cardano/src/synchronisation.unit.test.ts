import BigNumber from "bignumber.js";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AccountShapeInfo, GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { BipPath, CardanoAccount, CardanoDelegation, PaymentCredential } from "./types";
import { getDelegationInfo } from "./api/getDelegationInfo";
import { makeGetAccountShape } from "./synchronisation";
import { getTransactions } from "./api/getTransactions";
import { buildSubAccounts } from "./buildSubAccounts";
import { fetchNetworkInfo } from "./api/getNetworkInfo";
import { APINetworkInfo } from "./api/api-types";
import { CardanoSigner } from "./signer";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

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
    getNetworkInfoMock.mockReturnValue(
      Promise.resolve({ protocolParams: { lovelacePerUtxoWord: "1" } } as APINetworkInfo),
    );
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
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
          transactions: [],
          externalCredentials: [
            { path: { index: 0 } as BipPath, networkId: "id", isUsed: false, key: "" },
          ],
          internalCredentials: [],
          blockHeight: 0,
        }),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.balance).toEqual(new BigNumber(0));
    });

    it("should return the sum of utxos with delegation reward value", async () => {
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
          transactions: [],
          externalCredentials: [
            { path: { index: 0 } as BipPath, networkId: "id", isUsed: false, key: "" },
          ],
          internalCredentials: [
            {
              isUsed: true,
              key: "cred",
            } as PaymentCredential,
          ],
          blockHeight: 0,
        }),
      );
      getDelegationInfoMock.mockReturnValue(
        Promise.resolve({ rewards: new BigNumber(42) } as CardanoDelegation),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.balance).toEqual(new BigNumber(42));
    });
  });

  describe("spendableBalance", () => {
    it("should return 0 spendable balance when there is no utxos", async () => {
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
          transactions: [],
          externalCredentials: [
            { path: { index: 0 } as BipPath, networkId: "id", isUsed: false, key: "" },
          ],
          internalCredentials: [],
        } as any),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.spendableBalance).toEqual(new BigNumber(0));
    });

    it("should return spendable balance with rewards when delegated to dRep", async () => {
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
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
        } as any),
      );
      getDelegationInfoMock.mockReturnValue(
        Promise.resolve({
          rewards: new BigNumber(10), // 10 lovelace
          dRepHex: "dRepHex", // delegated to dRep
        } as CardanoDelegation),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      // spendable balance = 5 (utxo) + 10 (rewards) = 15 lovelace
      expect(result.spendableBalance).toEqual(new BigNumber(15));
    });

    it("should return spendable balance without rewards when not delegated to dRep", async () => {
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
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
        } as any),
      );
      getDelegationInfoMock.mockReturnValue(
        Promise.resolve({
          rewards: new BigNumber(10), // 10 lovelace
          dRepHex: undefined, // not delegated to dRep
        } as CardanoDelegation),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      // spendable balance = 5 (utxo), rewards should be excluded
      expect(result.spendableBalance).toEqual(new BigNumber(5));
    });
  });

  describe("delegation", () => {
    it("should check dRepHex and rewards are available", async () => {
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
          blockHeight: 0,
          transactions: [],
          externalCredentials: [{ isUsed: false, key: "0", path: {} } as PaymentCredential],
          internalCredentials: [],
        }),
      );
      getDelegationInfoMock.mockReturnValue(
        Promise.resolve({
          rewards: new BigNumber(10),
          dRepHex: "dRepHex",
        } as CardanoDelegation),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.cardanoResources?.delegation?.dRepHex).toEqual("dRepHex");
      expect(result.cardanoResources?.delegation?.rewards).toEqual(new BigNumber(10));
    });
  });
});

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

jest.mock("./buildSubAccounts");
jest.mock("./api/getTransactions");
jest.mock("./api/getNetworkInfo");
jest.mock("./api/getDelegationInfo");

describe("makeGetAccountShape", () => {
  let signerContext: SignerContext<CardanoSigner>;
  let shape: GetAccountShape<CardanoAccount>;
  let accountShapeInfo: AccountShapeInfo<CardanoAccount>;
  let getTransactionsMock: jest.MaybeMockedDeep<typeof getTransactions>;

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
          utxos: [
            {
              hash: "hash",
              index: 0,
              address: "addr",
              amount: new BigNumber(1),
              tokens: [],
              paymentCredential: {
                key: "key",
                path: {
                  purpose: 1852,
                  coin: 1815,
                  account: 0,
                  chain: 0,
                  index: 0,
                },
              },
            },
          ],
        },
      } as unknown as CardanoAccount,
      derivationPath: "",
      derivationMode: "cardano",
      deviceId: "id",
    };
    const buildSubAccountsMock = jest.mocked(buildSubAccounts);
    buildSubAccountsMock.mockReturnValue([]);
    getTransactionsMock = jest.mocked(getTransactions);
    const getNetworkInfoMock = jest.mocked(fetchNetworkInfo);
    getNetworkInfoMock.mockReturnValue(
      Promise.resolve({ protocolParams: { lovelacePerUtxoWord: "1" } } as APINetworkInfo),
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("balance", () => {
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
      const getDelegationInfoMock = jest.mocked(getDelegationInfo);
      getDelegationInfoMock.mockReturnValue(
        Promise.resolve({ rewards: new BigNumber(42) } as CardanoDelegation),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.balance).toEqual(new BigNumber(42));
    });
  });

  describe("spendableBalance", () => {
    it("should return 0 spendable balance when there is no utxos", async () => {
      const getTransactionsMock = jest.mocked(getTransactions);
      getTransactionsMock.mockReturnValue(
        Promise.resolve({
          transactions: [],
          externalCredentials: [
            {
              isUsed: false,
              key: "00000000000000000000000000000000000000000000000000000000",
              path: {
                purpose: 1852,
                coin: 1815,
                account: 0,
                chain: 0,
                index: 0,
              },
            },
          ],
          internalCredentials: [],
        } as any),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.spendableBalance).toEqual(new BigNumber(0));
    });

    // it("should return the sum of utxos minus ada minimum for tokens", async () => {});
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
      const getDelegationInfoMock = jest.mocked(getDelegationInfo);
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

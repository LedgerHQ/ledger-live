import BigNumber from "bignumber.js";
import { AccountShapeInfo, GetAccountShape } from "../../bridge/jsHelpers";
import { APINetworkInfo } from "./api/api-types";
import { getDelegationInfo } from "./api/getDelegationInfo";
import { getNetworkInfo } from "./api/getNetworkInfo";
import { getTransactions } from "./api/getTransactions";
import { buildSubAccounts } from "./buildSubAccounts";
import { makeGetAccountShape, SignerContext } from "./js-synchronisation";
import { BipPath, CardanoAccount, CardanoDelegation } from "./types";
jest.mock("./buildSubAccounts");
jest.mock("./api/getTransactions");
jest.mock("./api/getNetworkInfo");
jest.mock("./api/getDelegationInfo");

describe("makeGetAccountShape", () => {
  let signerContext: SignerContext;
  let shape: GetAccountShape;
  let accountShapeInfo: AccountShapeInfo;
  let getTransactionsMock;

  beforeEach(() => {
    const pubKeyMock = {
      extendedPubKeyHex: "extendedPubKeyHex",
      chainCodeHex: "chainCodeHex",
      publicKeyHex: "publicKeyHex",
    };
    signerContext = () => Promise.resolve(pubKeyMock);
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
    const getNetworkInfoMock = jest.mocked(getNetworkInfo);
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
          internalCredentials: ["cred"],
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
          externalCredentials: [{ path: "p", networkId: "id" }],
          internalCredentials: [],
        } as any),
      );
      const result = await shape(accountShapeInfo, { paginationConfig: {} });
      expect(result.spendableBalance).toEqual(new BigNumber(0));
    });

    // it("should return the sum of utxos minus ada minimum for tokens", async () => {});
  });
});

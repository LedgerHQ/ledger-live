import { createApi } from "../../api";
import type { AptosConfig } from "../../config";
import { APTOS_ASSET_ID, TOKEN_TYPE } from "../../constants";
import { AptosAPI } from "../../network";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptosApi: jest.Mocked<any>;
jest.mock("../../network");
jest.mock("../../config", () => ({
  setCoinConfig: jest.fn(),
}));

const mockAptosConfig: AptosConfig = {} as AptosConfig;

describe("getBalance", () => {
  beforeEach(() => {
    mockedAptosApi = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return balance with value 10", async () => {
    mockedAptosApi.mockImplementation(() => ({
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: APTOS_ASSET_ID, amount: 10n }]),
    }));

    const api = createApi(mockAptosConfig);
    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    expect(await api.getBalance(accountAddress)).toStrictEqual([
      { value: 10n, asset: { type: "native" } },
    ]);
  });

  it("should return empty array when no contract_address and no data", async () => {
    mockedAptosApi.mockImplementation(() => ({
      getBalances: jest.fn().mockResolvedValue([]),
    }));

    const accountAddress = "0xno_contract_and_no_data";

    const api = createApi(mockAptosConfig);
    expect(await api.getBalance(accountAddress)).toStrictEqual([
      {
        asset: {
          type: "native",
        },
        value: 0n,
      },
    ]);
  });

  it("should return balance with 'native' contract_address (APTOS_ASSET_ID)", async () => {
    mockedAptosApi.mockImplementation(() => ({
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: APTOS_ASSET_ID, amount: 15n }]),
    }));

    const api = createApi(mockAptosConfig);
    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    expect(await api.getBalance(accountAddress)).toStrictEqual([
      { value: 15n, asset: { type: "native" } },
    ]);
  });

  it("should return token balance when contract_address is a coin token", async () => {
    const TOKEN_ASSET_ID = "0x1::my_token::Token";
    mockedAptosApi.mockImplementation(() => ({
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: TOKEN_ASSET_ID, amount: 25n }]),
    }));

    const api = createApi(mockAptosConfig);
    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    expect(await api.getBalance(accountAddress)).toStrictEqual([
      {
        value: 25n,
        asset: { type: TOKEN_TYPE.COIN, assetReference: TOKEN_ASSET_ID },
      },
    ]);
  });

  it("should return token balance when contract_address is a fungible_asset token", async () => {
    const TOKEN_ASSET_ID = "0x1";
    mockedAptosApi.mockImplementation(() => ({
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: TOKEN_ASSET_ID, amount: 25n }]),
    }));

    const api = createApi(mockAptosConfig);
    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    expect(await api.getBalance(accountAddress)).toStrictEqual([
      {
        value: 25n,
        asset: {
          type: TOKEN_TYPE.FUNGIBLE_ASSET,
          assetReference: TOKEN_ASSET_ID,
        },
      },
    ]);
  });
});

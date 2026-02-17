import { APTOS_ASSET_ID, TOKEN_TYPE } from "../../constants";
import { getBalances } from "../../logic/getBalances";
import type { AptosAPI } from "../../network";

describe("getBalance", () => {
  it("should return balance with value 10", async () => {
    const mockAptosClient = {
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: APTOS_ASSET_ID, amount: 10n }]),
    } as Partial<AptosAPI> as AptosAPI;

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    const balances = await getBalances(mockAptosClient, accountAddress);

    expect(balances).toStrictEqual([{ value: 10n, asset: { type: "native" } }]);
  });

  it("should return 0 balance when no contract_address and no data", async () => {
    const mockAptosClient = {
      getBalances: jest.fn().mockResolvedValue([]),
    } as Partial<AptosAPI> as AptosAPI;

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    const balances = await getBalances(mockAptosClient, accountAddress);
    expect(balances).toStrictEqual([{ value: 0n, asset: { type: "native" } }]);
  });

  it("should return balance with 'native' contract_address (APTOS_ASSET_ID)", async () => {
    const mockAptosClient = {
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: APTOS_ASSET_ID, amount: 10n }]),
    } as Partial<AptosAPI> as AptosAPI;

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    const balances = await getBalances(mockAptosClient, accountAddress);

    expect(balances).toStrictEqual([{ value: 10n, asset: { type: "native" } }]);
  });

  it("should return token balance when contract_address is a coin token", async () => {
    const TOKEN_ASSET_ID = "0x1::my_token::Token";
    const mockAptosClient = {
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: TOKEN_ASSET_ID, amount: 25n }]),
    } as Partial<AptosAPI> as AptosAPI;

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    const balances = await getBalances(mockAptosClient, accountAddress);

    expect(balances).toStrictEqual([
      {
        value: 25n,
        asset: { type: TOKEN_TYPE.COIN, assetReference: TOKEN_ASSET_ID },
      },
    ]);
  });

  it("should return token balance when contract_address is a fungible_asset token", async () => {
    const TOKEN_ASSET_ID = "0x1";
    const mockAptosClient = {
      getBalances: jest.fn().mockResolvedValue([{ contractAddress: TOKEN_ASSET_ID, amount: 25n }]),
    } as Partial<AptosAPI> as AptosAPI;

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";

    const balances = await getBalances(mockAptosClient, accountAddress);

    expect(balances).toStrictEqual([
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

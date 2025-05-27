import { AptosAPI } from "../../network";
import { getBalances } from "../../logic/getBalance";
import { APTOS_ASSET_ID } from "../../constants";
import BigNumber from "bignumber.js";

jest.mock("../../network", () => {
  return {
    AptosAPI: jest.fn().mockImplementation(() => ({
      getBalances: jest.fn(),
    })),
  };
});

describe("getBalance", () => {
  let mockGetBalances: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ asset_type: APTOS_ASSET_ID, amount: BigNumber(10) }]);

    (AptosAPI as jest.Mock).mockImplementation(() => ({
      getBalances: mockGetBalances,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should returns balance with value 10", async () => {
    mockGetBalances.mockResolvedValue([{ asset_type: APTOS_ASSET_ID, amount: new BigNumber(10) }]);

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";
    const client = new AptosAPI("aptos");
    const balance = await getBalances(client, accountAddress);

    expect(balance).toBeDefined();
    expect(balance).toMatchObject([{ value: BigInt(10), asset: { type: "native" } }]);
    expect(mockGetBalances).toHaveBeenCalledWith(accountAddress, undefined);
  });

  it("should return empty array when no contract_address and no data", async () => {
    mockGetBalances.mockResolvedValue([]);

    const accountAddress = "0xno_contract_and_no_data";
    const client = new AptosAPI("aptos");
    const balance = await getBalances(client, accountAddress);

    expect(balance).toEqual([]);
    //expect(mockGetBalances).toHaveBeenCalledWith(accountAddress);
  });

  it("should return balance with 'native' contract_address (APTOS_ASSET_ID)", async () => {
    mockGetBalances.mockResolvedValue([{ asset_type: APTOS_ASSET_ID, amount: new BigNumber(15) }]);

    const accountAddress = "0xcontract_present";
    const contractAddress = APTOS_ASSET_ID;
    const client = new AptosAPI("aptos");
    const balance = await getBalances(client, accountAddress, contractAddress);

    expect(balance).toBeDefined();
    expect(balance).toMatchObject([{ value: BigInt(15), asset: { type: "native" } }]);
    expect(mockGetBalances).toHaveBeenCalledWith(accountAddress, contractAddress);
  });

  it("should return token balance when contract_address is a token", async () => {
    const TOKEN_ASSET_ID = "0x1::my_token::Token";
    mockGetBalances.mockResolvedValue([{ asset_type: TOKEN_ASSET_ID, amount: new BigNumber(25) }]);

    const accountAddress = "0xtoken_holder";
    const contractAddress = TOKEN_ASSET_ID;
    const client = new AptosAPI("aptos");

    const balance = await getBalances(client, accountAddress, contractAddress);

    expect(balance).toBeDefined();
    expect(balance).toMatchObject([
      { value: BigInt(25), asset: { type: "token", asset_type: TOKEN_ASSET_ID } },
    ]);
    expect(mockGetBalances).toHaveBeenCalledWith(accountAddress, contractAddress);
  });
});

import type { SwapOperation, TokenAccount, Account } from "@ledgerhq/types-live";

export const mockTokenEvmLogic = jest.fn();
jest.mock("@ledgerhq/coin-evm/logic/index", () => {
  return {
    getTokenFromAsset: () => mockTokenEvmLogic(),
  };
});

export const mockCoinConfig = jest.fn();
jest.mock("@ledgerhq/coin-evm/config", () => {
  return {
    getCoinConfig: () => mockCoinConfig(),
  };
});

mockCoinConfig.mockResolvedValue({
  info: {
    status: { type: "active" },
    node: { type: "external", uri: "https://celo.coin.ledger.com/archive" },
    explorer: { type: "blockscout", uri: "https://celo.blockscout.com/api" },
  },
});

const getSyncHash = jest.fn();
const createSwapHistoryMap = jest.fn();
jest.mock("@ledgerhq/coin-evm/logic", () => {
  return {
    createSwapHistoryMap: () => createSwapHistoryMap(),
    mergeSubAccounts: (...args: [Account | undefined, Partial<TokenAccount>[]]) => {
      return args.at(1);
    },
    getSyncHash: () => getSyncHash(),
  };
});

getSyncHash.mockReturnValue("0x0000000000000000000000000000000000001d00");
createSwapHistoryMap.mockReturnValue(new Map<string, SwapOperation[]>([]));

const getNodeApi = jest.fn();
jest.mock("@ledgerhq/coin-evm/network/node/index", () => {
  return {
    getNodeApi: () => getNodeApi(),
  };
});

export const mockGetTokenBalance = jest.fn();
export const mockGetCoinBalance = jest.fn();
getNodeApi.mockReturnValue({
  getTokenBalance: () => mockGetTokenBalance(),
  getCoinBalance: () => mockGetCoinBalance(),
});

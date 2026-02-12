import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, setCoinConfig } from "../config";
import ledgerNode from "../network/node/ledger";
import { getBlockByHeight as externalGetBlockByHeight } from "../network/node/rpc.common";
import { lastBlock } from "./lastBlock";

jest.mock("../network/node/rpc.common", () => ({
  getBlockByHeight: jest.fn(),
}));

jest.mock("../network/node/ledger", () => ({
  __esModule: true,
  default: {
    getBlockByHeight: jest.fn(),
  },
}));

const mockExternalGetBlockByHeight = externalGetBlockByHeight as jest.Mock;
const mockLedgerGetBlockByHeight = ledgerNode.getBlockByHeight as jest.Mock;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["an external node", "external", mockExternalGetBlockByHeight],
    ["a ledger node", "ledger", mockLedgerGetBlockByHeight],
  ])("returns last block info using %s", async (_, type, mockGetBlockByHeight) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    mockGetBlockByHeight.mockResolvedValue({
      hash: "hash",
      height: 33,
      timestamp: new Date("2025-12-31").getTime(),
    });

    expect(await lastBlock({} as CryptoCurrency)).toEqual({
      hash: "hash",
      height: 33,
      time: new Date("2025-12-31"),
    });
  });
});

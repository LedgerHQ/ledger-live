import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, setCoinConfig } from "../config";
import ledgerNode from "../network/node/ledger";
import { getTransactionCount as externalGetTransactionCount } from "../network/node/rpc.common";
import { getSequence } from "./getSequence";

jest.mock("../network/node/rpc.common", () => ({
  getTransactionCount: jest.fn(),
}));

jest.mock("../network/node/ledger", () => ({
  __esModule: true,
  default: {
    getTransactionCount: jest.fn(),
  },
}));

const mockExternalGetTransactionCount = externalGetTransactionCount as jest.Mock;
const mockLedgerGetTransactionCount = ledgerNode.getTransactionCount as jest.Mock;

describe("getSequence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["an external node", "external", mockExternalGetTransactionCount],
    ["a ledger node", "ledger", mockLedgerGetTransactionCount],
  ])("returns next sequence for an address using %s", async (_, type, mockGetTransactionCount) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    mockGetTransactionCount.mockResolvedValue(42);

    expect(await getSequence({} as CryptoCurrency, "")).toEqual(42n);
  });
});

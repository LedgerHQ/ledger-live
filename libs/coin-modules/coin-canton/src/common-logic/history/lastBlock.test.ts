import { getLedgerEnd } from "../../network/gateway";
import { createMockCantonCurrency } from "../../test/fixtures";
import { lastBlock } from "./lastBlock";

jest.mock("../../network/gateway", () => ({ getLedgerEnd: jest.fn() }));

const mockCurrency = createMockCantonCurrency();
const mockedGetLedgerEnd = jest.mocked(getLedgerEnd);

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block height from gateway", async () => {
    mockedGetLedgerEnd.mockResolvedValue(100);

    const result = await lastBlock(mockCurrency);

    expect(result).toEqual({ height: 100 });
    expect(mockedGetLedgerEnd).toHaveBeenCalledTimes(1);
    expect(mockedGetLedgerEnd).toHaveBeenCalledWith(mockCurrency);
  });
});

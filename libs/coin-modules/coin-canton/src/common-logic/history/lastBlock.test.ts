import { isGatewayEnabled } from "../../network/gateway";
import { getLedgerEnd } from "../../network/gateway";
import { createMockCantonCurrency } from "../../test/fixtures";
import { lastBlock } from "./lastBlock";

jest.mock("../../network/gateway", () => ({
  getLedgerEnd: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockCurrency = createMockCantonCurrency();
const mockedGetLedgerEnd = jest.mocked(getLedgerEnd);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsGatewayEnabled.mockReturnValue(true);
  });

  it("should return block info from gateway", async () => {
    mockedGetLedgerEnd.mockResolvedValue(100);

    const result = await lastBlock(mockCurrency);

    expect(result).toEqual({
      height: 100,
      hash: "",
      time: expect.any(Date),
    });
    expect(mockedGetLedgerEnd).toHaveBeenCalledTimes(1);
    expect(mockedGetLedgerEnd).toHaveBeenCalledWith(mockCurrency);
  });

  it("should throw when gateway is disabled in config", async () => {
    mockedIsGatewayEnabled.mockReturnValue(false);

    await expect(lastBlock(mockCurrency)).rejects.toThrow("Not implemented");
    expect(mockedGetLedgerEnd).not.toHaveBeenCalled();
  });
});

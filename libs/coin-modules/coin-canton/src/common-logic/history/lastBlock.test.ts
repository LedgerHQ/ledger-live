import coinConfig from "../../config";
import { getLedgerEnd as getLedgerEndGateway } from "../../network/gateway";
import { getLedgerEnd as getLedgerEndNode } from "../../network/node";
import { createMockCantonCurrency, createMockCoinConfigValue } from "../../test/fixtures";
import { lastBlock } from "./lastBlock";

jest.mock("../../config", () => ({ __esModule: true, default: { getCoinConfig: jest.fn() } }));
jest.mock("../../network/gateway", () => ({ getLedgerEnd: jest.fn() }));
jest.mock("../../network/node", () => ({ getLedgerEnd: jest.fn() }));

const mockCurrency = createMockCantonCurrency();
const mockedGetCoinConfig = jest.mocked(coinConfig.getCoinConfig);
const mockedGetLedgerEndGateway = jest.mocked(getLedgerEndGateway);
const mockedGetLedgerEndNode = jest.mocked(getLedgerEndNode);

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use gateway when useGateway is true", async () => {
    mockedGetCoinConfig.mockReturnValue(createMockCoinConfigValue());
    mockedGetLedgerEndGateway.mockResolvedValue(100);

    const result = await lastBlock(mockCurrency);

    expect(result).toEqual({ height: 100 });
    expect(mockedGetLedgerEndGateway).toHaveBeenCalledTimes(1);
    expect(mockedGetLedgerEndNode).not.toHaveBeenCalled();
  });

  it("should use node when useGateway is false", async () => {
    mockedGetCoinConfig.mockReturnValue(createMockCoinConfigValue({ useGateway: false }));
    mockedGetLedgerEndNode.mockResolvedValue(200);

    const result = await lastBlock(mockCurrency);

    expect(result).toEqual({ height: 200 });
    expect(mockedGetLedgerEndGateway).not.toHaveBeenCalled();
    expect(mockedGetLedgerEndNode).toHaveBeenCalledTimes(1);
  });
});

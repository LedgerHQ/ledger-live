import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getLedgerEnd as gatewayGetLedgerEnd } from "../../network/gateway";
import { getLedgerEnd as nodeGetLedgerEnd } from "../../network/node";
import { lastBlock } from "./lastBlock";

jest.mock("../../network/gateway", () => ({
  getLedgerEnd: jest.fn(),
}));
jest.mock("../../network/node", () => ({
  getLedgerEnd: jest.fn(),
}));

jest.mock("../../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn(),
  },
}));

import coinConfig from "../../config";

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use gateway.getLedgerEnd when useGateway is true", async () => {
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({ useGateway: true });
    (gatewayGetLedgerEnd as jest.Mock).mockResolvedValue(100);

    const result = await lastBlock(mockCurrency);

    expect(result).toEqual({ height: 100 });
    expect(gatewayGetLedgerEnd).toHaveBeenCalledTimes(1);
    expect(nodeGetLedgerEnd).not.toHaveBeenCalled();
  });

  it("should use node.getLedgerEnd when useGateway is false", async () => {
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({ useGateway: false });
    (nodeGetLedgerEnd as jest.Mock).mockResolvedValue(200);

    const result = await lastBlock(mockCurrency);

    expect(result).toEqual({ height: 200 });
    expect(nodeGetLedgerEnd).toHaveBeenCalledTimes(1);
    expect(gatewayGetLedgerEnd).not.toHaveBeenCalled();
  });
});

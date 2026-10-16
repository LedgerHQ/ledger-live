import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { openNetworkPortfolio } from "./portfolio/network";

jest.mock("./api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("./api/context", () => ({ buildContext: jest.fn() }));
jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("./portfolio/network", () => ({ openNetworkPortfolio: jest.fn() }));

describe("openCurrencyPortfolio", () => {
  it("wires the network portfolio on the currency's own coin module, account module and catalog", async () => {
    const tron = getCryptoCurrencyById("tron");
    const coinModuleApi = { lastBlock: jest.fn() };
    const binding = { create: jest.fn() };
    const bridgeApi = { accountModule: binding, getTokenFromAsset: jest.fn() };
    const context = { config: jest.fn() };
    const opened = { portfolio: {}, network: "tron", mode: "local" };
    jest.mocked(getCoinModuleApi).mockResolvedValue(coinModuleApi as never);
    jest.mocked(getBridgeApi).mockResolvedValue(bridgeApi as never);
    jest.mocked(buildContext).mockReturnValue(context as never);
    jest.mocked(openNetworkPortfolio).mockResolvedValue(opened as never);

    await expect(openCurrencyPortfolio(tron, "write")).resolves.toBe(opened);

    expect(getCoinModuleApi).toHaveBeenCalledWith("tron", "local");
    expect(getBridgeApi).toHaveBeenCalledWith(tron, "tron");
    expect(buildContext).toHaveBeenCalledWith("tron");
    expect(openNetworkPortfolio).toHaveBeenCalledWith(
      tron,
      { binding, coinModuleApi, context, bridgeApi },
      "write",
    );
    // Wiring only: nothing is called on the coin module.
    expect(coinModuleApi.lastBlock).not.toHaveBeenCalled();
  });
});

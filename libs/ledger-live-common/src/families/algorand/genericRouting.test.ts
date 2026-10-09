import { getCoinFrameworkAccountBridge } from "../../bridge/generic-coin-framework/accountBridge";
import { getCoinModuleApi } from "../../bridge/generic-coin-framework/api";
import { getCoinFrameworkCurrencyBridge } from "../../bridge/generic-coin-framework/currencyBridge";
import { isGenericCoinFrameworkFamily } from "../../bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { createLocalAlgorandApi } from "./coinModuleApi";

jest.mock("./coinModuleApi", () => ({ createLocalAlgorandApi: jest.fn() }));

describe("algorand generic coin framework wiring", () => {
  it("runs on the generic coin framework", () => {
    expect(isGenericCoinFrameworkFamily("algorand")).toBe(true);
  });

  it("serves coin-module calls from the local coin-algorand module", async () => {
    const lastBlock = jest.fn().mockResolvedValue({ height: 42 });
    jest.mocked(createLocalAlgorandApi).mockReturnValue({ lastBlock } as never);

    const api = await getCoinModuleApi("algorand", "local");

    await expect(api.lastBlock({} as never)).resolves.toEqual({ height: 42 });
    expect(createLocalAlgorandApi).toHaveBeenCalledWith("algorand");
  });

  it("resolves the account and currency bridges", async () => {
    await expect(getCoinFrameworkAccountBridge("algorand", "local")).resolves.toBeDefined();
    await expect(getCoinFrameworkCurrencyBridge("algorand", "local")).resolves.toBeDefined();
  });
});

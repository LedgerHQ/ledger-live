import { createBoilerplateCoinConfig } from "../config.fixture";
import { DEFAULT_FALLBACK_FEE } from "../config";
import { simulate } from "../network/node";
import { SimulationError } from "../types/errors";
import { estimateFees } from "./estimateFees";

jest.mock("../network/node");

describe("estimateFees", () => {
  beforeEach(() => {
    jest.mocked(simulate).mockRejectedValue(new SimulationError());
  });

  it("returns the simulated fee when the simulation succeeds", async () => {
    jest.mocked(simulate).mockResolvedValue(25);

    expect(await estimateFees(createBoilerplateCoinConfig(), "tx")).toEqual(25n);
  });

  it("returns the module default fallback fee when the config sets none", async () => {
    expect(await estimateFees(createBoilerplateCoinConfig(), "tx")).toEqual(
      BigInt(DEFAULT_FALLBACK_FEE),
    );
  });

  it("returns the configured fallback fee when the simulation fails", async () => {
    const config = createBoilerplateCoinConfig({ fees: { fallbackFee: 4242 } });

    expect(await estimateFees(config, "tx")).toEqual(4242n);
  });

  it("passes the config to the node simulation", async () => {
    const config = createBoilerplateCoinConfig();

    await estimateFees(config, "tx");

    expect(simulate).toHaveBeenCalledWith(config, "tx");
  });
});

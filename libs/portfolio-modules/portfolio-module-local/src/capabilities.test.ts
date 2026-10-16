import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { requireCapability } from "./capabilities";
import { aLocalNetwork } from "./test-utils";

const unsupported = new PortfolioApiError("METHOD_NOT_ALLOWED", "call is not supported on bitcoin");

describe("requireCapability", () => {
  it("passes a method the coin module implements", () => {
    const network = aLocalNetwork();

    expect(() => requireCapability(network, "call")).not.toThrow();
    network.coinModule.supports = jest.fn(() => true);
    expect(() => requireCapability(network, "call")).not.toThrow();
    expect(network.coinModule.supports).toHaveBeenCalledWith("call");
  });

  it("refuses a method the coin module's supports says it lacks", () => {
    const network = aLocalNetwork();
    network.coinModule.supports = jest.fn(() => false);

    expect(() => requireCapability(network, "call")).toThrow(unsupported);
  });

  it("refuses a method the coin module does not have", () => {
    const network = aLocalNetwork();
    delete (network.coinModule as Partial<typeof network.coinModule>).call;

    expect(() => requireCapability(network, "call")).toThrow(unsupported);
  });
});

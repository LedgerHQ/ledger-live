import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { localNetworkOf, networkServing, requireLocalNetwork } from "./localNetworks";
import { aLocalNetwork } from "./test-utils";

const bitcoin = aLocalNetwork();
const cardano = aLocalNetwork({ currencyId: "cardano", registrationTypes: ["cardano"] });
const networks = { bitcoin, cardano };

describe("localNetworkOf", () => {
  it("returns a configured network", () => {
    expect(localNetworkOf(networks, "bitcoin")).toBe(bitcoin);
  });

  it("ignores names that are not configured, object prototype keys included", () => {
    expect(localNetworkOf(networks, "ethereum")).toBeUndefined();
    expect(localNetworkOf(networks, "constructor")).toBeUndefined();
  });
});

describe("requireLocalNetwork", () => {
  it("returns a configured network", () => {
    expect(requireLocalNetwork(networks, "bitcoin")).toBe(bitcoin);
  });

  it("rejects a network not served locally as a bad request", () => {
    expect(() => requireLocalNetwork(networks, "ethereum")).toThrow(
      new PortfolioApiError("BAD_REQUEST", "Network ethereum is not served locally"),
    );
  });
});

describe("networkServing", () => {
  it("returns the network when it accepts the registration type", () => {
    expect(networkServing(networks, "bitcoin", "auto_derive")).toBe(bitcoin);
  });

  it("returns nothing when the network does not accept the registration type", () => {
    expect(networkServing(networks, "bitcoin", "static")).toBeUndefined();
  });

  it("returns nothing for a registration type with no local mapping, even if configured", () => {
    expect(networkServing(networks, "cardano", "cardano")).toBeUndefined();
  });

  it("returns nothing for a network not configured", () => {
    expect(networkServing(networks, "ethereum", "static")).toBeUndefined();
  });
});

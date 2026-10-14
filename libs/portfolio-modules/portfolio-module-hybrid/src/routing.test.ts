import type { RegistrationInput } from "@ledgerhq/portfolio-module-framework";
import {
  defaultRouteRead,
  defaultRouteRegistration,
  defaultRouteWrite,
  preferLocal,
  preferRemote,
  registrationNetwork,
} from "./routing";

const networks = { local: ["bitcoin", "ethereum"], remote: ["ethereum", "solana", "cardano"] };

describe("registrationNetwork", () => {
  it.each<[RegistrationInput, string]>([
    [{ type: "evm", address: "0xabc" }, "ethereum"],
    [{ type: "solana", address: "So1" }, "solana"],
    [{ type: "auto_derive", network: "bitcoin", xpub: "xpub" }, "bitcoin"],
    [{ type: "static", accountId: "a", network: "tron" }, "tron"],
    [{ type: "cardano", accountId: "a", network: "cardano" }, "cardano"],
  ])("lands %p on %s", (registration, network) => {
    expect(registrationNetwork(registration)).toBe(network);
  });
});

describe("defaultRouteRegistration", () => {
  it("sends a registration to the remote when it serves its network", () => {
    expect(defaultRouteRegistration({ type: "evm", address: "0xabc" }, networks)).toBe("remote");
  });

  it("keeps a registration local when the remote does not serve its network", () => {
    const registration = { type: "auto_derive", network: "bitcoin", xpub: "xpub" } as const;
    expect(defaultRouteRegistration(registration, networks)).toBe("local");
  });
});

describe("preferRemote", () => {
  it("picks the remote when it serves the network", () => {
    expect(preferRemote("ethereum", networks)).toBe("remote");
  });

  it("falls back to local otherwise", () => {
    expect(preferRemote("bitcoin", networks)).toBe("local");
  });

  it("is the default routing of network reads", () => {
    expect(defaultRouteRead).toBe(preferRemote);
  });
});

describe("preferLocal", () => {
  it("picks local when it serves the network", () => {
    expect(preferLocal("ethereum", networks)).toBe("local");
  });

  it("falls back to the remote otherwise", () => {
    expect(preferLocal("solana", networks)).toBe("remote");
  });

  it("is the default routing of writes", () => {
    expect(defaultRouteWrite).toBe(preferLocal);
  });
});

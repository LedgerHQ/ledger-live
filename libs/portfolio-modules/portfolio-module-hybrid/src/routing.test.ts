import type {
  PortfolioMode,
  Registration,
  RegistrationInput,
} from "@ledgerhq/portfolio-module-framework";
import { readSide, registrationNetwork, registrationSides, writeSide } from "./routing";
import type { Side } from "./types";

describe("registrationNetwork", () => {
  it.each<[RegistrationInput | Registration, string]>([
    [{ type: "evm", address: "0xabc" }, "ethereum"],
    [{ type: "solana", address: "So1" }, "solana"],
    [{ type: "auto_derive", network: "bitcoin", xpub: "xpub" }, "bitcoin"],
    [{ type: "static", accountId: "a", network: "tron" }, "tron"],
    [{ type: "cardano", accountId: "a", network: "cardano" }, "cardano"],
    [{ type: "evm", id: "reg", address: "0xabc" }, "ethereum"],
    [{ type: "static", id: "reg", network: "tron" }, "tron"],
  ])("lands %p on %s", (registration, network) => {
    expect(registrationNetwork(registration)).toBe(network);
  });
});

describe.each<[PortfolioMode, readonly Side[], Side, Side]>([
  ["local", ["local"], "local", "local"],
  ["remote", ["remote"], "remote", "remote"],
  ["hybrid", ["local", "remote"], "remote", "local"],
])("a network in %s mode", (mode, registeredOn, readOn, writtenOn) => {
  it(`is registered on ${registeredOn.join(" and ")}`, () => {
    expect(registrationSides(mode)).toEqual(registeredOn);
  });

  it(`is read on ${readOn}`, () => {
    expect(readSide(mode)).toBe(readOn);
  });

  it(`is written on ${writtenOn}`, () => {
    expect(writeSide(mode)).toBe(writtenOn);
  });
});

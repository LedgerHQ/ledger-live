import type { PortfolioMode, Registration } from "@ledgerhq/portfolio-module-framework";
import { memoizeModes } from "./modes";
import { hybridTwins, registrationIdentity } from "./registrations";

describe("registrationIdentity", () => {
  const same = (a: Registration, b: Registration) =>
    registrationIdentity(a) === registrationIdentity(b);

  it("ignores the id each side gave a registration", () => {
    expect(
      same(
        { type: "auto_derive", id: "local-1", network: "bitcoin", xpub: "xpub" },
        { type: "auto_derive", id: "remote-1", network: "bitcoin", xpub: "xpub" },
      ),
    ).toBe(true);
  });

  it.each<[string, Registration, Registration]>([
    [
      "an xpub",
      { type: "auto_derive", id: "a", network: "bitcoin", xpub: "xpub1" },
      { type: "auto_derive", id: "b", network: "bitcoin", xpub: "xpub2" },
    ],
    [
      "a network",
      { type: "auto_derive", id: "a", network: "bitcoin", xpub: "xpub" },
      { type: "auto_derive", id: "b", network: "litecoin", xpub: "xpub" },
    ],
    [
      "a type",
      { type: "auto_derive", id: "a", network: "solana", xpub: "So1" },
      { type: "solana", id: "b", address: "So1" },
    ],
    [
      "an evm address",
      { type: "evm", id: "a", address: "0xabc" },
      { type: "evm", id: "b", address: "0xabd" },
    ],
    [
      "the case of an evm address",
      { type: "evm", id: "a", address: "0xABC" },
      { type: "evm", id: "b", address: "0xabc" },
    ],
    [
      "a solana address",
      { type: "solana", id: "a", address: "So1" },
      { type: "solana", id: "b", address: "so1" },
    ],
    [
      "a static address",
      { type: "static", id: "a", network: "tron", addresses: ["T1"] },
      { type: "static", id: "b", network: "tron", addresses: ["T1", "T2"] },
    ],
    [
      "cardano external credentials",
      { type: "cardano", id: "a", network: "cardano", external: ["e1"], internal: ["i1"] },
      { type: "cardano", id: "b", network: "cardano", external: ["e2"], internal: ["i1"] },
    ],
    [
      "cardano internal credentials",
      { type: "cardano", id: "a", network: "cardano", external: ["e1"], internal: ["i1"] },
      { type: "cardano", id: "b", network: "cardano", external: ["e1"], internal: ["i2"] },
    ],
    [
      "cardano stake credentials",
      { type: "cardano", id: "a", network: "cardano", external: ["e1"], stake: ["s1"] },
      { type: "cardano", id: "b", network: "cardano", external: ["e1"], stake: ["s2"] },
    ],
  ])("tells registrations apart by %s", (_, a, b) => {
    expect(same(a, b)).toBe(false);
  });

  it("matches static addresses as a set", () => {
    expect(
      same(
        { type: "static", id: "a", network: "tron", addresses: ["T2", "T1", "T1"] },
        { type: "static", id: "b", network: "tron", addresses: ["T1", "T2"] },
      ),
    ).toBe(true);
    expect(
      same(
        { type: "static", id: "a", network: "tron" },
        { type: "static", id: "b", network: "tron", addresses: [] },
      ),
    ).toBe(true);
  });

  it("matches cardano credentials as sets", () => {
    expect(
      same(
        {
          type: "cardano",
          id: "a",
          network: "cardano",
          external: ["e2", "e1"],
          internal: ["i1"],
          stake: ["s1"],
        },
        {
          type: "cardano",
          id: "b",
          network: "cardano",
          external: ["e1", "e2"],
          internal: ["i1", "i1"],
          stake: ["s1"],
        },
      ),
    ).toBe(true);
  });
});

describe("hybridTwins", () => {
  const modeOf = jest.fn((network: string): PortfolioMode =>
    network === "bitcoin" ? "hybrid" : "remote",
  );
  const remote: Registration = { type: "auto_derive", id: "r1", network: "bitcoin", xpub: "x1" };
  const twin: Registration = { type: "auto_derive", id: "l1", network: "bitcoin", xpub: "x1" };
  const other: Registration = { type: "auto_derive", id: "l2", network: "bitcoin", xpub: "x2" };

  beforeEach(() => modeOf.mockClear());

  it("finds the local twin of a removed registration of a hybrid network", async () => {
    await expect(
      hybridTwins({ removed: [remote], kept: [], local: [other, twin] }, memoizeModes(modeOf)),
    ).resolves.toEqual([twin]);
  });

  it("finds no twin for a registration of a remote network", async () => {
    const evm: Registration = { type: "evm", id: "r2", address: "0xabc" };
    const localEvm: Registration = { type: "evm", id: "l3", address: "0xabc" };

    await expect(
      hybridTwins({ removed: [evm], kept: [], local: [localEvm] }, memoizeModes(modeOf)),
    ).resolves.toEqual([]);
    expect(modeOf).toHaveBeenCalledWith("ethereum");
  });

  it("keeps a twin a kept registration still backs", async () => {
    const kept: Registration = { ...remote, id: "r2" };

    await expect(
      hybridTwins({ removed: [remote], kept: [kept], local: [twin] }, memoizeModes(modeOf)),
    ).resolves.toEqual([]);
  });

  it("finds the twin when every registration backing it is removed", async () => {
    const duplicate: Registration = { ...remote, id: "r2" };

    await expect(
      hybridTwins(
        { removed: [remote, duplicate], kept: [{ ...other, id: "r3" }], local: [twin, other] },
        memoizeModes(modeOf),
      ),
    ).resolves.toEqual([twin]);
  });

  it("finds no twin when nothing is removed", async () => {
    await expect(
      hybridTwins({ removed: [], kept: [remote], local: [twin] }, memoizeModes(modeOf)),
    ).resolves.toEqual([]);
    expect(modeOf).not.toHaveBeenCalled();
  });
});

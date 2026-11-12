import type { Address, DerivationPath } from "@domain/entity-account-descriptor";
import type { AccountReceive } from "@domain/entity-account-receive";
import {
  resolveReceiveFamilyConfig,
  resolveReceiveFamilyTraits,
} from "../resolveReceiveFamilyConfig";

const ADDRESS = "0xabc" as Address;
const PATH = "m/44h/60h/0h/0/0" as DerivationPath;

const shownByDevice: AccountReceive = {
  address: ADDRESS,
  verification: { type: "address", path: PATH, address: ADDRESS },
};

describe("resolveReceiveFamilyTraits", () => {
  it("applies the defaults under the family's traits", () => {
    expect(
      resolveReceiveFamilyTraits({ family: "bitcoin", familyConfig: { notices: ["utxo"] } }),
    ).toEqual({ isSupported: true, notices: ["utxo"] });
  });

  it("sends an excluded family back to the legacy flow", () => {
    expect(
      resolveReceiveFamilyTraits({ family: "evm", excludedFamilies: ["evm"] }).isSupported,
    ).toBe(false);
  });
});

describe("resolveReceiveFamilyConfig", () => {
  it("verifies on device an address the device shows", () => {
    const config = resolveReceiveFamilyConfig({ family: "evm", receive: shownByDevice });
    expect(config.verification).toBe("device");
    expect(config.addressOptions).toBeUndefined();
  });

  it("cannot verify before the receive data answers", () => {
    expect(resolveReceiveFamilyConfig({ family: "evm" }).verification).toBe("unavailable");
  });

  it.each([
    ["a key", { type: "publicKey", path: PATH, publicKey: "302a" }],
    ["a given address", { type: "addressConfirmation", path: PATH, address: ADDRESS }],
    ["nothing", undefined],
  ] as const)("cannot verify when the device confirms %s", (_, verification) => {
    const receive = { address: ADDRESS, verification } as AccountReceive;
    expect(resolveReceiveFamilyConfig({ family: "hedera", receive }).verification).toBe(
      "unavailable",
    );
  });

  it("tells what senders can attach next to the address", () => {
    expect(
      resolveReceiveFamilyConfig({ family: "evm", receive: shownByDevice }).memoType,
    ).toBeUndefined();
    expect(
      resolveReceiveFamilyConfig({
        family: "xrp",
        receive: { ...shownByDevice, memo: { type: "tag" } },
      }).memoType,
    ).toBe("tag");
  });

  it("tells how to activate a token the account must activate first", () => {
    const config = resolveReceiveFamilyConfig({
      family: "stellar",
      receive: shownByDevice,
      gate: { type: "activation", method: "trustline" },
    });
    expect(config.activationKind).toBe("trustline");
  });

  it("tells no activation when the gate does not say how", () => {
    expect(
      resolveReceiveFamilyConfig({ family: "xrp", gate: { type: "unknown" } }).activationKind,
    ).toBeUndefined();
  });

  it("offers the shielded address next to the transparent one", () => {
    const shielded = "zs1shielded" as Address;
    const config = resolveReceiveFamilyConfig({
      family: "bitcoin",
      receive: { ...shownByDevice, shielded: { address: shielded } },
    });

    expect(config.addressOptions).toEqual([
      { id: "transparent", address: ADDRESS, verification: "device" },
      { id: "shielded", address: shielded, verification: "unavailable" },
    ]);
  });

  it("tells the memo of each address option, a Zcash memo riding to the shielded one alone", () => {
    const config = resolveReceiveFamilyConfig({
      family: "zcash",
      receive: { ...shownByDevice, shielded: { address: "u1" as Address, memo: { type: "text" } } },
    });

    expect(config.memoType).toBeUndefined();
    expect(config.addressOptions?.map(({ id, memoType }) => ({ id, memoType }))).toEqual([
      { id: "transparent", memoType: undefined },
      { id: "shielded", memoType: "text" },
    ]);
  });
});

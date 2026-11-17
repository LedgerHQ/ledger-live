import { RECEIVE_URLS } from "../../urls";
import { toReceiveNotices } from "../toReceiveNotices";

describe("toReceiveNotices", () => {
  it.each([
    ["utxo", "info"],
    ["taproot", "warning"],
    ["dashStaking", "warning"],
    ["tronInactiveAccount", "warning"],
    ["tezosDelegation", "info"],
    ["zcashPrivateNotEnabled", "info"],
  ] as const)("shows the %s notice as %s", (id, tone) => {
    expect(toReceiveNotices({ familyNotices: [id], canVerifyOnDevice: true })).toEqual([
      expect.objectContaining({ id, tone }),
    ]);
  });

  it("links the Tron notice to its support article", () => {
    expect(
      toReceiveNotices({ familyNotices: ["tronInactiveAccount"], canVerifyOnDevice: true }),
    ).toEqual([expect.objectContaining({ learnMoreUrl: RECEIVE_URLS.tronInactiveAccount })]);
  });

  it("tells, after the family notices, that the device cannot show the address", () => {
    expect(
      toReceiveNotices({ familyNotices: ["utxo"], canVerifyOnDevice: false }).map(({ id }) => id),
    ).toEqual(["utxo", "unverifiableAddress"]);
  });

  it("shows nothing for an address the device can show, without family notice", () => {
    expect(toReceiveNotices({ familyNotices: [], canVerifyOnDevice: true })).toEqual([]);
  });
});

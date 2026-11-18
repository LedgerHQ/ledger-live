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
  ] as const)("should show the %s notice as %s", (id, tone) => {
    expect(toReceiveNotices({ familyNotices: [id], canVerifyOnDevice: true })).toEqual([
      expect.objectContaining({ id, tone }),
    ]);
  });

  it("should link the Tron notice to its support article", () => {
    expect(
      toReceiveNotices({ familyNotices: ["tronInactiveAccount"], canVerifyOnDevice: true }),
    ).toEqual([expect.objectContaining({ learnMoreUrl: RECEIVE_URLS.tronInactiveAccount })]);
  });

  it("should tell, after the family notices, that the device cannot show the address", () => {
    expect(
      toReceiveNotices({ familyNotices: ["utxo"], canVerifyOnDevice: false }).map(({ id }) => id),
    ).toEqual(["utxo", "unverifiableAddress"]);
  });

  it("should show nothing for an address the device can show, without family notice", () => {
    expect(toReceiveNotices({ familyNotices: [], canVerifyOnDevice: true })).toEqual([]);
  });
});

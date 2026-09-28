import { getPrivacyAttributes } from "./tracking";

describe("zcash getPrivacyAttributes", () => {
  it("is undefined before a source pool is picked", () => {
    expect(getPrivacyAttributes({ family: "zcash", transferType: "transparent" })).toBeUndefined();
  });

  it("is undefined for a non-zcash transaction", () => {
    expect(
      getPrivacyAttributes({ family: "bitcoin", sender: "public", transferType: "transparent" }),
    ).toBeUndefined();
  });

  it("is undefined for a non-transaction value", () => {
    expect(getPrivacyAttributes(null)).toBeUndefined();
    expect(getPrivacyAttributes(undefined)).toBeUndefined();
  });

  it.each([
    ["transparent", "public", "public-to-public"],
    ["transparent-to-shielded", "public", "public-to-private"],
    ["shielded-to-transparent", "private", "private-to-public"],
    ["shielded", "private", "private-to-private"],
  ] as const)("maps transferType %s to privacy %s / flow %s", (transferType, sender, flow) => {
    expect(getPrivacyAttributes({ family: "zcash", sender, transferType })).toEqual({
      privacy: sender,
      flow,
    });
  });
});

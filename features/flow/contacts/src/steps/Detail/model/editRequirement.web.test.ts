import { mockContact, mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import { resolveContactEditRequirement } from "./editRequirement";

describe("resolveContactEditRequirement", () => {
  it("returns direct edit when the contact has no addresses", () => {
    expect(resolveContactEditRequirement(mockContact())).toEqual({
      type: "direct",
      reason: "contact-has-no-address",
    });
  });

  it("returns confirmation-required edit when the contact has addresses", () => {
    expect(resolveContactEditRequirement(mockContactWithAddress())).toEqual({
      type: "confirmation-required",
      reason: "contact-has-address",
    });
  });
});

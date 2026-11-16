import { NetworkValidatorSchema } from "./schema";
import { mockNetworkValidator } from "./schema.mock";

describe("NetworkValidatorSchema", () => {
  it("accepts a mock and honors overrides", () => {
    expect(NetworkValidatorSchema.parse(mockNetworkValidator())).toEqual(mockNetworkValidator());
    expect(mockNetworkValidator({ name: "Figment" }).name).toBe("Figment");
  });

  it("accepts a validator with only an id and a name", () => {
    expect(NetworkValidatorSchema.parse({ id: "v", name: "" })).toEqual({ id: "v", name: "" });
  });

  it("accepts the Ledger flag", () => {
    expect(mockNetworkValidator({ ledger: true }).ledger).toBe(true);
  });

  it.each([
    ["an empty id", { id: "" }],
    ["a commission above 1", { commission: 1.5 }],
    ["a negative commission", { commission: -0.1 }],
    ["a decimal totalStaked", { totalStaked: "1.5" }],
    ["a negative totalStaked", { totalStaked: "-1" }],
    ["an iconUrl that is not a url", { iconUrl: "logo" }],
    ["a ledger flag set to false", { ledger: false }],
  ])("rejects %s", (_, override) => {
    expect(
      NetworkValidatorSchema.safeParse({ ...mockNetworkValidator(), ...override }).success,
    ).toBe(false);
  });
});

import { lwdContacts } from "./lwdContacts";
import { lwmContacts } from "./lwmContacts";

describe("Contacts feature flags", () => {
  it.each([
    ["desktop", lwdContacts],
    ["mobile", lwmContacts],
  ])("defaults %s Contacts to EVM-only address families", (_, schema) => {
    expect(schema.parse(undefined)).toEqual({
      enabled: false,
      params: {
        newBadge: false,
        eligibleAddressFamilies: ["evm"],
      },
    });
  });

  it.each([
    ["desktop", lwdContacts],
    ["mobile", lwmContacts],
  ])("parses %s Contacts eligible address families", (_, schema) => {
    expect(
      schema.parse({
        enabled: true,
        params: {
          newBadge: true,
          eligibleAddressFamilies: ["evm", "tron"],
        },
      }),
    ).toEqual({
      enabled: true,
      params: {
        newBadge: true,
        eligibleAddressFamilies: ["evm", "tron"],
      },
    });
  });
});

import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { AccountUUIDSchema } from "../accountUUID";
import { computeAccountUUID } from "./computeAccountUUID";

const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

describe("computeAccountUUID", () => {
  it("is stable for a known descriptor", () => {
    expect(computeAccountUUID(mockUtxoAccountDescriptor())).toBe(
      "0fd543d7-5125-5f32-95c7-937d6a169ed4",
    );
  });

  it.each<[AccountDescriptor, string]>([
    [
      mockAddressAccountDescriptor({ network: "Ethereum", path: "m/44'/60'/0'/0/0" }),
      "bf498ad6-dbff-5da0-834d-8f3870db2426",
    ],
    [
      mockAddressAccountDescriptor({
        network: "solana",
        key: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        path: "m/44h/501h/0h/0h",
      }),
      "900a3c3b-f896-5151-968e-8bdf9748d2eb",
    ],
    [mockUtxoAccountDescriptor({ purpose: "mock" }), "ebb5087d-2b3d-5e15-9cfe-0d5a6f2d1aec"],
    [
      mockUtxoAccountDescriptor({ network: "BITCOIN_TESTNET", path: "m/84H/1H/2H" }),
      "70635ea8-643f-5857-ae57-bba062f6f694",
    ],
  ])("keeps the persisted uuid of %j", (descriptor, uuid) => {
    expect(computeAccountUUID(descriptor)).toBe(uuid);
  });

  it("carries no account key", () => {
    expect(computeAccountUUID(mockAddressAccountDescriptor({ key: ETH_ADDR }))).not.toContain(
      ETH_ADDR.slice(2, 10).toLowerCase(),
    );
  });
});

describe("AccountUUIDSchema", () => {
  it("accepts a computed uuid and rejects a v4 uuid", () => {
    expect(
      AccountUUIDSchema.safeParse(computeAccountUUID(mockAddressAccountDescriptor())).success,
    ).toBe(true);
    expect(AccountUUIDSchema.safeParse("9b2f6d0e-3c4a-4d6b-8e1f-0a1b2c3d4e5f").success).toBe(false);
  });
});

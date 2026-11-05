import { AddressSchema } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { planReceiveVerify } from "../buildReceiveVerifyIntentInput";

const descriptor = mockAddressAccountDescriptor();
const address = AddressSchema.parse("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
const shown = { type: "address", path: "m/44h/60h/0h/0/0", address } as const;

describe("planReceiveVerify", () => {
  it("asks getAddress to show the address, expecting the verification's", async () => {
    await expect(
      planReceiveVerify({ key: "k", descriptor, verification: shown, target: "receive" }),
    ).resolves.toMatchObject({
      type: "ready",
      options: { path: "44'/60'/0'/0/0", verify: true, currency: { id: "ethereum" } },
      input: { expectedAddress: address },
    });
  });

  it("cannot verify a shielded address through getAddress", async () => {
    await expect(
      planReceiveVerify({ key: "k", descriptor, verification: shown, target: "shielded" }),
    ).resolves.toMatchObject({ type: "unsupported" });
  });

  it("cannot verify a key", async () => {
    await expect(
      planReceiveVerify({
        key: "k",
        descriptor,
        verification: { type: "publicKey", path: "m/44h/3030h", publicKey: "302a" },
        target: "receive",
      }),
    ).resolves.toMatchObject({ type: "unsupported" });
  });
});

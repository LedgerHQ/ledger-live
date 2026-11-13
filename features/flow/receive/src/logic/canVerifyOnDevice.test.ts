import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { canVerifyOnDevice } from "./canVerifyOnDevice";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const PATH = "m/44h/60h/0h/0/0";

describe("canVerifyOnDevice", () => {
  it("should offer Verify when the device derives and shows the address", () => {
    const { verification } = mockAccountReceive();

    expect(canVerifyOnDevice(verification)).toBe(true);
  });

  it.each([
    { type: "addressConfirmation", path: PATH, address: ADDRESS },
    { type: "shieldedAddress", path: PATH, address: ADDRESS },
    { type: "publicKey", path: PATH, publicKey: "302a" },
  ] as const)("should not offer Verify when the device can only confirm a $type", input => {
    const { verification } = mockAccountReceive({ verification: input });

    expect(canVerifyOnDevice(verification)).toBe(false);
  });

  it("should not offer Verify when the device cannot confirm the address", () => {
    const { verification } = mockAccountReceive({ verification: undefined });

    expect(canVerifyOnDevice(verification)).toBe(false);
  });
});

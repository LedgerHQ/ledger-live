import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountReceiveSchema,
  AccountReceivesStateSchema,
  initialAccountReceivesState,
} from "./schema";
import { mockAccountReceive } from "./schema.mock";

const receiveWith = (verification: unknown) => ({ address: "0x1", verification });

describe("AccountReceiveSchema", () => {
  it("should accept an address the device confirms by deriving it", () => {
    expect(AccountReceiveSchema.parse(mockAccountReceive())).toEqual(mockAccountReceive());
  });

  it("should accept a device showing another address than the receive address", () => {
    expect(
      mockAccountReceive({
        address: "ldg::1220ab",
        verification: {
          type: "address",
          path: "m/44h/6767h/0h/0h/0h",
          address: "canton_9f3c",
        },
      }),
    ).toMatchObject({ address: "ldg::1220ab", verification: { address: "canton_9f3c" } });
  });

  it("should accept a device confirming the key that controls the account", () => {
    expect(
      mockAccountReceive({
        address: "0.0.1234",
        verification: {
          type: "publicKey",
          path: "m/44h/3030h/0h/0h/0h",
          publicKey: "302a",
        },
      }),
    ).toMatchObject({ verification: { type: "publicKey", publicKey: "302a" } });
  });

  it("should accept an address the device is given to confirm", () => {
    expect(
      mockAccountReceive({
        address: "3kBx2h",
        verification: {
          type: "addressConfirmation",
          path: "m/1105h/0h/0h/0h/0h/0h",
          address: "3kBx2h",
        },
      }),
    ).toMatchObject({ verification: { type: "addressConfirmation" } });
  });

  it("should accept a shielded address next to the transparent one", () => {
    const shielded = {
      address: "u1shielded",
      verification: { type: "address" as const, path: "m/44h/133h/0h/0/3", address: "u1shielded" },
    };
    expect(mockAccountReceive({ address: "t1transparent", shielded })).toMatchObject({
      address: "t1transparent",
      shielded,
    });
  });

  it("should accept an address the device cannot confirm", () => {
    expect(mockAccountReceive({ address: "0x1", verification: undefined })).toEqual({
      address: "0x1",
    });
  });

  it("should read a legacy hardened marker of the verification path as h", () => {
    expect(
      mockAccountReceive({
        address: "0x1",
        verification: { type: "address", path: "m/44'/60'/0'/0/0", address: "0x1" },
      }),
    ).toMatchObject({ verification: { path: "m/44h/60h/0h/0/0" } });
  });

  it("should reject a verification path that is not a BIP32 path", () => {
    expect(
      AccountReceiveSchema.safeParse(
        receiveWith({ type: "address", path: "44/60", address: "0x1" }),
      ).success,
    ).toBe(false);
  });

  it("should reject a public key verification without a key", () => {
    expect(
      AccountReceiveSchema.safeParse(
        receiveWith({ type: "publicKey", path: "m/44h/0h", publicKey: "" }),
      ).success,
    ).toBe(false);
  });

  it("should reject a receive without an address", () => {
    expect(AccountReceiveSchema.safeParse({}).success).toBe(false);
  });
});

describe("AccountReceivesStateSchema", () => {
  const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
  const entry = { revision: 0, receive: mockAccountReceive() };

  it("should accept an empty initial state", () => {
    expect(AccountReceivesStateSchema.parse(initialAccountReceivesState)).toEqual({});
  });

  it("should accept a receive keyed by an AccountUUID", () => {
    const stored = { [accountUUID]: entry };
    expect(AccountReceivesStateSchema.parse(stored)).toEqual(stored);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(AccountReceivesStateSchema.safeParse({ nope: entry }).success).toBe(false);
  });
});

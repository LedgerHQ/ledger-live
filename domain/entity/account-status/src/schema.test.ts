import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountAssetStatusSchema,
  AccountStatusSchema,
  AccountStatusStateSchema,
  AssetStatusSchema,
  initialAccountStatusState,
} from "./schema";
import { mockAccountStatus, mockAssetStatus } from "./schema.mock";

describe("AccountStatusSchema", () => {
  it("should accept a used account ready to transact", () => {
    expect(AccountStatusSchema.parse(mockAccountStatus())).toEqual({
      used: true,
      gate: null,
    });
  });

  it("should accept an account never used", () => {
    expect(mockAccountStatus({ used: false })).toMatchObject({ used: false });
  });

  it("should accept the onboarding gate", () => {
    const gate = { type: "onboarding" } as const;
    expect(mockAccountStatus({ gate })).toMatchObject({ gate });
  });

  it("should reject an account activation gate: readiness does not block a send", () => {
    expect(
      AccountStatusSchema.safeParse({
        used: true,
        gate: { type: "activation", reason: "unrevealed" },
      }).success,
    ).toBe(false);
  });

  it("should reject a status without used", () => {
    expect(AccountStatusSchema.safeParse({ gate: null }).success).toBe(false);
  });

  it("should reject a status that leaves the account gate out", () => {
    expect(AccountStatusSchema.safeParse({ used: true }).success).toBe(false);
  });
});

describe("AssetStatusSchema", () => {
  it("should accept an asset without a gate", () => {
    expect(AssetStatusSchema.parse(mockAssetStatus())).toEqual({ gate: null });
  });

  it.each(["association", "optIn", "trustline", "authorize"] as const)(
    "should accept an asset activated by %s",
    method => {
      expect(mockAssetStatus({ gate: { type: "activation", method } })).toMatchObject({
        gate: { method },
      });
    },
  );

  it("should reject a gate other than an activation", () => {
    expect(AssetStatusSchema.safeParse({ gate: { type: "unknown" } }).success).toBe(false);
  });

  it("should reject an unknown activation method", () => {
    expect(
      AssetStatusSchema.safeParse({ gate: { type: "activation", method: "airdrop" } }).success,
    ).toBe(false);
  });

  it("should reject a status that leaves the asset gate out", () => {
    expect(AssetStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe("AccountAssetStatusSchema", () => {
  it("should accept the status of a token", () => {
    const read = {
      assetId: "hedera/hts/usdc_0.0.456858",
      status: mockAssetStatus({ gate: { type: "activation", method: "association" } }),
    };
    expect(AccountAssetStatusSchema.parse(read)).toEqual(read);
  });

  it("should reject a status that names no asset", () => {
    expect(AccountAssetStatusSchema.safeParse({ status: mockAssetStatus() }).success).toBe(false);
  });
});

describe("AccountStatusStateSchema", () => {
  const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
  const asset = { revision: 0, status: mockAssetStatus() };

  it("should accept an empty initial state", () => {
    expect(AccountStatusStateSchema.parse(initialAccountStatusState)).toEqual({});
  });

  it("should accept the account and its assets keyed by an AccountUUID", () => {
    const stored = {
      [accountUUID]: {
        account: { revision: 1, status: mockAccountStatus() },
        assets: { ethereum: asset },
      },
    };
    expect(AccountStatusStateSchema.parse(stored)).toEqual(stored);
  });

  it("should accept assets read before the account", () => {
    const stored = { [accountUUID]: { assets: { ethereum: asset } } };
    expect(AccountStatusStateSchema.parse(stored)).toEqual(stored);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(AccountStatusStateSchema.safeParse({ nope: { assets: {} } }).success).toBe(false);
  });
});

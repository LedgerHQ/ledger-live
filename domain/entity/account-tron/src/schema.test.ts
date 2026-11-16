import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { AccountTronStateSchema, TronResourcesSchema, initialAccountTronState } from "./schema";
import { mockTronResources } from "./schema.mock";

const resources = {
  energy: "0",
  bandwidth: { freeUsed: "0", freeLimit: "600", gainedUsed: "0", gainedLimit: "0" },
  tronPower: 0,
};

describe("TronResourcesSchema", () => {
  it("should accept the mock", () => {
    expect(TronResourcesSchema.parse(mockTronResources())).toEqual(mockTronResources());
  });

  it("should accept an account with no energy nor Tron power", () => {
    expect(TronResourcesSchema.parse(resources)).toEqual(resources);
  });

  it("should honor overrides", () => {
    expect(mockTronResources({ energy: "5", tronPower: 3 })).toMatchObject({
      energy: "5",
      tronPower: 3,
    });
  });

  it("should reject a negative or fractional energy", () => {
    expect(TronResourcesSchema.safeParse({ ...resources, energy: "-1" }).success).toBe(false);
    expect(TronResourcesSchema.safeParse({ ...resources, energy: "1.5" }).success).toBe(false);
  });

  it("should reject a fractional Tron power", () => {
    expect(TronResourcesSchema.safeParse({ ...resources, tronPower: 1.5 }).success).toBe(false);
  });

  it("should reject a bandwidth without its gained part", () => {
    expect(
      TronResourcesSchema.safeParse({
        ...resources,
        bandwidth: { freeUsed: "0", freeLimit: "600" },
      }).success,
    ).toBe(false);
  });
});

describe("AccountTronStateSchema", () => {
  it("should accept the initial state", () => {
    expect(AccountTronStateSchema.parse(initialAccountTronState)).toEqual({});
  });

  it("should accept entries keyed by an AccountUUID", () => {
    const state = {
      [computeAccountUUID(mockAddressAccountDescriptor())]: {
        revision: 1,
        resources: mockTronResources(),
      },
    };
    expect(AccountTronStateSchema.parse(state)).toEqual(state);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(
      AccountTronStateSchema.safeParse({ nope: { revision: 0, resources: mockTronResources() } })
        .success,
    ).toBe(false);
  });
});

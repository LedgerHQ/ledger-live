import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountStakingPositionSchema,
  AccountStakingSchema,
  AccountStakingStateSchema,
  initialAccountStakingState,
} from "./schema";
import { mockAccountStaking, mockAccountStakingPosition } from "./schema.mock";
import { mockAccountStakingState } from "./slice.mock";

describe("AccountStakingPositionSchema", () => {
  it("should accept an active delegation", () => {
    expect(AccountStakingPositionSchema.parse(mockAccountStakingPosition())).toMatchObject({
      state: "active",
      amount: "1000000",
      rewards: "1500",
    });
  });

  it.each(["inactive", "activating", "active", "deactivating", "withdrawable"] as const)(
    "should accept the %s state",
    state => {
      expect(mockAccountStakingPosition({ state })).toMatchObject({ state });
    },
  );

  it("should accept a position with no validator nor actions", () => {
    const position = mockAccountStakingPosition({ validatorId: undefined, actions: undefined });
    expect(position.validatorId).toBeUndefined();
    expect(position.actions).toBeUndefined();
  });

  it("should accept an unlock date with an offset", () => {
    expect(mockAccountStakingPosition({ unlockAt: "2026-12-01T00:00:00+02:00" }).unlockAt).toBe(
      "2026-12-01T00:00:00+02:00",
    );
  });

  it("should accept a delegation with a pending redelegation", () => {
    const redelegatingFrom = {
      validatorId: "cosmosvaloper1source",
      completesAt: "2026-12-01T00:00:00.000Z",
    };
    expect(mockAccountStakingPosition({ redelegatingFrom }).redelegatingFrom).toEqual(
      redelegatingFrom,
    );
  });

  it("should accept a Tron vote with its count", () => {
    expect(mockAccountStakingPosition({ votes: "4", amount: "4000000" }).votes).toBe("4");
  });

  it("should accept a stake backing several validators", () => {
    const validatorIds = ["val1", "val2"];
    expect(
      mockAccountStakingPosition({ validatorId: undefined, validatorIds }).validatorIds,
    ).toEqual(validatorIds);
  });

  it.each([
    { state: "bonded" },
    { votes: "1.5" },
    { validatorIds: [] },
    { validatorIds: [""] },
    { redelegatingFrom: { validatorId: "" } },
    { redelegatingFrom: { validatorId: "v", completesAt: "soon" } },
    { amount: "-1" },
    { amount: "1.5" },
    { rewards: "abc" },
    { id: "" },
    { unlockAt: "tomorrow" },
    { actions: ["stake"] },
  ])("should reject %o", override => {
    expect(
      AccountStakingPositionSchema.safeParse({ ...mockAccountStakingPosition(), ...override })
        .success,
    ).toBe(false);
  });
});

describe("AccountStakingSchema", () => {
  it("should accept an account that does not stake", () => {
    expect(AccountStakingSchema.parse({ positions: [] })).toEqual({ positions: [] });
  });

  it("should accept account-wide rewards", () => {
    const rewards = [{ assetId: "tron", amount: "42" }];
    expect(AccountStakingSchema.parse({ positions: [], rewards })).toEqual({
      positions: [],
      rewards,
    });
  });

  it("should reject an account-wide reward with a bad amount", () => {
    expect(
      AccountStakingSchema.safeParse({
        positions: [],
        rewards: [{ assetId: "tron", amount: "-1" }],
      }).success,
    ).toBe(false);
  });

  it("should reject a result without positions", () => {
    expect(AccountStakingSchema.safeParse({}).success).toBe(false);
  });

  it("should honor overrides", () => {
    expect(mockAccountStaking({ positions: [] })).toEqual({ positions: [] });
  });
});

describe("AccountStakingStateSchema", () => {
  it("should accept the initial state and the mock state", () => {
    expect(AccountStakingStateSchema.parse(initialAccountStakingState)).toEqual({});
    expect(AccountStakingStateSchema.parse(mockAccountStakingState())).toEqual(
      mockAccountStakingState(),
    );
  });

  it("should reject an entry without a revision", () => {
    const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
    expect(
      AccountStakingStateSchema.safeParse({ [accountUUID]: { staking: mockAccountStaking() } })
        .success,
    ).toBe(false);
  });
});

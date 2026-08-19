import {
  PayCardLogoutResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardStatusResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

describe("PayCardSessionResponseSchema", () => {
  it("accepts a token payload", () => {
    const response = {
      access_token: "at_token",
      expires_in: 21600,
      refresh_token: "rt_token",
    };

    expect(PayCardSessionResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects a non-positive lifetime", () => {
    expect(() =>
      PayCardSessionResponseSchema.parse({
        access_token: "at_token",
        expires_in: 0,
        refresh_token: "rt_token",
      }),
    ).toThrow();
  });
});

describe("PayCardLogoutResponseSchema", () => {
  it("accepts the success flag", () => {
    expect(PayCardLogoutResponseSchema.parse({ success: true })).toEqual({ success: true });
  });
});

describe("PayCardUserResponseSchema", () => {
  it("drops the personal data the endpoint returns alongside the fields the Card flows use", () => {
    expect(
      PayCardUserResponseSchema.parse({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "PENDING",
        firstName: "Ada",
        email: "ada@example.com",
        ssn: "000-00-0000",
      }),
    ).toEqual({
      id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      verificationState: "PENDING",
    });
  });

  it("rejects an unknown verification state", () => {
    expect(() =>
      PayCardUserResponseSchema.parse({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "SOMETHING_ELSE",
      }),
    ).toThrow();
  });
});

describe("PayCardOrderResponseSchema", () => {
  it("keeps the success flag and drops everything else the order answers with", () => {
    expect(
      PayCardOrderResponseSchema.parse({
        success: true,
        cardId: "card-1",
        pan: "pan-must-not-reach-the-cache",
      }),
    ).toEqual({ success: true });
  });

  it("rejects a success flag that is not a boolean", () => {
    expect(() => PayCardOrderResponseSchema.parse({ success: "yes" })).toThrow();
  });
});

describe("PayCardStatusResponseSchema", () => {
  const cardStatus = {
    id: "card-1",
    holderName: "Ada Lovelace",
    expiryDate: "2029/08",
    panLast4: "1234",
    status: "ACTIVE",
    type: "VIRTUAL",
    orderedAt: "2026-08-19T10:00:00.000Z",
  };

  it("drops the card secrets the endpoint must never be trusted to withhold", () => {
    expect(
      PayCardStatusResponseSchema.parse({
        ...cardStatus,
        pan: "4111111111111111",
        cvv: "123",
        pin: "0000",
      }),
    ).toEqual(cardStatus);
  });

  it("rejects a status the wire contract does not name", () => {
    expect(() =>
      PayCardStatusResponseSchema.parse({ ...cardStatus, status: "SOMETHING_ELSE" }),
    ).toThrow();
  });

  it("rejects a card type the wire contract does not name", () => {
    expect(() =>
      PayCardStatusResponseSchema.parse({ ...cardStatus, type: "SOMETHING_ELSE" }),
    ).toThrow();
  });
});

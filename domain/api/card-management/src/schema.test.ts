import {
  PayCardErrorResponseSchema,
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
  it("reads the documented order response", () => {
    expect(PayCardOrderResponseSchema.parse({ success: true })).toEqual({ success: true });
  });

  it("rejects a success flag that is not a boolean", () => {
    expect(() => PayCardOrderResponseSchema.parse({ success: "yes" })).toThrow();
  });
});

describe("PayCardStatusResponseSchema", () => {
  // The provider's own example response, field for field.
  const cardStatus = {
    id: "000000000050277836",
    holderName: "JOHN DOE",
    expiryDate: "2028/01",
    panLast4: "1234",
    status: "ACTIVE",
    type: "VIRTUAL",
    orderedAt: "2023-03-27T17:07:12.662Z",
  };

  it("reads the documented status response", () => {
    expect(PayCardStatusResponseSchema.parse(cardStatus)).toEqual(cardStatus);
  });

  it("keeps the card id as the digit string the provider sends, not a uuid", () => {
    expect(PayCardStatusResponseSchema.parse(cardStatus).id).toBe("000000000050277836");
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

describe("PayCardErrorResponseSchema", () => {
  it.each([
    [401, "Not authenticated"],
    [403, "Not authorized"],
    [404, "Card not found"],
    [400, "User already has a card"],
    [422, "type field is required"],
    [498, "Invalid client key"],
    [499, "Missing client key"],
    [500, "Internal server error"],
  ])("reads the documented %i body", (_status, message) => {
    expect(PayCardErrorResponseSchema.parse({ message })).toEqual({ message });
  });

  it("rejects an error body with no message", () => {
    expect(() => PayCardErrorResponseSchema.parse({})).toThrow();
  });
});

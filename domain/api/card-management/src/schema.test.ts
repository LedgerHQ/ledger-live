import {
  PayCardErrorResponseSchema,
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletSchema,
  PayCardLinkedWalletSchema,
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

describe("PayCardFreezeStateResponseSchema", () => {
  it("reads the documented response, which freeze and unfreeze share", () => {
    expect(PayCardFreezeStateResponseSchema.parse({ success: true })).toEqual({ success: true });
    expect(PayCardFreezeStateResponseSchema.parse({ success: false })).toEqual({ success: false });
  });

  it("rejects a success the provider sent as anything but a boolean", () => {
    expect(() => PayCardFreezeStateResponseSchema.parse({ success: "yes" })).toThrow();
  });
});

describe("PayCardStatusResponseSchema", () => {
  // The provider's own example response.
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

  it("reads a card that answered without a holder name or expiry date", () => {
    const { holderName: _holderName, expiryDate: _expiryDate, ...withoutPreview } = cardStatus;

    expect(PayCardStatusResponseSchema.parse(withoutPreview)).toEqual(withoutPreview);
  });

  it("still requires the fields a card always answers with", () => {
    const { panLast4: _panLast4, ...withoutPanLast4 } = cardStatus;

    expect(() => PayCardStatusResponseSchema.parse(withoutPanLast4)).toThrow();
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

describe("PayCardInternalWalletSchema", () => {
  // The provider's own example response.
  const documentedWallets = [
    {
      id: "098aeb90-e7f7-4f81-bc2e-4963330122c5",
      balance: "125.50",
      currency: "xrp",
      address: "rNxp4h8apvRis6mJf9Sh8C6iRxfrDWN7AA",
      addressMemo: "78",
      addressId: "0x0a4b21fa733e9aeaddbf070302a85c559de13c4c",
      type: "INTERNAL",
    },
    {
      id: "7c1839ee-918e-4787-b74f-deeb48ead58b",
      balance: "500.00",
      currency: "usdc",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
      addressMemo: null,
      addressId: "7c1839ee-918e-4787-b74f-deeb48ead58b",
      type: "INTERNAL",
    },
  ];

  const wallet = documentedWallets[0];

  it("reads the whole documented response, memo-less wallet included", () => {
    expect(documentedWallets.map(entry => PayCardInternalWalletSchema.parse(entry))).toHaveLength(
      2,
    );
  });

  it("keeps an explicit null memo as null", () => {
    expect(PayCardInternalWalletSchema.parse(documentedWallets[1]).addressMemo).toBeNull();
  });

  it("keeps the balance as the string the provider sent", () => {
    expect(PayCardInternalWalletSchema.parse(wallet).balance).toBe("125.50");
  });

  it("drops the internal address id and the constant type the contract does not declare", () => {
    const parsed = PayCardInternalWalletSchema.parse(wallet);

    expect(parsed).not.toHaveProperty("addressId");
    expect(parsed).not.toHaveProperty("type");
  });

  it("keeps the address memo the chain needs", () => {
    expect(PayCardInternalWalletSchema.parse(wallet).addressMemo).toBe("78");
  });

  it("rejects an empty memo, because the provider writes no memo as null", () => {
    expect(() => PayCardInternalWalletSchema.parse({ ...wallet, addressMemo: "" })).toThrow();
  });

  it("rejects a balance sent as a number, which would already have lost precision", () => {
    expect(() => PayCardInternalWalletSchema.parse({ ...wallet, balance: 125.4 })).toThrow();
  });

  it("rejects an empty balance, which is not the same as zero", () => {
    expect(() => PayCardInternalWalletSchema.parse({ ...wallet, balance: "" })).toThrow();
  });
});

describe("PayCardLinkedWalletSchema", () => {
  // The provider's own example response.
  const linked = {
    id: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    currency: "usdc",
    network: "ethereum",
    priority: 2,
  };

  it("reads the documented linked wallet", () => {
    expect(PayCardLinkedWalletSchema.parse(linked)).toEqual(linked);
  });

  it("accepts a priority of zero", () => {
    expect(PayCardLinkedWalletSchema.parse({ ...linked, priority: 0 }).priority).toBe(0);
  });

  it("rejects a priority sent as a string", () => {
    expect(() => PayCardLinkedWalletSchema.parse({ ...linked, priority: "1" })).toThrow();
  });

  it("rejects an overflowing priority, which JSON hands over as Infinity", () => {
    const overflowed = JSON.parse('{"priority":1e400}') as { priority: number };

    expect(overflowed.priority).toBe(Infinity);
    expect(() =>
      PayCardLinkedWalletSchema.parse({ ...linked, priority: overflowed.priority }),
    ).toThrow();
  });

  it("keeps a negative priority, which sorts first and is not a parse failure", () => {
    expect(PayCardLinkedWalletSchema.parse({ ...linked, priority: -1 }).priority).toBe(-1);
  });

  it("rejects a linked wallet with no network, which would not identify the asset", () => {
    expect(() => PayCardLinkedWalletSchema.parse({ ...linked, network: "" })).toThrow();
  });
});

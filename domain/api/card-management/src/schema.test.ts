import {
  PayCardErrorResponseSchema,
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletSchema,
  PayCardLinkedWalletSchema,
  PayCardLogoutResponseSchema,
  PayCardOnboardingStatusResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardDetailsCssSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardStatusResponseSchema,
  PAY_CARD_TRANSACTION_CATEGORIES,
  PayCardTransactionSchema,
  PayCardTransactionsRequestSchema,
  PayCardTransactionsResponseSchema,
  PayCardWalletHistoryEntrySchema,
  PayCardWalletHistoryRequestSchema,
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

describe("PayCardDetailsTokenResponseSchema", () => {
  // The provider's example, with an all-zero token: a real-looking one trips secret scanning.
  const detailsToken = {
    token: "00000000-0000-4000-8000-000000000000",
    imageUrl:
      "https://card.api.live.ledger.com/details-image?token=00000000-0000-4000-8000-000000000000",
  };

  it("reads the documented token response", () => {
    expect(PayCardDetailsTokenResponseSchema.parse(detailsToken)).toEqual(detailsToken);
  });

  it("rejects an empty image url, which would render nothing at all", () => {
    expect(() =>
      PayCardDetailsTokenResponseSchema.parse({ ...detailsToken, imageUrl: "" }),
    ).toThrow();
  });
});

describe("PayCardDetailsCssSchema", () => {
  it("takes the documented colours, and takes none at all", () => {
    const css = {
      cardBackgroundColor: "#000000",
      cardTextColor: "#FFFFFF",
      panBackgroundColor: "#EFEFEF",
      panTextColor: "#000000",
    };

    expect(PayCardDetailsCssSchema.parse(css)).toEqual(css);
    expect(PayCardDetailsCssSchema.parse({})).toEqual({});
  });

  it("rejects a colour the provider would answer 422 for", () => {
    expect(() => PayCardDetailsCssSchema.parse({ cardTextColor: "white" })).toThrow();
    expect(() => PayCardDetailsCssSchema.parse({ cardTextColor: "#GGGGGG" })).toThrow();
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

  it("reads a wallet that answered with no address memo at all", () => {
    const { addressMemo: _addressMemo, ...withoutMemo } = documentedWallets[0]!;

    expect(PayCardInternalWalletSchema.parse(withoutMemo).addressMemo).toBeUndefined();
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

describe("PayCardOnboardingStatusResponseSchema", () => {
  const response = {
    steps: [
      {
        id: "kyc",
        title: "Verify your identity",
        description: "Complete KYC verification to activate your card.",
        isDone: true,
      },
      {
        id: "address",
        title: "Add shipping address",
        description: "Tell us where to send your physical card.",
        isDone: false,
      },
    ],
  };

  it("reads a status made of onboarding steps", () => {
    expect(PayCardOnboardingStatusResponseSchema.parse(response)).toEqual(response);
  });

  it("accepts a status with no remaining steps as an empty list", () => {
    expect(PayCardOnboardingStatusResponseSchema.parse({ steps: [] })).toEqual({ steps: [] });
  });

  it("drops the keys the wire contract does not declare on a step", () => {
    const parsed = PayCardOnboardingStatusResponseSchema.parse({
      steps: [{ ...response.steps[0], cta: "https://ledger.com" }],
    });

    expect(parsed.steps[0]).not.toHaveProperty("cta");
  });

  it("rejects a step whose done flag is not a boolean", () => {
    expect(() =>
      PayCardOnboardingStatusResponseSchema.parse({
        steps: [{ ...response.steps[0], isDone: "yes" }],
      }),
    ).toThrow();
  });

  it("rejects a step with an empty title", () => {
    expect(() =>
      PayCardOnboardingStatusResponseSchema.parse({
        steps: [{ ...response.steps[0], title: "" }],
      }),
    ).toThrow();
  });
});

describe("PayCardTransactionSchema", () => {
  // The provider's own documented example, kept whole so the extra keys are exercised too.
  const documented = {
    id: "100a99cf-f4d3-4fa1-9be9-2e9828b20ebb",
    cardId: "1234537292209260487",
    panLast4: "9189",
    transactionId: "1122334477422",
    dateTime: "2024-10-14T10:44:36.276Z",
    sign: "DEBIT",
    merchantNameLocation: "WWW.ALIEXPRESS.COM, LONDON",
    merchantType: "OutOfWalletOnline",
    mcc: 5964,
    mccCategory: "MISC",
    transactionCurrency: "EUR",
    amountInTransactionCurrency: "0.79",
    feesInTransactionCurrency: "0",
    originalCurrency: "USD",
    amountInOriginalCurrency: "0.85",
    feesInOriginalCurrency: "0",
    billingConversionRate: "0.9294117647058824",
    ecbRate: "0.9161704076958315",
    status: "CONFIRMED",
    declineReason: "",
    fundingSources: [
      {
        id: "3181a37a-07fa-41dc-b423-6c2db07a7ba1",
        address: "0x3a11a86cf218c448be519728cd3ac5c741fb3424",
        network: "linea",
        txHash: "0xb92de09d893e8162b0861c0f7321f68df02212efbc58f208839ae3f176d89638",
        currency: "usdc",
        amount: "0.104201",
        fees: "0",
        swapFee: "0.00208",
        sign: "DEBIT",
        status: "CONFIRMED",
        dateTime: "2024-10-14T10:44:36.288Z",
      },
    ],
  };

  it("reads the transaction the provider documents", () => {
    expect(PayCardTransactionSchema.parse(documented).id).toBe(documented.id);
  });

  it("accepts the empty decline reason a confirmed transaction carries", () => {
    // The provider sends `""`, not an absent key. A non-empty rule here would reject every
    // transaction that was not declined.
    expect(PayCardTransactionSchema.parse(documented).declineReason).toBe("");
  });

  it("reads a declined transaction with its reason", () => {
    const declined = { ...documented, status: "DECLINED", declineReason: "Insufficient funds" };

    expect(PayCardTransactionSchema.parse(declined)).toMatchObject({
      status: "DECLINED",
      declineReason: "Insufficient funds",
    });
  });

  it.each(["CONFIRMED", "PENDING", "DECLINED", "REVERTED"])("reads a %s transaction", status => {
    expect(PayCardTransactionSchema.parse({ ...documented, status }).status).toBe(status);
  });

  it("keeps the card and processor ids out of what callers receive", () => {
    const parsed = PayCardTransactionSchema.parse(documented);

    // Zod drops what is not declared, which is what keeps the unneeded fields out of the cache.
    expect(parsed).not.toHaveProperty("cardId");
    expect(parsed).not.toHaveProperty("panLast4");
    expect(parsed).not.toHaveProperty("fundingSources");
  });

  it("keeps the amount as the string the provider sent, not a number", () => {
    expect(PayCardTransactionSchema.parse(documented).amountInTransactionCurrency).toBe("0.79");
  });

  it("rejects a direction the wire contract does not name", () => {
    expect(() => PayCardTransactionSchema.parse({ ...documented, sign: "REFUND" })).toThrow();
  });

  it.each(PAY_CARD_TRANSACTION_CATEGORIES)("reads a %s spend category", mccCategory => {
    expect(PayCardTransactionSchema.parse({ ...documented, mccCategory }).mccCategory).toBe(
      mccCategory,
    );
  });

  it("reads a spend category the provider does not name as MISC", () => {
    expect(
      PayCardTransactionSchema.parse({ ...documented, mccCategory: "SHOPPING" }).mccCategory,
    ).toBe("MISC");
  });

  it("keeps the whole page when one transaction carries an unnamed spend category", () => {
    const page = [
      { ...documented, mccCategory: "FOOD" },
      { ...documented, id: "second", mccCategory: "SHOPPING" },
    ];

    expect(
      PayCardTransactionsResponseSchema.parse(page).map(({ mccCategory }) => mccCategory),
    ).toEqual(["FOOD", "MISC"]);
  });
});

describe("PayCardTransactionsRequestSchema", () => {
  it("takes no filters at all", () => {
    expect(PayCardTransactionsRequestSchema.parse(undefined)).toBeUndefined();
  });

  it("takes a page on its own", () => {
    expect(PayCardTransactionsRequestSchema.parse({ page: 2 })).toEqual({ page: 2 });
  });

  it("takes both dates together", () => {
    const range = { dateFrom: "2026-01-01", dateTo: "2026-01-31" };

    expect(PayCardTransactionsRequestSchema.parse(range)).toEqual(range);
  });

  it.each([{ dateFrom: "2026-01-01" }, { dateTo: "2026-01-31" }])(
    "rejects %s, because the provider requires the pair",
    range => {
      expect(() => PayCardTransactionsRequestSchema.parse(range)).toThrow();
    },
  );

  it("rejects a negative page", () => {
    expect(() => PayCardTransactionsRequestSchema.parse({ page: -1 })).toThrow();
  });
});

describe("PayCardWalletHistoryEntrySchema", () => {
  // The provider's own documented example.
  const withdrawal = {
    name: "Credit withdrawal",
    amount: "10.00",
    currency: "usdc",
    sign: "debit",
    date: "2024-02-02T15:01:09.091Z",
  };

  it("reads the entry the provider documents", () => {
    expect(PayCardWalletHistoryEntrySchema.parse(withdrawal)).toEqual(withdrawal);
  });

  it.each(["debit", "credit"])("reads a %s movement", sign => {
    expect(PayCardWalletHistoryEntrySchema.parse({ ...withdrawal, sign }).sign).toBe(sign);
  });

  it("rejects the uppercase sign a card transaction uses", () => {
    // The two endpoints disagree on case. Accepting both here would hide that from the caller
    // that has to reconcile them.
    expect(() => PayCardWalletHistoryEntrySchema.parse({ ...withdrawal, sign: "DEBIT" })).toThrow();
  });

  it("keeps the amount as the string the provider sent", () => {
    expect(
      PayCardWalletHistoryEntrySchema.parse({ ...withdrawal, amount: "0.104201" }).amount,
    ).toBe("0.104201");
  });

  it("keeps the provider's own description, which is all it says about the movement", () => {
    const purchase = { ...withdrawal, name: "Card purchase - Starbucks" };

    expect(PayCardWalletHistoryEntrySchema.parse(purchase).name).toBe("Card purchase - Starbucks");
  });
});

describe("PayCardWalletHistoryRequestSchema", () => {
  it("reads a credit wallet without a currency", () => {
    const request = { walletId: "w-1", walletType: "CREDIT" as const };

    expect(PayCardWalletHistoryRequestSchema.parse(request)).toEqual(request);
  });

  it("requires the currency for an internal wallet", () => {
    // The provider errors on an internal wallet asked for without one.
    expect(() =>
      PayCardWalletHistoryRequestSchema.parse({ walletId: "w-1", walletType: "INTERNAL" }),
    ).toThrow();
  });

  it("reads an internal wallet with its currency", () => {
    const request = { walletId: "w-1", walletType: "INTERNAL" as const, walletCurrency: "usdc" };

    expect(PayCardWalletHistoryRequestSchema.parse(request)).toEqual(request);
  });

  it("takes a page", () => {
    const request = { walletId: "w-1", walletType: "REWARD" as const, page: 3 };

    expect(PayCardWalletHistoryRequestSchema.parse(request).page).toBe(3);
  });

  it("rejects a wallet type the provider does not serve", () => {
    expect(() =>
      PayCardWalletHistoryRequestSchema.parse({ walletId: "w-1", walletType: "SAVINGS" }),
    ).toThrow();
  });

  it("rejects a request with no wallet to read", () => {
    expect(() => PayCardWalletHistoryRequestSchema.parse({ walletType: "CREDIT" })).toThrow();
  });
});

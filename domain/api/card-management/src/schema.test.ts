import {
  PayCardErrorResponseSchema,
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletSchema,
  PayCardInternalWalletsResponseSchema,
  PayCardLinkWalletRequestSchema,
  PayCardLinkWalletResponseSchema,
  PayCardLinkedWalletSchema,
  PayCardLogoutResponseSchema,
  PayCardRewardWalletResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardDetailsCssSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardPinCssSchema,
  PayCardPinTokenResponseSchema,
  PayCardSetPinCssSchema,
  PayCardSetPinTokenRequestSchema,
  PayCardSetPinTokenResponseSchema,
  PayCardStatusResponseSchema,
  PAY_CARD_TRANSACTION_CATEGORIES,
  PayCardTransactionSchema,
  PayCardTransactionsRequestSchema,
  PayCardTransactionsResponseSchema,
  PayCardWalletHistoryEntrySchema,
  PayCardWalletHistoryRequestSchema,
  PayCardWalletPrioritiesRequestSchema,
  PayCardWalletPrioritiesResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";
import { documentedPayCardTransaction } from "./cardTransactions.mock";

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

  it("reads whether the card may be frozen, which `status` does not say", () => {
    expect(
      PayCardStatusResponseSchema.parse({ ...cardStatus, isFreezable: true }).isFreezable,
    ).toBe(true);
    expect(
      PayCardStatusResponseSchema.parse({ ...cardStatus, isFreezable: false }).isFreezable,
    ).toBe(false);
  });

  it("leaves both new flags undefined for a tenant that omits them", () => {
    const parsed = PayCardStatusResponseSchema.parse(cardStatus);

    expect(parsed.isFreezable).toBeUndefined();
    expect(parsed.cardAddedToDigitalWallet).toBeUndefined();
  });

  it("rejects a freezable flag that is not a boolean", () => {
    expect(() =>
      PayCardStatusResponseSchema.parse({ ...cardStatus, isFreezable: "true" }),
    ).toThrow();
  });

  it("reads whether the card was added to a phone wallet", () => {
    const added = { ...cardStatus, cardAddedToDigitalWallet: true };

    expect(PayCardStatusResponseSchema.parse(added).cardAddedToDigitalWallet).toBe(true);
    expect(
      PayCardStatusResponseSchema.parse({ ...cardStatus, cardAddedToDigitalWallet: false })
        .cardAddedToDigitalWallet,
    ).toBe(false);
  });

  it("rejects a phone wallet flag that is not a boolean", () => {
    expect(() =>
      PayCardStatusResponseSchema.parse({ ...cardStatus, cardAddedToDigitalWallet: "false" }),
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

describe("PayCardPinTokenResponseSchema", () => {
  // The provider's example, with an all-zero token: a real-looking one trips secret scanning.
  const pinToken = {
    token: "00000000-0000-4000-8000-000000000000",
    imageUrl:
      "https://card.api.live.ledger.com/details-image?token=00000000-0000-4000-8000-000000000000",
  };

  it("reads the documented token response", () => {
    expect(PayCardPinTokenResponseSchema.parse(pinToken)).toEqual(pinToken);
  });

  it("rejects an image url that is not https, which is loaded straight into an image", () => {
    expect(() => PayCardPinTokenResponseSchema.parse({ ...pinToken, imageUrl: "" })).toThrow();
    expect(() =>
      PayCardPinTokenResponseSchema.parse({ ...pinToken, imageUrl: "javascript:alert(1)" }),
    ).toThrow();
  });
});

describe("PayCardPinCssSchema", () => {
  it("takes the documented colours, and takes none at all", () => {
    const css = { backgroundColor: "#EFEFEF", textColor: "#000000" };

    expect(PayCardPinCssSchema.parse(css)).toEqual(css);
    expect(PayCardPinCssSchema.parse({})).toEqual({});
  });

  it("rejects a colour the provider would answer 422 for", () => {
    expect(() => PayCardPinCssSchema.parse({ textColor: "white" })).toThrow();
    expect(() => PayCardPinCssSchema.parse({ backgroundColor: "#GGGGGG" })).toThrow();
  });

  it("declares two colours, and drops every other key on parse", () => {
    expect(PayCardPinCssSchema.parse({ panTextColor: "#000000", textColor: "#000000" })).toEqual({
      textColor: "#000000",
    });
  });
});

describe("PayCardSetPinTokenResponseSchema", () => {
  // The provider's example, with an all-zero token: a real-looking one trips secret scanning.
  const setPinToken = {
    token: "00000000-0000-4000-8000-000000000000",
    hostedPageUrl:
      "https://card.api.live.ledger.com/pin-direct/set?token=00000000-0000-4000-8000-000000000000",
  };

  it("reads the documented token response", () => {
    expect(PayCardSetPinTokenResponseSchema.parse(setPinToken)).toEqual(setPinToken);
  });

  it("rejects a hosted page url that is not https, which the app would open", () => {
    expect(() =>
      PayCardSetPinTokenResponseSchema.parse({ ...setPinToken, hostedPageUrl: "" }),
    ).toThrow();
    expect(() =>
      PayCardSetPinTokenResponseSchema.parse({
        ...setPinToken,
        hostedPageUrl: "http://card.api.live.ledger.com/pin-direct/set",
      }),
    ).toThrow();
  });
});

describe("PayCardSetPinCssSchema", () => {
  it("takes the documented colours and radii, and takes none at all", () => {
    const css = {
      backgroundColor: "#EFEFEF",
      textColor: "#000000",
      backgroundColorPrimary: "#000000",
      textColorPrimary: "#FFFFFF",
      pinBorderColor: "#000000",
      buttonBorderRadius: 8,
      pinBorderRadius: 4,
    };

    expect(PayCardSetPinCssSchema.parse(css)).toEqual(css);
    expect(PayCardSetPinCssSchema.parse({})).toEqual({});
  });

  it("rejects a colour the provider would answer 422 for", () => {
    expect(() => PayCardSetPinCssSchema.parse({ textColor: "white" })).toThrow();
    expect(() => PayCardSetPinCssSchema.parse({ pinBorderColor: "#GGGGGG" })).toThrow();
  });

  it("rejects a radius that cannot be drawn", () => {
    expect(() => PayCardSetPinCssSchema.parse({ buttonBorderRadius: -1 })).toThrow();
    expect(() => PayCardSetPinCssSchema.parse({ pinBorderRadius: "4" })).toThrow();
  });
});

describe("PayCardSetPinTokenRequestSchema", () => {
  it("asks for a token with no argument at all", () => {
    expect(PayCardSetPinTokenRequestSchema.parse(undefined)).toBeUndefined();
    expect(PayCardSetPinTokenRequestSchema.parse({})).toEqual({});
  });

  it("takes a redirect destination, and an embedded page without one", () => {
    const redirecting = { redirectUrl: "https://card.test/pin-done", isEmbedded: false };
    expect(PayCardSetPinTokenRequestSchema.parse(redirecting)).toEqual(redirecting);
    expect(PayCardSetPinTokenRequestSchema.parse({ isEmbedded: true })).toEqual({
      isEmbedded: true,
    });
  });

  it("rejects a destination for an embedded page, which would never navigate to it", () => {
    expect(() =>
      PayCardSetPinTokenRequestSchema.parse({
        isEmbedded: true,
        redirectUrl: "https://card.test/pin-done",
      }),
    ).toThrow();
  });

  it("rejects a destination that is not https", () => {
    expect(() =>
      PayCardSetPinTokenRequestSchema.parse({ redirectUrl: "http://card.test/pin-done" }),
    ).toThrow();
    expect(() =>
      PayCardSetPinTokenRequestSchema.parse({ redirectUrl: "javascript:alert(1)" }),
    ).toThrow();
  });
});

describe("PayCardWalletPrioritiesRequestSchema", () => {
  const order = {
    wallets: [
      { addressId: "0x0a4b21fa733e9aeaddbf070302a85c559de13c4c", priority: 1 },
      { addressId: "7c1839ee-918e-4787-b74f-deeb48ead58b", priority: 2 },
    ],
  };

  it("takes an order where every wallet has a priority of its own", () => {
    expect(PayCardWalletPrioritiesRequestSchema.parse(order)).toEqual(order);
  });

  it("takes the priorities a linked wallet can already answer with, so an order round-trips", () => {
    const fromTheProvider = {
      wallets: [
        { addressId: order.wallets[0].addressId, priority: 0 },
        { addressId: order.wallets[1].addressId, priority: 1.5 },
      ],
    };

    expect(PayCardWalletPrioritiesRequestSchema.parse(fromTheProvider)).toEqual(fromTheProvider);
  });

  it("rejects two wallets sharing a priority, saying which rule failed", () => {
    expect(
      () =>
        PayCardWalletPrioritiesRequestSchema.parse({
          wallets: [
            { addressId: order.wallets[0].addressId, priority: 1 },
            { addressId: order.wallets[1].addressId, priority: 1 },
          ],
        }),
      // The message is all a caller gets back, so it is the only way to tell the rules apart.
    ).toThrow(/each wallet needs a priority of its own/);
  });

  it("rejects the same wallet given two priorities, saying which rule failed", () => {
    expect(() =>
      PayCardWalletPrioritiesRequestSchema.parse({
        wallets: [
          { addressId: order.wallets[0].addressId, priority: 1 },
          { addressId: order.wallets[0].addressId, priority: 2 },
        ],
      }),
    ).toThrow(/each wallet may be given a priority once/);
  });

  it("rejects an order with no wallets in it", () => {
    expect(() => PayCardWalletPrioritiesRequestSchema.parse({ wallets: [] })).toThrow();
  });

  it("rejects a wallet that names no address id", () => {
    expect(() =>
      PayCardWalletPrioritiesRequestSchema.parse({
        wallets: [{ id: order.wallets[0].addressId, priority: 1 }],
      }),
    ).toThrow();
  });
});

describe("PayCardWalletPrioritiesResponseSchema", () => {
  it("reads the documented flag", () => {
    expect(PayCardWalletPrioritiesResponseSchema.parse({ success: true })).toEqual({
      success: true,
    });
  });

  it("rejects an answer that does not say whether the order was written", () => {
    expect(() => PayCardWalletPrioritiesResponseSchema.parse({})).toThrow();
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

  it("keeps the address id, which names the wallet when linking it to the card", () => {
    expect(PayCardInternalWalletSchema.parse(wallet).addressId).toBe(
      "0x0a4b21fa733e9aeaddbf070302a85c559de13c4c",
    );
  });

  it("drops the constant type the contract does not declare", () => {
    expect(PayCardInternalWalletSchema.parse(wallet)).not.toHaveProperty("type");
  });

  it("reads a wallet with no address id, which simply cannot be linked", () => {
    const { addressId: _addressId, ...withoutAddressId } = wallet;
    const parsed = PayCardInternalWalletSchema.parse(withoutAddressId);

    expect(parsed.addressId).toBeUndefined();
    expect(parsed.balance).toBe("125.50");
  });

  it("keeps the balances of the other wallets when one has no address id", () => {
    const { addressId: _addressId, ...withoutAddressId } = documentedWallets[1];

    const parsed = PayCardInternalWalletsResponseSchema.parse([wallet, withoutAddressId]);

    expect(parsed).toHaveLength(2);
    expect(parsed.map(entry => entry.balance)).toEqual(["125.50", "500.00"]);
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

describe("PayCardLinkWalletRequestSchema", () => {
  it("takes the address id the internal wallets answer with", () => {
    const request = { addressId: "0x0a4b21fa733e9aeaddbf070302a85c559de13c4c" };

    expect(PayCardLinkWalletRequestSchema.parse(request)).toEqual(request);
  });

  it("rejects a request that names no wallet", () => {
    expect(() => PayCardLinkWalletRequestSchema.parse({})).toThrow();
    expect(() => PayCardLinkWalletRequestSchema.parse({ addressId: "" })).toThrow();
  });
});

describe("PayCardLinkWalletResponseSchema", () => {
  it("reads the documented flag", () => {
    expect(PayCardLinkWalletResponseSchema.parse({ success: true })).toEqual({ success: true });
  });

  it("rejects an answer that does not say whether the link was made", () => {
    expect(() => PayCardLinkWalletResponseSchema.parse({})).toThrow();
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

describe("PayCardRewardWalletResponseSchema", () => {
  // The provider's own example response.
  const documented = {
    id: "098aeb90-e7f7-4f81-bc2e-4963330122c5",
    balance: "45.75",
    currency: "usdc",
    isWithdrawable: true,
  };

  it("reads the documented wallet", () => {
    expect(PayCardRewardWalletResponseSchema.parse(documented)).toEqual(documented);
  });

  it("keeps the balance a string, so its precision survives", () => {
    const precise = { ...documented, balance: "9007199254740993.000001" };

    expect(PayCardRewardWalletResponseSchema.parse(precise).balance).toBe(
      "9007199254740993.000001",
    );
  });

  it("drops the keys the wire contract does not declare", () => {
    expect(PayCardRewardWalletResponseSchema.parse({ ...documented, type: "REWARD" })).toEqual(
      documented,
    );
  });

  it("rejects an answer that does not say whether the rewards can be withdrawn", () => {
    const { isWithdrawable: _isWithdrawable, ...withoutFlag } = documented;

    expect(() => PayCardRewardWalletResponseSchema.parse(withoutFlag)).toThrow();
  });

  it("rejects a wallet with no id, balance or currency", () => {
    expect(() => PayCardRewardWalletResponseSchema.parse({ ...documented, id: "" })).toThrow();
    expect(() => PayCardRewardWalletResponseSchema.parse({ ...documented, balance: "" })).toThrow();
    expect(() =>
      PayCardRewardWalletResponseSchema.parse({ ...documented, currency: "" }),
    ).toThrow();
  });
});

describe("PayCardTransactionSchema", () => {
  const documented = documentedPayCardTransaction;

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

  it("keeps the last four PAN digits and the processor transaction id", () => {
    const parsed = PayCardTransactionSchema.parse(documented);

    expect(parsed.panLast4).toBe(documented.panLast4);
    expect(parsed.transactionId).toBe(documented.transactionId);
    expect(parsed).not.toHaveProperty("cardId");
  });

  it("drops a PAN fragment that is not exactly four digits, without rejecting the transaction", () => {
    const parsed = PayCardTransactionSchema.parse({ ...documented, panLast4: "918912345678" });

    expect(parsed.id).toBe(documented.id);
    expect(parsed.panLast4).toBeUndefined();
  });

  it("drops a last-four value that is not digits", () => {
    expect(
      PayCardTransactionSchema.parse({ ...documented, panLast4: "9A89" }).panLast4,
    ).toBeUndefined();
  });

  it("keeps the funding asset amounts used by the transaction list", () => {
    expect(PayCardTransactionSchema.parse(documented).fundingSources).toEqual([
      {
        currency: "usdc",
        amount: "0.104201",
        sign: "DEBIT",
      },
    ]);
  });

  it("accepts a transaction with no funding source", () => {
    expect(
      PayCardTransactionSchema.parse({ ...documented, fundingSources: undefined }).fundingSources,
    ).toBeUndefined();
  });

  it("rejects an unknown funding source direction", () => {
    expect(() =>
      PayCardTransactionSchema.parse({
        ...documented,
        fundingSources: [{ ...documented.fundingSources[0], sign: "REFUND" }],
      }),
    ).toThrow();
  });

  it("keeps the cashback the transaction earned", () => {
    expect(PayCardTransactionSchema.parse(documented).cashback).toEqual({
      amount: "0.000104",
      currency: "BXX",
      fiatAmount: "0.01",
      fiatCurrency: "EUR",
      ratePercent: "2",
      status: "EARNED",
    });
  });

  it("accepts a transaction that earned no cashback", () => {
    expect(
      PayCardTransactionSchema.parse({ ...documented, cashback: undefined }).cashback,
    ).toBeUndefined();
  });

  it("reads a cashback status this schema does not name", () => {
    const cashback = { ...documented.cashback, status: "REVERSED" };

    expect(PayCardTransactionSchema.parse({ ...documented, cashback }).cashback?.status).toBe(
      "REVERSED",
    );
  });

  it("drops a cashback missing its amounts, without rejecting the transaction", () => {
    const parsed = PayCardTransactionSchema.parse({
      ...documented,
      cashback: { status: "EARNED" },
    });

    expect(parsed.id).toBe(documented.id);
    expect(parsed.cashback).toBeUndefined();
  });

  it("drops a key the cashback contract does not declare", () => {
    const cashback = { ...documented.cashback, campaignId: "winter-2024" };

    expect(PayCardTransactionSchema.parse({ ...documented, cashback }).cashback).not.toHaveProperty(
      "campaignId",
    );
  });

  it.each([null, "EARNED", 0])("drops a cashback that is not an object (%p)", cashback => {
    const parsed = PayCardTransactionSchema.parse({ ...documented, cashback });

    expect(parsed.id).toBe(documented.id);
    expect(parsed.cashback).toBeUndefined();
  });

  it("keeps both cashback amounts as the strings the provider sent, not numbers", () => {
    const parsed = PayCardTransactionSchema.parse(documented);

    expect(parsed.cashback?.amount).toBe("0.000104");
    expect(parsed.cashback?.fiatAmount).toBe("0.01");
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

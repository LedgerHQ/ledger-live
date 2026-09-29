import { z } from "zod";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** A URL the app loads or opens, or hands the provider to navigate to. Anything but `https:` is rejected. */
const HttpsUrlSchema = z
  .string()
  .url()
  .refine(value => value.startsWith("https://"), { message: "must be an https URL" });

/**
 * Both grants — `authorization_code` and `refresh_token` — answer with this shape. Baanx's contract
 * carries no lifetime for the refresh token itself, only for the access token.
 */
export const PayCardSessionResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
});

/** The lifetime stays the duration the backend sent: turning it into an instant needs a clock. */
export const PayCardSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1),
});

export const PayCardLogoutResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Deliberately narrow. The endpoint also returns name, date of birth, email, address and — in the US
 * — an SSN; zod drops undeclared keys, keeping that PII out of the RTK Query cache. Do not widen.
 */
export const PayCardUserResponseSchema = z.object({
  id: z.string().uuid(),
  verificationState: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]),
});

export const PayCardErrorResponseSchema = z.object({
  message: z.string(),
});

/**
 * `POST /v1/card/order` answers with nothing but this flag. The card itself only becomes observable
 * through the card status endpoint.
 */
export const PayCardOrderResponseSchema = z.object({
  success: z.boolean(),
});

export const PayCardFreezeStateResponseSchema = z.object({
  success: z.boolean(),
});

export const PayCardStatusResponseSchema = z.object({
  id: z.string().min(1),
  // Optional because a live card answered with neither.
  holderName: z.string().min(1).optional(),
  /** `YYYY/MM`, as the provider formats it. */
  expiryDate: z.string().min(1).optional(),
  panLast4: z.string().min(1),
  status: z.enum(["ACTIVE", "FROZEN", "BLOCKED", "INACTIVE"]),
  type: z.enum(["VIRTUAL", "PHYSICAL", "METAL"]),
  /** Whether this card may be frozen at all, as opposed to `status` saying whether it is. */
  isFreezable: z.boolean().optional(),
  orderedAt: z.string().min(1),
  cardAddedToDigitalWallet: z.boolean().optional(),
});

/** Hex colours the provider paints the details image with. Its own defaults apply when omitted. */
export const PayCardDetailsCssSchema = z.object({
  cardBackgroundColor: z.string().regex(HEX_COLOR).optional(),
  cardTextColor: z.string().regex(HEX_COLOR).optional(),
  panBackgroundColor: z.string().regex(HEX_COLOR).optional(),
  panTextColor: z.string().regex(HEX_COLOR).optional(),
});

export const PayCardDetailsTokenResponseSchema = z.object({
  token: z.string().min(1),
  /** Loaded straight into an image. */
  imageUrl: HttpsUrlSchema,
});

/**
 * The two colours this endpoint documents, its own defaults applying to whatever is omitted. A
 * different set from the card details image's, so anything undeclared here is dropped on parse.
 */
export const PayCardPinCssSchema = z.object({
  backgroundColor: z.string().regex(HEX_COLOR).optional(),
  textColor: z.string().regex(HEX_COLOR).optional(),
});

/**
 * Same shape as the card details token, and kept separate: two endpoints of the provider's that
 * agree today are still two contracts, and either may move without the other.
 */
export const PayCardPinTokenResponseSchema = z.object({
  token: z.string().min(1),
  /** Loaded straight into an image. */
  imageUrl: HttpsUrlSchema,
});

/**
 * Colours and radii the provider paints the hosted PIN page with, its own defaults applying to
 * whatever is omitted. A separate set from the card details image's: this page styles a keypad.
 */
export const PayCardSetPinCssSchema = z.object({
  backgroundColor: z.string().regex(HEX_COLOR).optional(),
  textColor: z.string().regex(HEX_COLOR).optional(),
  backgroundColorPrimary: z.string().regex(HEX_COLOR).optional(),
  textColorPrimary: z.string().regex(HEX_COLOR).optional(),
  pinBorderColor: z.string().regex(HEX_COLOR).optional(),
  buttonBorderRadius: z.number().nonnegative().optional(),
  pinBorderRadius: z.number().nonnegative().optional(),
});

const PayCardSetPinTokenBaseSchema = z.object({
  customCss: PayCardSetPinCssSchema.optional(),
});

/**
 * How the hosted PIN page should end, and how it should look. Every field is optional: asking for a
 * token needs no argument at all.
 *
 * An embedded page posts a message to its host frame when it is done and never navigates, so a
 * `redirectUrl` alongside `isEmbedded: true` is a destination nothing would reach. A union rather
 * than two independent fields, so that pairing does not compile instead of being quietly dropped.
 */
export const PayCardSetPinTokenRequestSchema = z
  .union(
    [
      PayCardSetPinTokenBaseSchema.extend({
        isEmbedded: z.literal(true),
        redirectUrl: z.undefined().optional(),
      }),
      PayCardSetPinTokenBaseSchema.extend({
        isEmbedded: z.literal(false).optional(),
        redirectUrl: HttpsUrlSchema.optional(),
      }),
    ],
    { error: "redirectUrl belongs to the redirect flow, so isEmbedded cannot be true" },
  )
  .optional();

export const PayCardSetPinTokenResponseSchema = z.object({
  token: z.string().min(1),
  /** Opened in a tab or an iframe. */
  hostedPageUrl: HttpsUrlSchema,
});

/** The provider's spend groupings. It sends the label; the numeric MCC behind it is dropped. */
export const PAY_CARD_TRANSACTION_CATEGORIES = [
  "SUBSCRIPTIONS",
  "FOOD",
  "TRAVEL",
  "ENTERTAINMENT",
  "HEALTH",
  "ATM",
  "UTILITIES",
  "MISC",
] as const;

export const PayCardTransactionCategorySchema = z.enum(PAY_CARD_TRANSACTION_CATEGORIES);

export const PayCardTransactionFundingSourceSchema = z.object({
  currency: z.string().min(1),
  amount: z.string().min(1),
  sign: z.enum(["DEBIT", "CREDIT"]),
});

/**
 * What the transaction earned back, in the reward token and in the card's own currency.
 *
 * Both amounts stay strings for the same reason every other amount here does: a decimal that
 * survived the wire should not be rounded into a number on the way in. `ratePercent` is the rate
 * that produced them, so a caller can show the rate without recomputing it from the pair.
 *
 * `status`: `EARNED` is confirmed and unclaimed, `CLAIMED` paid out, `PENDING` still settling (the
 * provider sends both amounts as zero, unchecked here), and `NOT_EARNED` declined or reverted. A
 * status outside these four fails the whole cashback, which the transaction then drops.
 */
export const PayCardTransactionCashbackSchema = z.object({
  amount: z.string().min(1),
  currency: z.string().min(1),
  fiatAmount: z.string().min(1),
  fiatCurrency: z.string().min(1),
  ratePercent: z.string().min(1),
  status: z.enum(["EARNED", "CLAIMED", "PENDING", "NOT_EARNED"]),
});

/**
 * One card transaction, narrowed to the list and the transaction detail sheet.
 *
 * The response also carries the provider card id, the MCC number, conversion and ECB rates, and
 * funding `txHash` / `address`. Those stay undeclared so Zod drops them before they reach the cache.
 * `merchantNameLocation` and a four-digit `panLast4` are already enough to identify a purchase; `transactionId`
 * is the processor reference the detail sheet copies.
 */
export const PayCardTransactionSchema = z.object({
  id: z.string().min(1),
  panLast4: z
    .string()
    .regex(/^\d{4}$/)
    .optional()
    .catch(undefined),
  transactionId: z.string().min(1).optional(),
  /** ISO 8601, as the provider formats it. */
  dateTime: z.string().min(1),
  sign: z.enum(["DEBIT", "CREDIT"]),
  merchantNameLocation: z.string().min(1),
  mccCategory: PayCardTransactionCategorySchema.catch("MISC"),
  status: z.enum(["CONFIRMED", "PENDING", "DECLINED", "REVERTED"]),
  /** The provider sends `""` on a transaction that was not declined, so an empty one is expected. */
  declineReason: z.string().optional(),
  transactionCurrency: z.string().min(1),
  amountInTransactionCurrency: z.string().min(1),
  feesInTransactionCurrency: z.string().min(1),
  /** What the merchant charged, when that differs from the card's own currency. */
  originalCurrency: z.string().min(1),
  amountInOriginalCurrency: z.string().min(1),
  fundingSources: z.array(PayCardTransactionFundingSourceSchema).optional(),
  cashback: PayCardTransactionCashbackSchema.optional().catch(undefined),
});

export const PayCardTransactionsResponseSchema = z.array(PayCardTransactionSchema);

const PayCardTransactionFilterFieldsSchema = z.object({
  searchKey: z.string().min(1).optional(),
  mccCategories: z.string().min(1).optional(),
});

/**
 * The provider requires `dateFrom` and `dateTo` together, so neither is useful alone: one without
 * the other is a filter the backend rejects.
 *
 * `page` is not here: it is the infinite query's page param, not a filter a caller passes.
 *
 * A union rather than a refinement, so the rule is in the inferred type as well: a caller cannot
 * write a filter that only fails once it is sent.
 */
const PayCardTransactionsFilterSchema = z.union(
  [
    PayCardTransactionFilterFieldsSchema.extend({
      dateFrom: z.string().min(1),
      dateTo: z.string().min(1),
    }),
    PayCardTransactionFilterFieldsSchema.extend({
      dateFrom: z.undefined().optional(),
      dateTo: z.undefined().optional(),
    }),
  ],
  { error: "dateFrom and dateTo go together" },
);

export const PayCardTransactionsRequestSchema = PayCardTransactionsFilterSchema.optional();

/**
 * What the transactions endpoint validates before a request goes out.
 *
 * An infinite query is handed the filters and the page it is reading as one pair, so the pair is
 * what `argSchema` sees — validating the filters alone would reject every request.
 *
 * `queryArg` is a union with `undefined` rather than an optional key: RTK Query always sends the
 * key, and a schema that makes it optional does not satisfy the type it is checked against.
 */
export const PayCardTransactionsPageRequestSchema = z.object({
  queryArg: z.union([PayCardTransactionsFilterSchema, z.undefined()]),
  pageParam: z.number().int().nonnegative(),
});

/**
 * One entry of a wallet's own history.
 *
 * Narrower than a card transaction: the movement arrives as one `name`, so whatever a card
 * transaction carries in its own fields has to be read out of that string here.
 *
 * `sign` is lowercase on this endpoint and uppercase on card transactions. Each schema keeps the
 * case its own endpoint answers with and rejects the other, so the difference stays visible to a
 * caller that reads both rather than being smoothed over here.
 */
export const PayCardWalletHistoryEntrySchema = z.object({
  /** The provider's own description, e.g. `Credit withdrawal` or `Card purchase - Starbucks`. */
  name: z.string().min(1),
  amount: z.string().min(1),
  currency: z.string().min(1),
  sign: z.enum(["debit", "credit"]),
  /** ISO 8601, as the provider formats it. */
  date: z.string().min(1),
});

export const PayCardWalletHistoryResponseSchema = z.array(PayCardWalletHistoryEntrySchema);

/**
 * A wallet's history is asked for one wallet at a time.
 *
 * `walletCurrency` is required for an internal wallet and meaningless for the others, so the pair
 * is checked here rather than left to a 400.
 */
const PayCardWalletHistoryBaseSchema = z.object({
  walletId: z.string().min(1),
  page: z.number().int().nonnegative().optional(),
});

/**
 * Keyed on the wallet type, so the currency requirement is in the inferred type as well: asking for
 * an internal wallet without naming its currency does not compile, let alone reach the provider.
 */
export const PayCardWalletHistoryRequestSchema = z.discriminatedUnion("walletType", [
  PayCardWalletHistoryBaseSchema.extend({
    walletType: z.literal("INTERNAL"),
    walletCurrency: z.string().min(1),
  }),
  PayCardWalletHistoryBaseSchema.extend({
    walletType: z.enum(["CREDIT", "REWARD"]),
    walletCurrency: z.string().min(1).optional(),
  }),
]);

export const PayCardInternalWalletSchema = z.object({
  id: z.string().min(1),
  balance: z.string().min(1),
  currency: z.string().min(1),
  address: z.string().min(1),
  // Nullish because a wallet with no memo answers with the key absent, others with `null`.
  addressMemo: z.string().min(1).nullish(),
  /**
   * Names the wallet for the link and unlink endpoints.
   *
   * Optional because the response is an array: one item missing the field would fail the whole
   * parse, so requiring it here would cost a caller every balance to protect a call it may never
   * make. {@link PayCardLinkWalletRequestSchema} requires it, which is where it is needed.
   */
  addressId: z.string().min(1).optional(),
});

export const PayCardInternalWalletsResponseSchema = z.array(PayCardInternalWalletSchema);

/**
 * Names one custodial wallet for the link and unlink endpoints, by the `addressId` the internal
 * wallets answer with. Not the wallet's `id`: the two agree on some wallets and not others.
 */
export const PayCardLinkWalletRequestSchema = z.object({
  addressId: z.string().min(1),
});

export const PayCardLinkWalletResponseSchema = z.object({
  success: z.boolean(),
});

export const PayCardLinkedWalletSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  currency: z.string().min(1),
  network: z.string().min(1),
  priority: z.number().finite(),
});

export const PayCardLinkedWalletsResponseSchema = z.array(PayCardLinkedWalletSchema);

/**
 * The cashback the card has earned so far, in the asset it is paid in, and the rate it earns at.
 *
 * Both stay strings for the same reason every other amount here does: a decimal that survived the
 * wire should not be rounded into a number on the way in.
 */
export const PayCardCashbackResponseSchema = z.object({
  amount: z.string().min(1),
  currency: z.string().min(1).nullish(),
  network: z.string().min(1).nullish(),
  ratePercent: z.string().min(1),
});

const PayCardWalletPrioritySchema = z.object({
  addressId: z.string().min(1),
  /**
   * Lower is charged first. Kept as loose as the linked wallet's own `priority`, so an order read
   * from the provider can be reordered and written back unchanged.
   */
  priority: z.number().finite(),
});

/**
 * The whole charging order, not one wallet: the priorities have to be unique across the set, so
 * they can only be decided together.
 */
export const PayCardWalletPrioritiesRequestSchema = z.object({
  wallets: z
    .array(PayCardWalletPrioritySchema)
    .min(1)
    .refine(wallets => new Set(wallets.map(wallet => wallet.priority)).size === wallets.length, {
      message: "each wallet needs a priority of its own",
    })
    .refine(wallets => new Set(wallets.map(wallet => wallet.addressId)).size === wallets.length, {
      message: "each wallet may be given a priority once",
    }),
});

export const PayCardWalletPrioritiesResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * The wire wallet plus the Ledger currency its `currency`/`network` pair resolves to. Optional
 * because the catalog does not cover every asset the provider may answer with.
 */
export const PayCardLinkedWalletCanonicalSchema = PayCardLinkedWalletSchema.extend({
  ledgerId: z.string().min(1).optional(),
});

export const PayCardLinkedWalletsCanonicalSchema = z.array(PayCardLinkedWalletCanonicalSchema);

/**
 * The wire cashback plus the Ledger currency its asset resolves to, so a consumer prices it the way
 * it prices a linked wallet. Optional for the same reason: the catalog does not cover every asset
 * the provider may pay cashback in.
 */
export const PayCardCashbackCanonicalSchema = PayCardCashbackResponseSchema.extend({
  ledgerId: z.string().min(1).optional(),
});

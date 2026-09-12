import { z } from "zod";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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
  orderedAt: z.string().min(1),
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
  /** Loaded straight into an image, so reject anything that is not an `https:` URL. */
  imageUrl: z
    .string()
    .url()
    .refine(value => value.startsWith("https://"), { message: "must be an https URL" }),
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

/**
 * One card transaction, narrowed to what a transaction list shows.
 *
 * The response carries more: the card and processor ids, the MCC number, the conversion and ECB
 * rates, and the funding sources behind each charge. None of it is displayed, and one field here is
 * already sensitive — `merchantNameLocation` says where the cardholder shopped — so the rest is
 * left undeclared and Zod drops it before it reaches the cache.
 */
export const PayCardTransactionSchema = z.object({
  id: z.string().min(1),
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
});

export const PayCardTransactionsResponseSchema = z.array(PayCardTransactionSchema);

const PayCardTransactionFiltersSchema = z.object({
  page: z.number().int().nonnegative().optional(),
  searchKey: z.string().min(1).optional(),
  mccCategories: z.string().min(1).optional(),
});

/**
 * The provider requires `dateFrom` and `dateTo` together, so neither is useful alone: one without
 * the other is a filter the backend rejects.
 *
 * A union rather than a refinement, so the rule is in the inferred type as well: a caller cannot
 * write a filter that only fails once it is sent.
 */
export const PayCardTransactionsRequestSchema = z
  .union(
    [
      PayCardTransactionFiltersSchema.extend({
        dateFrom: z.string().min(1),
        dateTo: z.string().min(1),
      }),
      PayCardTransactionFiltersSchema.extend({
        dateFrom: z.undefined().optional(),
        dateTo: z.undefined().optional(),
      }),
    ],
    { error: "dateFrom and dateTo go together" },
  )
  .optional();

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
});

export const PayCardInternalWalletsResponseSchema = z.array(PayCardInternalWalletSchema);

export const PayCardLinkedWalletSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  currency: z.string().min(1),
  network: z.string().min(1),
  priority: z.number().finite(),
});

export const PayCardLinkedWalletsResponseSchema = z.array(PayCardLinkedWalletSchema);

/** One onboarding step the card holder still has to complete, as the backend describes it. */
export const PayCardOnboardingStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  isDone: z.boolean(),
});

export const PayCardOnboardingStatusResponseSchema = z.object({
  steps: z.array(PayCardOnboardingStepSchema),
});

/**
 * The wire wallet plus the Ledger currency its `currency`/`network` pair resolves to. Optional
 * because the catalog does not cover every asset the provider may answer with.
 */
export const PayCardLinkedWalletCanonicalSchema = PayCardLinkedWalletSchema.extend({
  ledgerId: z.string().min(1).optional(),
});

export const PayCardLinkedWalletsCanonicalSchema = z.array(PayCardLinkedWalletCanonicalSchema);

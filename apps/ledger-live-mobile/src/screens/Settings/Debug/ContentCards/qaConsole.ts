import {
  GenericAwarenessModalLayout,
  isGenericAwarenessModalContentCardReady,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { isCategoryContentCardExtras } from "@ledgerhq/live-common/braze/contentCardExtras";
import {
  compareCards,
  dedupeCategoriesByCategoryId,
  filterByPage,
  filterByType,
  filterCardsThatHaveBeenDismissed,
  getMobileContentCards,
  mapAsAssetContentCard,
  mapAsCategoryContentCard,
  mapAsLandingPageStickyCtaContentCard,
  mapAsNotificationContentCard,
  mapAsWalletContentCard,
} from "~/dynamicContent/utils";
import {
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  LandingPageUseCase,
  type AllLocations,
  type BrazeContentCard,
  type CategoryContentCard,
  type ContentCardCommonProperties,
  type WalletContentCard,
} from "~/dynamicContent/types";
import type { DynamicContentState } from "~/reducers/types";
import type { GenericAwarenessModalState } from "~/reducers/genericAwarenessModal";

export const QA_CONSOLE_PLACEMENTS = [
  ContentCardLocation.TopWallet,
  ContentCardLocation.Wallet,
  ContentCardLocation.Asset,
  ContentCardLocation.MyLedger,
  ContentCardLocation.NotificationCenter,
  ContentCardLocation.LandingPageStickyCta,
  ContentCardLocation.GenericAwarenessModal,
] as const;

export type QaConsolePlacement = (typeof QA_CONSOLE_PLACEMENTS)[number];
export const FIXED_PLACEMENTS = new Set<QaConsolePlacement>([
  ContentCardLocation.TopWallet,
  ContentCardLocation.Wallet,
  ContentCardLocation.Asset,
  ContentCardLocation.MyLedger,
]);
export type VisibilityStatus = "Active" | "Blocked" | "Empty";

const LANDING_PAGE_USE_CASES = new Set<string>(Object.values(LandingPageUseCase));
export const isLandingPageUseCase = (value?: string): value is LandingPageUseCase =>
  value !== undefined && LANDING_PAGE_USE_CASES.has(value);

const PLACEMENT_LABELS: Record<QaConsolePlacement, string> = {
  [ContentCardLocation.TopWallet]: "Top wallet",
  [ContentCardLocation.Wallet]: "Wallet",
  [ContentCardLocation.Asset]: "Asset",
  [ContentCardLocation.MyLedger]: "My Ledger",
  [ContentCardLocation.NotificationCenter]: "Notification center",
  [ContentCardLocation.LandingPageStickyCta]: "Landing page sticky CTA",
  [ContentCardLocation.GenericAwarenessModal]: "Generic awareness modal",
};

export function getPlacementLabel(placement: QaConsolePlacement): string {
  return PLACEMENT_LABELS[placement] ?? placement;
}
const PLACEMENT_EXPLANATIONS: Record<QaConsolePlacement, string> = {
  [ContentCardLocation.TopWallet]:
    "Promo block near the top of the Wallet tab, above the accounts list. Category-driven: carousel, grid, or one big card.",
  [ContentCardLocation.Wallet]:
    'Horizontal swipe carousel under "For you" on the Wallet tab. Direct cards, no category involved.',
  [ContentCardLocation.Asset]:
    'Legacy single promo card in a coin\'s "Quick actions" section. Wallet v4 Asset Detail does not mount this placement.',
  [ContentCardLocation.MyLedger]:
    "Category blocks above the Bluetooth device list on the My Ledger choose-device screen. A real, always-mounted surface, just like Top wallet.",
  [ContentCardLocation.NotificationCenter]:
    "A row in the Notifications inbox (bell icon on the Wallet tab).",
  [ContentCardLocation.LandingPageStickyCta]:
    "Full-width button pinned to the bottom of a generic landing page.",
  [ContentCardLocation.GenericAwarenessModal]:
    "Bottom-sheet drawer over the Wallet tab: carousel, prompt, or feature intro. Opens on app start or via deeplink.",
};
const LANDING_PAGE_HINTS: Partial<Record<LandingPageUseCase, string>> = {
  [LandingPageUseCase.LP_Recover]: "recovering/backing up a seed phrase",
  [LandingPageUseCase.LP_Buy]: "buying crypto",
  [LandingPageUseCase.LP_Receive]: "receiving crypto",
  [LandingPageUseCase.LP_Swap]: "swapping crypto",
  [LandingPageUseCase.LP_Stake]: "staking",
  [LandingPageUseCase.LP_Earn]: "earning",
  [LandingPageUseCase.LP_Referral]: "the referral program",
  [LandingPageUseCase.LP_Shop]: "shopping for a Ledger device",
  [LandingPageUseCase.LP_Wallet_Connect]: "WalletConnect",
  [LandingPageUseCase.LP_Security_Key]: "the security key",
};
export function getLocationExplanation(location: string): string {
  if (location in PLACEMENT_EXPLANATIONS) {
    return PLACEMENT_EXPLANATIONS[location as QaConsolePlacement];
  }
  if (location === ContentCardLocation.Learn) {
    return 'Nothing renders this today - no screen mounts "Learn". Not a bug to chase.';
  }
  if (isLandingPageUseCase(location)) {
    const hint = LANDING_PAGE_HINTS[location as LandingPageUseCase];
    return `Category blocks on the ${
      hint ? `${hint} ` : ""
    }generic landing page (ledgerlive://landing-page?useCase=${location}).`;
  }
  return `Unrecognized location "${location}" - likely a typo in Braze.`;
}
const EXACT_BLOCKER_EXPLANATIONS: Record<string, string> = {
  "wrong platform":
    'This card\'s "platform" isn\'t "mobile", so it\'s dropped before any placement check.',
  "missing or invalid extras":
    'Missing "location" (and "type", unless this is a direct-render placement) - check Braze\'s custom key-value pairs.',
  "missing category child cards":
    'Category card is missing "cardsType" - Ledger Wallet can\'t render it without one.',
  "malformed Generic Awareness Modal card":
    'Missing "campaignId" - this slide is silently dropped from its modal.',
  "Category is present but has no eligible child cards":
    "No other card's \"categoryId\" key matches this category's id - confirm a child is live in Braze.",
  "No eligible child cards for this category":
    "No other card's \"categoryId\" key matches this category's id - confirm a child is live in Braze.",
  "sticky CTA missing a valid landingPage":
    'Missing (or invalid) "landingPage" - a sticky CTA only ever shows on the one landing page matching it exactly.',
  "asset placement not mounted in Wallet v4":
    "Asset content cards are parsed, but Wallet v4 Asset Detail does not render this placement. This is expected until product asks to wire it back.",
  "no displayable accounts on this device":
    "Portfolio falls back to the onboarding/empty state instead of mounting Top wallet or Wallet until this device has a displayable account (any non-token account, a token account with a balance, or any token account if Hide empty token accounts is off). Add or import an account to see this card.",
};
export function explainBlocker(blocker: string): string {
  if (blocker.startsWith("dismissed card id") || blocker.startsWith("Dismissed id")) {
    return 'Dismissed on this device, not a bug - use "Undismiss" or "Clear all dismissed ids" below.';
  }
  if (blocker.startsWith("unrecognized location")) {
    return 'This card\'s "location" matches nothing Ledger Wallet knows - likely a typo in Braze.';
  }
  return EXACT_BLOCKER_EXPLANATIONS[blocker] ?? blocker;
}

export type PlacementDiagnostic = {
  placement: QaConsolePlacement;
  status: VisibilityStatus;
  blockers: string[];
  eligibleCardIds: string[];
};

export type CardBuilderValues = {
  location: QaConsolePlacement | LandingPageUseCase;
  type: ContentCardsType;
  layout: ContentCardsLayout;
  id: string;
  categoryId: string;
  campaignId: string;
  /** Category shell title when it differs from the child card title (e.g. "Touchscreen offers"). */
  categoryTitle: string;
  title: string;
  description: string;
  mediaUrl: string;
  link: string;
  cta: string;
  order: string;
  extras: Record<string, string>;
  categoryCanvasName: string;
};

export type BuiltDebugCards = {
  category?: CategoryContentCard;
  cards: BrazeContentCard[];
  warnings: string[];
};

export type CardBuilderPreset =
  | "topWalletHero"
  | "topWalletHardwareCarousel"
  | "topWalletHeroCarousel"
  | "topWalletAction"
  | "walletCarousel"
  | "asset"
  | "myLedger"
  | "notification"
  | "landingPageCategory"
  | "landingPageStickyCta";

export type CardPipelineBuckets = {
  rawCards: BrazeContentCard[];
  filteredCards: BrazeContentCard[];
  mobileCards: BrazeContentCard[];
  parsed: {
    categories: CategoryContentCard[];
    wallet: ReturnType<typeof mapAsWalletContentCard>[];
    asset: ReturnType<typeof mapAsAssetContentCard>[];
    notificationCenter: ReturnType<typeof mapAsNotificationContentCard>[];
    landingPageStickyCta: ReturnType<typeof mapAsLandingPageStickyCtaContentCard>[];
  };
  genericAwarenessModal: {
    rawCards: BrazeContentCard[];
    storedCards: GenericAwarenessModalState["contentCards"];
  };
  local: {
    categories: CategoryContentCard[];
    mobileCards: BrazeContentCard[];
    walletCards: WalletContentCard[];
  };
};

type BuildBucketsInput = {
  dynamicContent: DynamicContentState;
  genericAwarenessModal: GenericAwarenessModalState;
  dismissedContentCards: Record<string, number>;
};
export const DEBUG_CARD_PREFIX = "debug-local-content-card";
export const DEBUG_CATEGORY_PREFIX = "debug-local-category";
const DEBUG_GAM_PREFIX = "debug-local-gam";
const TOP_WALLET_CATEGORY_ID = "alwayson";
const DEBUG_PRESET_LINK = "ledgerlive://market";
const LEDGER_IMAGE_URLS = [
  "https://ledger-wp-website-s3-prd.ledger.com/uploads/2026/04/card1.webp",
  "https://ledger-wp-website-s3-prd.ledger.com/uploads/2026/04/card2.webp",
  "https://ledger-wp-website-s3-prd.ledger.com/uploads/2026/04/phone-1.webp",
  "https://ledger-wp-website-s3-prd.ledger.com/uploads/2026/04/bg-mobile.webp",
];
const CATEGORY_PRESETS = new Set<CardBuilderPreset>([
  "topWalletHero",
  "topWalletHardwareCarousel",
  "topWalletHeroCarousel",
  "topWalletAction",
  "myLedger",
  "landingPageCategory",
]);

const HARDWARE_CAROUSEL_PRODUCTS = ["Ledger Stax", "Nano Pod", "Ledger Flex"] as const;

const uniq = <T>(values: T[]): T[] => Array.from(new Set(values));

/**
 * @deprecated Uses Math.random(), which is not cryptographically secure. Only ever
 * use this in debug/QA-only code paths (like this Content Cards QA console) - never
 * for anything security-sensitive.
 */
export function buildRandomLedgerImageUrl(): string {
  const randomIndex = Math.floor(Math.random() * LEDGER_IMAGE_URLS.length);
  const imageUrl = LEDGER_IMAGE_URLS[randomIndex];
  return `${imageUrl}?sig=${Date.now()}`;
}

export function buildDefaultCardBuilderValues(timestamp = Date.now()): CardBuilderValues {
  return {
    location: ContentCardLocation.TopWallet,
    type: ContentCardsType.hero,
    layout: ContentCardsLayout.unique,
    id: `${DEBUG_CARD_PREFIX}-${timestamp}`,
    categoryId: TOP_WALLET_CATEGORY_ID,
    campaignId: `${DEBUG_GAM_PREFIX}-${timestamp}`,
    categoryTitle: "",
    title: "QA debug card",
    description: "Local payload generated from the Content Cards QA console.",
    mediaUrl: buildRandomLedgerImageUrl(),
    link: DEBUG_PRESET_LINK,
    cta: "Open",
    order: "0",
    extras: {},
    categoryCanvasName: "",
  };
}
export function withFreshRandomMedia(values: CardBuilderValues): CardBuilderValues {
  const mediaUrl = buildRandomLedgerImageUrl();
  return {
    ...values,
    mediaUrl,
    extras: values.extras.image_background
      ? { ...values.extras, image_background: mediaUrl }
      : values.extras,
  };
}

function withPresetTrackingDefaults(
  preset: CardBuilderPreset,
  values: CardBuilderValues,
): CardBuilderValues {
  const trackingName = `qa_debug_${preset}`;
  return {
    ...values,
    categoryCanvasName: CATEGORY_PRESETS.has(preset) ? `${trackingName}_category` : "",
    extras: {
      ...values.extras,
      canvas_name: values.extras.canvas_name ?? trackingName,
      canvas_step_name: values.extras.canvas_step_name ?? `${trackingName}_step`,
    },
  };
}

export function buildPresetCardBuilderValues(
  preset: CardBuilderPreset,
  timestamp = Date.now(),
): CardBuilderValues {
  const base = buildDefaultCardBuilderValues(timestamp);

  switch (preset) {
    case "topWalletHardwareCarousel":
      return withPresetTrackingDefaults(preset, {
        ...base,
        type: ContentCardsType.smallSquare,
        layout: ContentCardsLayout.carousel,
        id: `${DEBUG_CARD_PREFIX}-top-wallet-hardware-${timestamp}`,
        categoryId: TOP_WALLET_CATEGORY_ID,
        categoryTitle: "Touchscreen offers",
        title: HARDWARE_CAROUSEL_PRODUCTS[0],
        description: "",
        cta: "",
        link: "",
        extras: { tag: "30% off" },
      });
    case "topWalletHeroCarousel":
      return withPresetTrackingDefaults(preset, {
        ...base,
        type: ContentCardsType.hero,
        layout: ContentCardsLayout.carousel,
        id: `${DEBUG_CARD_PREFIX}-top-wallet-hero-carousel-${timestamp}`,
        categoryId: TOP_WALLET_CATEGORY_ID,
        title: "Touchscreen offers",
        description: "",
        cta: "",
        link: "",
      });
    case "topWalletAction":
      return withPresetTrackingDefaults(preset, {
        ...base,
        type: ContentCardsType.action,
        layout: ContentCardsLayout.carousel,
        id: `${DEBUG_CARD_PREFIX}-top-wallet-action-${timestamp}`,
        categoryId: TOP_WALLET_CATEGORY_ID,
        title: "Buy crypto",
        description: "Buy crypto with card or bank transfer",
        extras: { icon: "Plus" },
      });
    case "walletCarousel":
      return withPresetTrackingDefaults(preset, {
        ...base,
        location: ContentCardLocation.Wallet,
        id: `${DEBUG_CARD_PREFIX}-wallet-${timestamp}`,
        title: "Wallet bottom carousel",
        description: "",
        extras: {
          tag: "Discover",
          image_background: base.mediaUrl,
          background: "purple",
        },
      });
    case "asset":
      return withPresetTrackingDefaults(preset, {
        ...base,
        location: ContentCardLocation.Asset,
        id: `${DEBUG_CARD_PREFIX}-asset-${timestamp}`,
        title: "Asset page card",
        description: "Visible on Bitcoin and Ethereum asset pages.",
        cta: "Open",
        extras: { assets: "bitcoin,ethereum" },
      });
    case "myLedger":
      return withPresetTrackingDefaults(preset, {
        ...base,
        location: ContentCardLocation.MyLedger,
        id: `${DEBUG_CARD_PREFIX}-my-ledger-${timestamp}`,
        categoryId: `${DEBUG_CATEGORY_PREFIX}-my-ledger-${timestamp}`,
        title: "My Ledger promo",
        description: "Local My Ledger category card.",
      });
    case "notification":
      return withPresetTrackingDefaults(preset, {
        ...base,
        location: ContentCardLocation.NotificationCenter,
        id: `${DEBUG_CARD_PREFIX}-notification-${timestamp}`,
        title: "Notification center card",
        description: "Local notification-center content card.",
        cta: "Open",
        extras: { tag: "Debug" },
      });
    case "landingPageCategory":
      return withPresetTrackingDefaults(preset, {
        ...base,
        location: LandingPageUseCase.LP_Stake,
        id: `${DEBUG_CARD_PREFIX}-landing-page-${timestamp}`,
        categoryId: `${DEBUG_CATEGORY_PREFIX}-landing-page-${timestamp}`,
        title: "Stake and Earn",
        description: "Local landing page category.",
      });
    case "landingPageStickyCta":
      return withPresetTrackingDefaults(preset, {
        ...base,
        location: ContentCardLocation.LandingPageStickyCta,
        id: `${DEBUG_CARD_PREFIX}-sticky-cta-${timestamp}`,
        title: "Landing sticky CTA",
        description: "Local landing page sticky CTA.",
        cta: "Start earning now",
        extras: { landingPage: LandingPageUseCase.LP_Stake },
      });
    case "topWalletHero":
    default:
      return withPresetTrackingDefaults("topWalletHero", {
        ...base,
        id: `${DEBUG_CARD_PREFIX}-top-wallet-hero-${timestamp}`,
        categoryId: TOP_WALLET_CATEGORY_ID,
        title: "Portfolio banner",
        description: "Local top-wallet hero content card.",
      });
  }
}

const DIRECT_CARD_LOCATIONS = new Set<string>([
  ContentCardLocation.Wallet,
  ContentCardLocation.Asset,
  ContentCardLocation.NotificationCenter,
  ContentCardLocation.LandingPageStickyCta,
]);
export type CardShape = "direct" | "category" | "categoryChild" | "gam";

export const CARD_SHAPE_LABELS: Record<CardShape, string> = {
  direct: "Direct card",
  category: "Category",
  categoryChild: "Category child",
  gam: "GAM campaign",
};
export function getLocationShape(location: string): CardShape {
  if (location === ContentCardLocation.GenericAwarenessModal) return "gam";
  return DIRECT_CARD_LOCATIONS.has(location) ? "direct" : "category";
}
export function getCardShape(card: BrazeContentCard): CardShape | undefined {
  if (card.extras?.location === ContentCardLocation.GenericAwarenessModal) return "gam";
  if (card.extras?.type === ContentCardsType.category) return "category";
  if (card.extras?.categoryId) return "categoryChild";
  if (card.extras?.location) return "direct";
  return undefined;
}

function isValidCategoryId(values: CardBuilderValues): boolean {
  return (
    DIRECT_CARD_LOCATIONS.has(values.location) ||
    values.categoryId.startsWith(DEBUG_CATEGORY_PREFIX) ||
    (values.location === ContentCardLocation.TopWallet &&
      values.categoryId === TOP_WALLET_CATEGORY_ID)
  );
}

function validateGenericAwarenessModalValues(values: CardBuilderValues): string[] {
  const warnings: string[] = [];

  if (!values.campaignId.startsWith(DEBUG_GAM_PREFIX)) {
    warnings.push(`Generic Awareness Modal campaign id should use ${DEBUG_GAM_PREFIX}-*`);
  }
  if (!Object.values(GenericAwarenessModalLayout).includes(values.layout as never)) {
    warnings.push("Generic Awareness Modal layout is unsupported");
  }

  return warnings;
}

export function validateBuilderValues(values: CardBuilderValues): string[] {
  const warnings: string[] = [];

  if (!values.id.startsWith(DEBUG_CARD_PREFIX)) {
    warnings.push(`Card id should use ${DEBUG_CARD_PREFIX}-*`);
  }
  if (!isValidCategoryId(values)) {
    warnings.push(
      `Category id should use ${DEBUG_CATEGORY_PREFIX}-* (or "${TOP_WALLET_CATEGORY_ID}" for Top wallet)`,
    );
  }
  if (values.location === ContentCardLocation.GenericAwarenessModal) {
    warnings.push(...validateGenericAwarenessModalValues(values));
  }
  if (Number.isNaN(Number(values.order))) {
    warnings.push("Invalid order");
  }
  if (values.layout !== ContentCardsLayout.unique && !values.categoryId) {
    warnings.push("Category-child mismatch");
  }
  if (!values.title && values.type !== ContentCardsType.category) {
    warnings.push("Missing title");
  }
  if (
    !values.mediaUrl &&
    [ContentCardsType.hero, ContentCardsType.bigSquare].includes(values.type)
  ) {
    warnings.push("Missing required media");
  }
  if (
    values.link &&
    !values.link.startsWith("ledgerlive://") &&
    !values.link.startsWith("https://")
  ) {
    warnings.push("Malformed or unsafe link");
  }

  return warnings;
}

function getDiagnosticStatus(
  eligibleCardIds: string[],
  blockers: string[],
  validationBlockers: string[] = [],
): VisibilityStatus {
  if (eligibleCardIds.length > 0 && validationBlockers.length === 0) return "Active";
  if (blockers.length > 0) return "Blocked";
  return "Empty";
}

function buildBrazeLikeCard(
  values: CardBuilderValues,
  id: string,
  isCategoryChild = false,
): BrazeContentCard {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return {
    id,
    created: nowInSeconds,
    viewed: false,
    extras: {
      platform: "mobile",
      ...(isCategoryChild
        ? { categoryId: values.categoryId }
        : { location: values.location, type: values.type }),
      order: values.order,
      title: values.title,
      description: values.description,
      secondaryText: values.description,
      image: values.mediaUrl,
      media: values.mediaUrl,
      cta: values.cta,
      link: values.link,
      ...values.extras,
      ...(values.location === ContentCardLocation.LandingPageStickyCta
        ? { landingPage: values.extras.landingPage ?? LandingPageUseCase.LP_Stake }
        : {}),
    },
  } as unknown as BrazeContentCard;
}

export function buildDebugContentCard(
  values: CardBuilderValues,
  addAnyway = false,
): BuiltDebugCards {
  const warnings = validateBuilderValues(values);
  if (warnings.length > 0 && !addAnyway) {
    return { cards: [], warnings };
  }

  if (DIRECT_CARD_LOCATIONS.has(values.location)) {
    return {
      cards: [buildBrazeLikeCard(values, values.id)],
      warnings,
    };
  }

  const category: CategoryContentCard = {
    id: `${values.categoryId}-category-${values.id}`,
    categoryId: values.categoryId,
    location: values.location as AllLocations,
    createdAt: Math.floor(Date.now() / 1000),
    viewed: false,
    order: Number(values.order),
    cardsLayout: values.layout,
    cardsType: values.type,
    type: ContentCardsType.category,
    title: values.categoryTitle.trim() || values.title,
    description: values.description,
    cta: values.cta,
    link: values.link,
    isDismissable: true,
    extras: {
      platform: "mobile",
      location: values.location,
      type: ContentCardsType.category,
      id: values.categoryId,
      cardsLayout: values.layout,
      cardsType: values.type,
      order: values.order,
      ...(values.categoryCanvasName ? { canvas_name: values.categoryCanvasName } : {}),
    },
  };

  return {
    category,
    cards: [buildBrazeLikeCard(values, values.id, true)],
    warnings,
  };
}
const isKnownLocation = (location?: AllLocations): boolean =>
  Boolean(location) &&
  (Object.values(ContentCardLocation).includes(location as ContentCardLocation) ||
    isLandingPageUseCase(location));

const getUnrecognizedLocationBlockers = (location?: AllLocations): string[] =>
  location && !isKnownLocation(location) ? [`unrecognized location: ${location}`] : [];
export const getExpectedScreenForLocation = (location?: AllLocations): string => {
  if (!location) return "Unknown";
  if (location === ContentCardLocation.TopWallet) return "Portfolio";
  if (location === ContentCardLocation.MyLedger) return "My Ledger";
  if (location === ContentCardLocation.Learn) return "Learn";
  if (isLandingPageUseCase(location)) {
    return `Landing page ${location}`;
  }
  return isKnownLocation(location) ? location : `Unrecognized location "${location}"`;
};

export const getDeeplinkForLocation = (location?: AllLocations): string | undefined => {
  if (!location) return undefined;
  if (location === ContentCardLocation.TopWallet) return "ledgerlive://portfolio";
  if (location === ContentCardLocation.Wallet) return "ledgerlive://portfolio";
  if (location === ContentCardLocation.Asset) return "ledgerlive://assets";
  if (location === ContentCardLocation.MyLedger) return "ledgerlive://myledger";
  if (isLandingPageUseCase(location)) {
    return `ledgerlive://landing-page?useCase=${location}`;
  }
  return undefined;
};
export function getCardOpenLink(
  card: BrazeContentCard,
  placement?: AllLocations,
): string | undefined {
  const shape = getCardShape(card);

  if (shape === "gam") {
    const campaignId = card.extras.campaignId;
    if (campaignId && !campaignId.toLowerCase().startsWith("app_start")) {
      return `ledgerlive://generic-awareness-modal?id=${encodeURIComponent(campaignId)}`;
    }
    return card.extras.primaryButtonLink;
  }

  if (card.extras.location === ContentCardLocation.LandingPageStickyCta) {
    return getDeeplinkForLocation(card.extras.landingPage as AllLocations) ?? card.extras.link;
  }

  const location = placement ?? (card.extras.location as AllLocations | undefined);
  const placementDeeplink = getDeeplinkForLocation(location);
  if (placementDeeplink) return placementDeeplink;

  if (shape === "categoryChild" && card.extras.categoryId === TOP_WALLET_CATEGORY_ID) {
    return getDeeplinkForLocation(ContentCardLocation.TopWallet);
  }
  if (shape === "category") return getDeeplinkForLocation(card.extras.location as AllLocations);
  return card.extras.link;
}

function getDirectCardEligibleCardIds(
  placement: QaConsolePlacement,
  buckets: CardPipelineBuckets,
): string[] {
  const directCardIds = buckets.mobileCards
    .concat(buckets.local.mobileCards)
    .filter(card => card.extras.location === placement)
    .filter(card => !isCategoryContentCardExtras(card.extras))
    .filter(card => getCardValidationBlockers([card]).length === 0)
    .map(card => card.id);

  if (placement === ContentCardLocation.Wallet) {
    return directCardIds.concat(buckets.local.walletCards.map(card => card.id));
  }
  return directCardIds;
}

function getGenericAwarenessModalEligibleCardIds(
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
): string[] {
  return buckets.genericAwarenessModal.storedCards
    .filter(isGenericAwarenessModalContentCardReady)
    .filter(card => !dismissedContentCards[card.id])
    .map(card => card.id);
}

function getDirectPlacementEligibleCardIds(
  placement: QaConsolePlacement,
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
): string[] {
  if (placement === ContentCardLocation.Asset) {
    // Asset cards are parsed but Wallet v4 doesn't mount this placement; see `placementBlockers`.
    return [];
  }
  if (placement === ContentCardLocation.GenericAwarenessModal) {
    return getGenericAwarenessModalEligibleCardIds(buckets, dismissedContentCards);
  }
  return getDirectCardEligibleCardIds(placement, buckets);
}

const parseAndSort = <T extends ContentCardCommonProperties>(
  cards: BrazeContentCard[],
  mapper: (card: BrazeContentCard) => T,
): T[] => cards.map(mapper).sort(compareCards);

export function buildCardPipelineBuckets({
  dynamicContent,
  genericAwarenessModal,
  dismissedContentCards,
}: BuildBucketsInput): CardPipelineBuckets {
  const dismissedIds = Object.keys(dismissedContentCards);
  const rawCards = dynamicContent.mobileCards;
  const filteredCards = filterCardsThatHaveBeenDismissed(rawCards, dismissedIds);
  const mobileCards = getMobileContentCards(filteredCards);
  const genericRawCards = filterByPage(mobileCards, ContentCardLocation.GenericAwarenessModal);

  return {
    rawCards,
    filteredCards,
    mobileCards,
    parsed: {
      categories: parseAndSort(
        filterByType(mobileCards, ContentCardsType.category),
        mapAsCategoryContentCard,
      ),
      wallet: parseAndSort(
        filterByPage(mobileCards, ContentCardLocation.Wallet),
        mapAsWalletContentCard,
      ),
      asset: parseAndSort(
        filterByPage(mobileCards, ContentCardLocation.Asset),
        mapAsAssetContentCard,
      ),
      notificationCenter: parseAndSort(
        filterByPage(mobileCards, ContentCardLocation.NotificationCenter),
        mapAsNotificationContentCard,
      ),
      landingPageStickyCta: filterByPage(mobileCards, ContentCardLocation.LandingPageStickyCta)
        .map(mapAsLandingPageStickyCtaContentCard)
        .sort((a, b) => b.createdAt - a.createdAt),
    },
    genericAwarenessModal: {
      rawCards: genericRawCards,
      storedCards: genericAwarenessModal.contentCards,
    },
    local: {
      categories: dynamicContent.localCategoriesCards,
      mobileCards: dynamicContent.localMobileCards,
      walletCards: dynamicContent.localWalletCards,
    },
  };
}
export function findUnmappedCards(buckets: CardPipelineBuckets): BrazeContentCard[] {
  const accountedIds = new Set<string>([
    ...buckets.parsed.categories.map(card => card.id),
    ...buckets.parsed.wallet.map(card => card.id),
    ...buckets.parsed.asset.map(card => card.id),
    ...buckets.parsed.notificationCenter.map(card => card.id),
    ...buckets.parsed.landingPageStickyCta.map(card => card.id),
    ...buckets.genericAwarenessModal.rawCards.map(card => card.id),
  ]);
  const knownCategoryIds = new Set(
    [...buckets.parsed.categories, ...buckets.local.categories]
      .map(category => category.categoryId)
      .filter((id): id is string => Boolean(id)),
  );
  return buckets.filteredCards.filter(
    card =>
      !accountedIds.has(card.id) &&
      !(card.extras.categoryId && knownCategoryIds.has(card.extras.categoryId)),
  );
}
export function explainOrphanCard(card: BrazeContentCard): string {
  if (card.extras.platform && card.extras.platform !== "mobile") {
    return `Wrong platform ("${card.extras.platform}") - Ledger Wallet drops this before it ever reaches a placement check.`;
  }
  if (card.extras.categoryId) {
    return `Has categoryId "${card.extras.categoryId}", but no live category card advertises that id - dangling reference (deleted, renamed, or never existed in Braze).`;
  }
  const blockers = getCardValidationBlockers([card]);
  if (blockers.length > 0) return explainBlocker(blockers[0]);
  return 'Passes every per-card check individually, but matches no known placement, category, or Generic Awareness Modal - double-check "location"/"type"/"categoryId" against dynamicContent/README.md.';
}

// GAM slides are dismissed by campaignId (the whole modal), not their own card id.
export const getDismissalKey = (card: BrazeContentCard): string | undefined =>
  card.extras.location === ContentCardLocation.GenericAwarenessModal
    ? card.extras.campaignId
    : card.id;

const getDismissedBlockers = (
  cards: BrazeContentCard[],
  dismissedContentCards: Record<string, number>,
): string[] =>
  cards
    .map(getDismissalKey)
    .filter((id): id is string => Boolean(id && dismissedContentCards[id]))
    .map(id => `dismissed card id: ${id}`);

const getDismissedIdsBlockers = (
  ids: string[],
  dismissedContentCards: Record<string, number>,
): string[] =>
  ids.filter(id => Boolean(dismissedContentCards[id])).map(id => `dismissed card id: ${id}`);

const LOCATIONS_WHERE_TYPE_IS_OPTIONAL = new Set<string>([
  ...DIRECT_CARD_LOCATIONS,
  ContentCardLocation.GenericAwarenessModal,
]);

const getCardValidationBlockers = (cards: BrazeContentCard[]): string[] =>
  cards.flatMap(card => {
    const blockers: string[] = [];
    if (card.extras.platform && card.extras.platform !== "mobile") blockers.push("wrong platform");
    const needsType = !LOCATIONS_WHERE_TYPE_IS_OPTIONAL.has(card.extras.location as string);
    if (!card.extras.location || (needsType && !card.extras.type)) {
      blockers.push("missing or invalid extras");
    } else {
      blockers.push(...getUnrecognizedLocationBlockers(card.extras.location as AllLocations));
    }
    if (card.extras.type === ContentCardsType.category && !card.extras.cardsType) {
      blockers.push("missing category child cards");
    }
    if (
      card.extras.location === ContentCardLocation.GenericAwarenessModal &&
      !card.extras.campaignId
    ) {
      blockers.push("malformed Generic Awareness Modal card");
    }
    if (
      card.extras.location === ContentCardLocation.LandingPageStickyCta &&
      !isLandingPageUseCase(card.extras.landingPage)
    ) {
      blockers.push("sticky CTA missing a valid landingPage");
    }
    return blockers;
  });

const ACCOUNT_GATED_PLACEMENTS = new Set<QaConsolePlacement>([
  ContentCardLocation.TopWallet,
  ContentCardLocation.Wallet,
]);

export function buildPlacementDiagnostics(
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
  hasDisplayableAccounts = true,
): PlacementDiagnostic[] {
  const rawAndLocal = buckets.rawCards.concat(buckets.local.mobileCards);

  return QA_CONSOLE_PLACEMENTS.map(placement => {
    const candidateCards = rawAndLocal.filter(card => card.extras.location === placement);
    const storedGenericAwarenessModalIds =
      placement === ContentCardLocation.GenericAwarenessModal
        ? buckets.genericAwarenessModal.storedCards.map(card => card.id)
        : [];
    const dismissedBlockers = getDismissedBlockers(candidateCards, dismissedContentCards).concat(
      getDismissedIdsBlockers(storedGenericAwarenessModalIds, dismissedContentCards),
    );
    const validationBlockers = getCardValidationBlockers(candidateCards);
    const placementBlockers =
      placement === ContentCardLocation.Asset && candidateCards.length > 0
        ? ["asset placement not mounted in Wallet v4"]
        : [];

    let eligibleCardIds: string[];
    const categoryBlockers: string[] = [];

    if (getLocationShape(placement) === "category") {
      eligibleCardIds = getCategoryLocationEligibleCardIds(placement, buckets);
      const categoryCount = buckets.parsed.categories
        .concat(buckets.local.categories)
        .filter(category => category.location === placement).length;
      if (eligibleCardIds.length === 0 && validationBlockers.length === 0 && categoryCount > 0) {
        categoryBlockers.push("No eligible child cards for this category");
      }
    } else {
      eligibleCardIds = getDirectPlacementEligibleCardIds(
        placement,
        buckets,
        dismissedContentCards,
      );
    }

    // Wallet/Top wallet never mount on the Portfolio screen without a displayable account,
    // regardless of how well-formed their cards are - see PortfolioScreen's `showAssets` gate.
    const accountBlockers =
      ACCOUNT_GATED_PLACEMENTS.has(placement) &&
      !hasDisplayableAccounts &&
      eligibleCardIds.length > 0
        ? ["no displayable accounts on this device"]
        : [];
    if (accountBlockers.length > 0) eligibleCardIds = [];

    const blockers = Array.from(
      new Set([
        ...dismissedBlockers,
        ...validationBlockers,
        ...placementBlockers,
        ...categoryBlockers,
        ...accountBlockers,
      ]),
    );
    const status = getDiagnosticStatus(eligibleCardIds, blockers);

    return {
      placement,
      status,
      blockers,
      eligibleCardIds,
    };
  });
}

const getCardsForCategory = (
  category: CategoryContentCard,
  mobileCards: BrazeContentCard[],
): BrazeContentCard[] => mobileCards.filter(card => card.extras.categoryId === category.categoryId);
const getCategoryLocationEligibleCardIds = (
  location: AllLocations,
  buckets: CardPipelineBuckets,
): string[] =>
  uniq([
    ...dedupeCategoriesByCategoryId(
      buckets.parsed.categories.filter(category => category.location === location),
    ).flatMap(category => getCardsForCategory(category, buckets.mobileCards).map(card => card.id)),
    ...dedupeCategoriesByCategoryId(
      buckets.local.categories.filter(category => category.location === location),
    ).flatMap(category =>
      getCardsForCategory(category, buckets.local.mobileCards).map(card => card.id),
    ),
  ]);
const LOCAL_LOOKUP_FLAT_LOCATIONS = new Set<string>([
  ...DIRECT_CARD_LOCATIONS,
  ContentCardLocation.GenericAwarenessModal,
]);
export function getLocalCardsForLocation(
  location: string,
  localCards: BrazeContentCard[],
  localCategories: CategoryContentCard[],
): BrazeContentCard[] {
  if (LOCAL_LOOKUP_FLAT_LOCATIONS.has(location)) {
    return localCards.filter(card => card.extras.location === location);
  }
  const categoryIds = new Set(
    localCategories
      .filter(category => category.location === location)
      .map(category => category.categoryId),
  );
  return localCards.filter(
    card => card.extras.categoryId && categoryIds.has(card.extras.categoryId as string),
  );
}
function getGenericAwarenessModalCardTitle(
  card: GenericAwarenessModalState["contentCards"][number],
): string {
  if (card.layout === GenericAwarenessModalLayout.Carousel) return card.data[0]?.title ?? "";
  return card.title ?? "";
}

export function getLocalGenericAwarenessModalCardsAsBrazeLike(
  storedCards: GenericAwarenessModalState["contentCards"],
): BrazeContentCard[] {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return storedCards
    .filter(card => card.isLocal)
    .map(
      card =>
        ({
          id: card.id,
          created: nowInSeconds,
          viewed: false,
          extras: {
            location: ContentCardLocation.GenericAwarenessModal,
            campaignId: card.id,
            layout: card.layout,
            title: getGenericAwarenessModalCardTitle(card),
          },
        }) as unknown as BrazeContentCard,
    );
}

export type OtherCategoryDiagnostic = {
  location: string;
  label: string;
  status: VisibilityStatus;
  blockers: string[];
  eligibleCardIds: string[];
  categoryCount: number;
};
function buildCategoryLocationDiagnostic(
  location: AllLocations,
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
  allCategories: CategoryContentCard[],
  rawAndLocal: BrazeContentCard[],
): OtherCategoryDiagnostic {
  const categoryCards = rawAndLocal.filter(
    card => card.extras.location === location && card.extras.type === ContentCardsType.category,
  );
  const dismissedBlockers = getDismissedBlockers(categoryCards, dismissedContentCards);
  const validationBlockers = getCardValidationBlockers(categoryCards);
  const eligibleCardIds = getCategoryLocationEligibleCardIds(location, buckets);
  const categoryCount = allCategories.filter(category => category.location === location).length;
  const categoryBlockers =
    eligibleCardIds.length === 0 && validationBlockers.length === 0 && categoryCount > 0
      ? ["No eligible child cards for this category"]
      : [];
  const blockers = Array.from(
    new Set([...dismissedBlockers, ...validationBlockers, ...categoryBlockers]),
  );
  const status = getDiagnosticStatus(eligibleCardIds, blockers, validationBlockers);

  return {
    location,
    label: getExpectedScreenForLocation(location),
    status,
    blockers,
    eligibleCardIds,
    categoryCount,
  };
}
export function buildOtherCategoryDiagnostics(
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
): OtherCategoryDiagnostic[] {
  const allCategories = [...buckets.parsed.categories, ...buckets.local.categories];
  const rawAndLocal = buckets.rawCards.concat(buckets.local.mobileCards);

  const otherLocations = Array.from(
    new Set(
      allCategories
        .map(category => category.location)
        .filter(
          (location): location is AllLocations =>
            Boolean(location) &&
            location !== ContentCardLocation.TopWallet &&
            location !== ContentCardLocation.MyLedger &&
            !isLandingPageUseCase(location),
        ),
    ),
  );

  return otherLocations
    .map(location =>
      buildCategoryLocationDiagnostic(
        location,
        buckets,
        dismissedContentCards,
        allCategories,
        rawAndLocal,
      ),
    )
    .sort((a, b) => a.label.localeCompare(b.label));
}
export function buildLandingPageCategoryDiagnostic(
  location: LandingPageUseCase,
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
): OtherCategoryDiagnostic {
  const allCategories = [...buckets.parsed.categories, ...buckets.local.categories];
  const rawAndLocal = buckets.rawCards.concat(buckets.local.mobileCards);
  return buildCategoryLocationDiagnostic(
    location,
    buckets,
    dismissedContentCards,
    allCategories,
    rawAndLocal,
  );
}

export type LandingPageStickyCtaDiagnostic = {
  status: VisibilityStatus;
  blockers: string[];
  eligibleCardIds: string[];
};
export function buildLandingPageStickyCtaDiagnostic(
  location: LandingPageUseCase,
  buckets: CardPipelineBuckets,
  dismissedContentCards: Record<string, number>,
): LandingPageStickyCtaDiagnostic {
  const isPinnedHere = (card: BrazeContentCard) =>
    card.extras.location === ContentCardLocation.LandingPageStickyCta &&
    card.extras.landingPage === location;

  const rawAndLocal = buckets.rawCards.concat(buckets.local.mobileCards);
  const candidateCards = rawAndLocal.filter(isPinnedHere);
  const dismissedBlockers = getDismissedBlockers(candidateCards, dismissedContentCards);
  const validationBlockers = getCardValidationBlockers(candidateCards);
  const eligibleCardIds = buckets.mobileCards
    .concat(buckets.local.mobileCards)
    .filter(isPinnedHere)
    .filter(card => getCardValidationBlockers([card]).length === 0)
    .map(card => card.id);

  const blockers = Array.from(new Set([...dismissedBlockers, ...validationBlockers]));
  const status = getDiagnosticStatus(eligibleCardIds, blockers);

  return { status, blockers, eligibleCardIds };
}
export function buildLandingPageCategoryCounts(
  buckets: CardPipelineBuckets,
): Record<LandingPageUseCase, number> {
  return Object.fromEntries(
    Object.values(LandingPageUseCase).map(useCase => [
      useCase,
      getCategoryLocationEligibleCardIds(useCase, buckets).length,
    ]),
  ) as Record<LandingPageUseCase, number>;
}

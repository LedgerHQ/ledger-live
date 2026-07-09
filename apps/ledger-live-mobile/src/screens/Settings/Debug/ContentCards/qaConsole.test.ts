import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  buildCardPipelineBuckets,
  buildDebugContentCard,
  buildDefaultCardBuilderValues,
  buildLandingPageCategoryCounts,
  buildLandingPageCategoryDiagnostic,
  buildOtherCategoryDiagnostics,
  buildPresetCardBuilderValues,
  buildPlacementDiagnostics,
  explainBlocker,
  explainOrphanCard,
  findUnmappedCards,
  getCardOpenLink,
  getCardShape,
  getLocalCardsForLocation,
  getLocalGenericAwarenessModalCardsAsBrazeLike,
  getLocationExplanation,
  getLocationShape,
  withFreshRandomMedia,
} from "./qaConsole";
import {
  ContentCardLocation,
  ContentCardsLayout,
  LandingPageUseCase,
} from "~/dynamicContent/types";
import type { BrazeContentCard } from "~/dynamicContent/types";
import type { DynamicContentState } from "~/reducers/types";
import type { GenericAwarenessModalState } from "~/reducers/genericAwarenessModal";

const emptyDynamicContent: DynamicContentState = {
  assetsCards: [],
  walletCards: [],
  notificationCards: [],
  landingPageStickyCtaCards: [],
  categoriesCards: [],
  mobileCards: [],
  isLoading: false,
  localCategoriesCards: [],
  localMobileCards: [],
  localWalletCards: [],
};

const emptyGenericAwarenessModal: GenericAwarenessModalState = {
  isOpen: false,
  campaignId: undefined,
  contentCards: [],
};

const brazeCard = (id: string, extras: Record<string, string>): BrazeContentCard =>
  ({
    id,
    created: 123,
    viewed: false,
    extras,
  }) as unknown as BrazeContentCard;

const placementOrder = (diagnostics: ReturnType<typeof buildPlacementDiagnostics>) =>
  diagnostics.map(d => d.placement);

describe("Content Cards QA console helpers", () => {
  it("should build a valid default debug payload with reserved ids", () => {
    const values = buildDefaultCardBuilderValues(1000);

    const result = buildDebugContentCard(values);

    expect(result.warnings).toEqual([]);
    expect(result.category?.categoryId).toBe("alwayson");
    expect(result.category?.extras).toMatchObject({
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      cardsLayout: ContentCardsLayout.unique,
    });
    expect(result.cards[0].id).toBe("debug-local-content-card-1000");
    expect(result.cards[0].extras).toMatchObject({
      platform: "mobile",
      categoryId: "alwayson",
    });
    expect(result.cards[0].extras).not.toHaveProperty("location");
    expect(result.cards[0].extras).not.toHaveProperty("type");
  });

  it("should stamp canvas_name on the category shell separately from the child's own canvas_name/canvas_step_name", () => {
    const values = {
      ...buildDefaultCardBuilderValues(1000),
      categoryCanvasName: "shell-canvas",
      extras: { ...buildDefaultCardBuilderValues(1000).extras, canvas_step_name: "child-step" },
    };

    const result = buildDebugContentCard(values);

    expect(result.category?.extras).toMatchObject({ canvas_name: "shell-canvas" });
    expect(result.cards[0].extras).not.toHaveProperty("canvas_name");
    expect(result.cards[0].extras).toMatchObject({ canvas_step_name: "child-step" });
  });

  it("should leave displayOnEveryAssets unset for asset presets unless QA explicitly enables it", () => {
    const values = buildPresetCardBuilderValues("asset", 1000);
    const result = buildDebugContentCard(values);

    expect(result.cards[0].extras).not.toHaveProperty("displayOnEveryAssets");
  });

  it("should omit categoryCanvasName from the shell entirely when left blank, rather than stamping an empty string", () => {
    const result = buildDebugContentCard(buildDefaultCardBuilderValues(1000));

    expect(result.category?.extras).not.toHaveProperty("canvas_name");
  });

  it("should give every builder preset default canvas tracking names", () => {
    const directPresets = [
      "walletCarousel",
      "asset",
      "notification",
      "landingPageStickyCta",
    ] as const;
    const categoryPresets = [
      "topWalletHero",
      "topWalletAction",
      "myLedger",
      "landingPageCategory",
    ] as const;

    for (const preset of directPresets) {
      const values = buildPresetCardBuilderValues(preset, 1000);
      const result = buildDebugContentCard(values);
      const trackingName = `qa_debug_${preset}`;

      expect(result.cards[0].extras).toMatchObject({
        canvas_name: trackingName,
        canvas_step_name: `${trackingName}_step`,
      });
      expect(values.categoryCanvasName).toBe("");
      expect(result.category).toBeUndefined();
    }

    for (const preset of categoryPresets) {
      const values = buildPresetCardBuilderValues(preset, 1000);
      const result = buildDebugContentCard(values);
      const trackingName = `qa_debug_${preset}`;

      expect(result.cards[0].extras).toMatchObject({
        canvas_name: trackingName,
        canvas_step_name: `${trackingName}_step`,
      });
      expect(result.category?.extras).toMatchObject({
        canvas_name: `${trackingName}_category`,
      });
    }
  });

  it("should give every Top wallet preset the same 'alwayson' category id, so they land under one category like prod", () => {
    const hero = buildDebugContentCard(buildPresetCardBuilderValues("topWalletHero", 1000));
    const action = buildDebugContentCard(buildPresetCardBuilderValues("topWalletAction", 2000));

    expect(hero.category?.categoryId).toBe("alwayson");
    expect(action.category?.categoryId).toBe("alwayson");
    expect(hero.warnings).toEqual([]);
    expect(action.warnings).toEqual([]);
  });

  it("should block invalid builder payloads unless add anyway is explicit", () => {
    const invalidValues = {
      ...buildDefaultCardBuilderValues(1000),
      id: "bad-id",
      link: "javascript:alert(1)",
      order: "not-a-number",
    };

    expect(buildDebugContentCard(invalidValues)).toMatchObject({
      cards: [],
      warnings: [
        "Card id should use debug-local-content-card-*",
        "Invalid order",
        "Malformed or unsafe link",
      ],
    });

    expect(buildDebugContentCard(invalidValues, true).cards).toHaveLength(1);
  });

  it("should report hidden placement diagnostics for dismissed cards", () => {
    const card = brazeCard("dismissed-card", {
      platform: "mobile",
      location: ContentCardLocation.Wallet,
      type: "hero",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [card],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: { "dismissed-card": 123 },
    });

    const walletDiagnostic = buildPlacementDiagnostics(buckets, {
      "dismissed-card": 123,
    }).find(diagnostic => diagnostic.placement === ContentCardLocation.Wallet);

    expect(walletDiagnostic).toMatchObject({
      status: "Blocked",
      blockers: ["dismissed card id: dismissed-card"],
      eligibleCardIds: [],
    });
  });

  it("should not report a placement as Active when its only cards are individually blocked", () => {
    const wrongPlatformCard = brazeCard("landing-cta-wrong-platform", {
      platform: "ios",
      location: ContentCardLocation.LandingPageStickyCta,
      type: "action",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [wrongPlatformCard],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.LandingPageStickyCta,
    );

    expect(diagnostic).toMatchObject({
      status: "Blocked",
      eligibleCardIds: [],
    });
    expect(diagnostic?.blockers).toContain("wrong platform");
  });

  it("should not require a 'type' extra for direct-render placements, since Ledger Wallet never reads it there", () => {
    const missingTypeCard = brazeCard("landing-cta-missing-type", {
      platform: "mobile",
      location: ContentCardLocation.LandingPageStickyCta,
      landingPage: "LP_Stake",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [missingTypeCard],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.LandingPageStickyCta,
    );

    expect(diagnostic).toMatchObject({
      status: "Active",
      eligibleCardIds: ["landing-cta-missing-type"],
    });
  });

  it("should count a locally-built (debug-builder) card as eligible, not just raw Braze ones", () => {
    const localCard = brazeCard("debug-local-content-card-notification", {
      platform: "mobile",
      location: ContentCardLocation.NotificationCenter,
      type: "hero",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, localMobileCards: [localCard] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.NotificationCenter,
    );

    expect(diagnostic).toMatchObject({
      status: "Active",
      eligibleCardIds: ["debug-local-content-card-notification"],
    });
  });

  it("should still require a 'type' extra for category-driven placements like Top wallet", () => {
    const missingTypeCategory = brazeCard("top-wallet-missing-type", {
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      id: "alwayson",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [missingTypeCategory],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.TopWallet,
    );

    expect(diagnostic).toMatchObject({ status: "Blocked", eligibleCardIds: [] });
    expect(diagnostic?.blockers).toContain("missing or invalid extras");
  });

  it("should report Top wallet as Active when its category has a real Braze-style child (no location/type of its own)", () => {
    const category = brazeCard("alwayson-category", {
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      type: "category",
      cardsType: "action",
      cardsLayout: ContentCardsLayout.carousel,
      id: "alwayson",
    });
    const child = brazeCard("child-card", {
      categoryId: "alwayson",
      title: "Spend crypto, stay secure",
    });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category, child] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.TopWallet,
    );

    expect(diagnostic).toMatchObject({ status: "Active", eligibleCardIds: ["child-card"] });
  });

  it("should promote my_ledger to a real fixed placement, category-driven exactly like Top wallet", () => {
    const category = brazeCard("my-ledger-category", {
      platform: "mobile",
      location: ContentCardLocation.MyLedger,
      type: "category",
      cardsType: "hero",
      cardsLayout: ContentCardsLayout.unique,
      id: "my-ledger-promo",
    });
    const child = brazeCard("my-ledger-child", {
      categoryId: "my-ledger-promo",
      title: "Pair a new device",
    });

    const emptyBuckets = buildCardPipelineBuckets({
      dynamicContent: emptyDynamicContent,
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });
    expect(
      buildPlacementDiagnostics(emptyBuckets, {}).find(
        d => d.placement === ContentCardLocation.MyLedger,
      ),
    ).toMatchObject({ status: "Empty", eligibleCardIds: [] });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category, child] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    expect(
      buildPlacementDiagnostics(buckets, {}).find(
        d => d.placement === ContentCardLocation.MyLedger,
      ),
    ).toMatchObject({ status: "Active", eligibleCardIds: ["my-ledger-child"] });
    expect(
      buildOtherCategoryDiagnostics(buckets, {}).some(
        d => d.location === ContentCardLocation.MyLedger,
      ),
    ).toBe(false);
  });

  it("should not multiply eligible card count when several category cards share the same categoryId", () => {
    const categoryOne = brazeCard("alwayson-category-1", {
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      type: "category",
      cardsType: "action",
      cardsLayout: ContentCardsLayout.carousel,
      id: "alwayson",
    });
    const categoryTwo = brazeCard("alwayson-category-2", {
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      type: "category",
      cardsType: "hero",
      cardsLayout: ContentCardsLayout.unique,
      id: "alwayson",
    });
    const children = ["child-1", "child-2", "child-3", "child-4"].map(id =>
      brazeCard(id, { categoryId: "alwayson", title: id }),
    );

    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [categoryOne, categoryTwo, ...children],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.TopWallet,
    );

    expect(diagnostic?.eligibleCardIds).toHaveLength(4);
    expect(diagnostic?.status).toBe("Active");
  });

  it("should report Top wallet as Blocked when alwayson has no live children", () => {
    const category = brazeCard("alwayson-category", {
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      type: "category",
      cardsType: "action",
      cardsLayout: ContentCardsLayout.carousel,
      id: "alwayson",
    });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.TopWallet,
    );

    expect(diagnostic).toMatchObject({
      status: "Blocked",
      eligibleCardIds: [],
      blockers: ["No eligible child cards for this category"],
    });
  });

  it("should flag only truly unmapped cards - unknown location, wrong platform - and spare category children and Braze-recognized ones", () => {
    const wellKnownCard = brazeCard("wallet-card", {
      platform: "mobile",
      location: ContentCardLocation.Wallet,
      type: "hero",
    });
    const unknownLocationCard = brazeCard("orphan-card", {
      platform: "mobile",
      location: "not_a_real_location",
      type: "hero",
    });
    const category = brazeCard("category-card", {
      platform: "mobile",
      location: ContentCardLocation.TopWallet,
      type: "category",
      cardsType: "action",
      cardsLayout: ContentCardsLayout.carousel,
      id: "Spend_USPs",
    });
    const childCard = brazeCard("child-card", {
      categoryId: "Spend_USPs",
      title: "Spend crypto, stay secure",
    });
    const wrongPlatformCard = brazeCard("ios-only-card", {
      platform: "ios",
      location: ContentCardLocation.Wallet,
      type: "hero",
    });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [wellKnownCard, unknownLocationCard, category, childCard, wrongPlatformCard],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    expect(findUnmappedCards(buckets).map(card => card.id)).toEqual([
      "orphan-card",
      "ios-only-card",
    ]);
  });

  it("should classify every card shape from the ubiquitous language, without mislabeling a Generic Awareness Modal slide as a direct card", () => {
    const gamSlide = brazeCard("gam-slide", {
      location: ContentCardLocation.GenericAwarenessModal,
      campaignId: "campaign-1",
    });
    const category = brazeCard("category-card", {
      location: ContentCardLocation.TopWallet,
      type: "category",
    });
    const categoryChild = brazeCard("child-card", { categoryId: "alwayson" });
    const directCard = brazeCard("wallet-card", { location: ContentCardLocation.Wallet });
    const orphanCard = brazeCard("orphan-card", {});

    expect(getCardShape(gamSlide)).toBe("gam");
    expect(getCardShape(category)).toBe("category");
    expect(getCardShape(categoryChild)).toBe("categoryChild");
    expect(getCardShape(directCard)).toBe("direct");
    expect(getCardShape(orphanCard)).toBeUndefined();
  });

  it("should classify locations into the same shapes as cards", () => {
    expect(getLocationShape(ContentCardLocation.TopWallet)).toBe("category");
    expect(getLocationShape(ContentCardLocation.MyLedger)).toBe("category");
    expect(getLocationShape(LandingPageUseCase.LP_Stake)).toBe("category");
    expect(getLocationShape(ContentCardLocation.Wallet)).toBe("direct");
    expect(getLocationShape(ContentCardLocation.GenericAwarenessModal)).toBe("gam");
  });

  it("should explain each location in plain English, including where it's found in the app", () => {
    expect(getLocationExplanation(ContentCardLocation.TopWallet)).toMatch(/Wallet tab/);
    expect(getLocationExplanation(ContentCardLocation.Wallet)).toMatch(/For you/);
    expect(getLocationExplanation(ContentCardLocation.Asset)).toMatch(/Wallet v4 Asset Detail/);
    expect(getLocationExplanation(ContentCardLocation.Learn)).toMatch(/Nothing renders this today/);
    expect(getLocationExplanation(ContentCardLocation.MyLedger)).toMatch(/My Ledger/);
    expect(getLocationExplanation(LandingPageUseCase.LP_Stake)).toMatch(/staking/);
    expect(getLocationExplanation(LandingPageUseCase.LP_Stake)).toMatch(
      /ledgerlive:\/\/landing-page\?useCase=LP_Stake/,
    );
    expect(getLocationExplanation(LandingPageUseCase.LP_Generic3)).toMatch(
      /ledgerlive:\/\/landing-page\?useCase=LP_Generic3/,
    );
    expect(getLocationExplanation("not-a-real-location")).toMatch(/Unrecognized location/);
  });

  it("should explain known blocker codes in detailed, Braze-literate-not-required English and pass through unknown ones", () => {
    expect(explainBlocker("missing or invalid extras")).toMatch(/custom key-value pairs/);
    expect(explainBlocker("missing or invalid extras")).toMatch(/"type"/);
    expect(explainBlocker("Category is present but has no eligible child cards")).toMatch(
      /"categoryId" key matches/,
    );
    expect(explainBlocker("asset placement not mounted in Wallet v4")).toMatch(
      /Asset Detail does not render/,
    );
    expect(explainBlocker("some future blocker code")).toBe("some future blocker code");
  });

  it("should report Asset placement cards as blocked because Wallet v4 does not mount them", () => {
    const assetCard = brazeCard("asset-card", {
      platform: "mobile",
      location: ContentCardLocation.Asset,
      assets: "bitcoin",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [assetCard],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.Asset,
    );

    expect(diagnostic).toMatchObject({
      status: "Blocked",
      eligibleCardIds: [],
    });
    expect(diagnostic?.blockers).toContain("asset placement not mounted in Wallet v4");
  });

  it("should report Wallet as blocked when the device has no displayable accounts, even with a valid card", () => {
    const walletCard = brazeCard("wallet-card", {
      platform: "mobile",
      location: ContentCardLocation.Wallet,
      type: "hero",
    });
    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        mobileCards: [walletCard],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const withAccounts = buildPlacementDiagnostics(buckets, {}, true).find(
      d => d.placement === ContentCardLocation.Wallet,
    );
    const withoutAccounts = buildPlacementDiagnostics(buckets, {}, false).find(
      d => d.placement === ContentCardLocation.Wallet,
    );

    expect(withAccounts).toMatchObject({ status: "Active", eligibleCardIds: ["wallet-card"] });
    expect(withoutAccounts).toMatchObject({ status: "Blocked", eligibleCardIds: [] });
    expect(withoutAccounts?.blockers).toContain("no displayable accounts on this device");
  });

  it("should always return placement diagnostics in the same fixed order regardless of status", () => {
    const buckets = buildCardPipelineBuckets({
      dynamicContent: emptyDynamicContent,
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });
    const card = brazeCard("visible-card", {
      platform: "mobile",
      location: "wallet",
      type: "hero",
    });
    const walletBuckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [card] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    expect(placementOrder(buildPlacementDiagnostics(walletBuckets, {}))).toEqual(
      placementOrder(buildPlacementDiagnostics(buckets, {})),
    );
  });

  it("should diagnose a landing-page category location on demand, even though it has no fixed QA_CONSOLE_PLACEMENTS slot", () => {
    const category = brazeCard("spend-usps-category", {
      platform: "mobile",
      location: LandingPageUseCase.LP_Generic2,
      type: "category",
      cardsType: "action",
      cardsLayout: "carousel",
      id: "Spend_USPs",
    });
    const child = brazeCard("spend-usps-child", {
      categoryId: "Spend_USPs",
      title: "Spend crypto, stay secure",
    });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category, child] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });
    expect(
      buildLandingPageCategoryDiagnostic(LandingPageUseCase.LP_Generic2, buckets, {}),
    ).toMatchObject({
      location: LandingPageUseCase.LP_Generic2,
      label: `Landing page ${LandingPageUseCase.LP_Generic2}`,
      status: "Active",
      eligibleCardIds: ["spend-usps-child"],
      categoryCount: 1,
    });
  });

  it("should exclude landing-page category locations from Other categories, since they have their own dedicated Overview slot", () => {
    const category = brazeCard("spend-usps-category", {
      platform: "mobile",
      location: LandingPageUseCase.LP_Generic2,
      type: "category",
      cardsType: "action",
      cardsLayout: "carousel",
      id: "Spend_USPs",
    });
    const child = brazeCard("spend-usps-child", { categoryId: "Spend_USPs" });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category, child] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostics = buildOtherCategoryDiagnostics(buckets, {});

    expect(diagnostics.some(d => d.location === LandingPageUseCase.LP_Generic2)).toBe(false);
    expect(diagnostics.some(d => d.location === ContentCardLocation.TopWallet)).toBe(false);
  });

  it("should report a landing-page category location as Blocked when its category has no live children", () => {
    const category = brazeCard("stake-howto-category", {
      platform: "mobile",
      location: LandingPageUseCase.LP_Stake,
      type: "category",
      cardsType: "grid",
      cardsLayout: "grid",
      id: "Stake_HowTo",
    });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildLandingPageCategoryDiagnostic(LandingPageUseCase.LP_Stake, buckets, {});

    expect(diagnostic).toMatchObject({ status: "Blocked", eligibleCardIds: [] });
    expect(diagnostic.blockers).toContain("No eligible child cards for this category");
  });

  it("should not block a landing-page category location that has no category built for it yet", () => {
    const buckets = buildCardPipelineBuckets({
      dynamicContent: emptyDynamicContent,
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const diagnostic = buildLandingPageCategoryDiagnostic(LandingPageUseCase.LP_Buy, buckets, {});

    expect(diagnostic).toMatchObject({ status: "Empty", eligibleCardIds: [], categoryCount: 0 });
    expect(diagnostic.blockers).toEqual([]);
  });

  it("should treat a category with an unrecognized location as Blocked even when it has live children", () => {
    const category = brazeCard("typo-category", {
      platform: "mobile",
      location: "LP_Generix2",
      type: "category",
      cardsType: "action",
      cardsLayout: "carousel",
      id: "Spend_USPs",
    });
    const child = brazeCard("typo-child", {
      categoryId: "Spend_USPs",
      title: "Spend crypto, stay secure",
    });

    const buckets = buildCardPipelineBuckets({
      dynamicContent: { ...emptyDynamicContent, mobileCards: [category, child] },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const otherCategoryDiagnostic = buildOtherCategoryDiagnostics(buckets, {}).find(
      d => d.location === "LP_Generix2",
    );
    expect(otherCategoryDiagnostic).toMatchObject({ status: "Blocked" });
    expect(otherCategoryDiagnostic?.blockers).toContain("unrecognized location: LP_Generix2");
    expect(explainBlocker("unrecognized location: LP_Generix2")).toMatch(/typo/);
  });

  it("should build direct local card presets without category wrappers", () => {
    const assetPreset = buildPresetCardBuilderValues("asset", 1000);
    const stickyCtaPreset = buildPresetCardBuilderValues("landingPageStickyCta", 1000);
    const assetResult = buildDebugContentCard(assetPreset);

    expect(assetResult.category).toBeUndefined();
    expect(assetResult).toMatchObject({
      cards: [
        expect.objectContaining({
          id: "debug-local-content-card-asset-1000",
          extras: expect.objectContaining({
            location: ContentCardLocation.Asset,
            assets: "bitcoin,ethereum",
          }),
        }),
      ],
    });
    expect(buildDebugContentCard(stickyCtaPreset).cards[0].extras).toMatchObject({
      location: ContentCardLocation.LandingPageStickyCta,
      landingPage: LandingPageUseCase.LP_Stake,
    });
  });

  it("should build a myLedger preset as a category child at the my_ledger location, with its own categoryId (no reserved id like Top wallet's)", () => {
    const preset = buildPresetCardBuilderValues("myLedger", 1000);
    const result = buildDebugContentCard(preset);

    expect(result.category).toMatchObject({
      location: ContentCardLocation.MyLedger,
      categoryId: `debug-local-category-my-ledger-1000`,
    });
    expect(result.cards[0].extras).toMatchObject({
      categoryId: `debug-local-category-my-ledger-1000`,
    });
    expect(result.cards[0].extras).not.toHaveProperty("location");
  });

  it("should not let a sticky CTA's leftover default categoryId ('alwayson') masquerade as a Top wallet child", () => {
    const stickyCta = buildDebugContentCard(
      buildPresetCardBuilderValues("landingPageStickyCta", 1000),
    );
    const topWallet = buildDebugContentCard(buildPresetCardBuilderValues("topWalletHero", 2000));

    expect(stickyCta.cards[0].extras).not.toHaveProperty("categoryId");

    const buckets = buildCardPipelineBuckets({
      dynamicContent: {
        ...emptyDynamicContent,
        localCategoriesCards: topWallet.category ? [topWallet.category] : [],
        localMobileCards: [...stickyCta.cards, ...topWallet.cards],
      },
      genericAwarenessModal: emptyGenericAwarenessModal,
      dismissedContentCards: {},
    });

    const topWalletDiagnostic = buildPlacementDiagnostics(buckets, {}).find(
      d => d.placement === ContentCardLocation.TopWallet,
    );
    expect(topWalletDiagnostic?.eligibleCardIds).toEqual(topWallet.cards.map(card => card.id));
    expect(getCardShape(stickyCta.cards[0])).toBe("direct");
  });

  describe("getLocalCardsForLocation", () => {
    it("should find a local Generic Awareness Modal card by its flat extras.location, not by categoryId", () => {
      const gamCard = getLocalGenericAwarenessModalCardsAsBrazeLike([
        {
          id: "debug-local-gam-1",
          layout: GenericAwarenessModalLayout.Prompt,
          title: "Local GAM prompt",
          subtitle: "",
          primaryButtonLabel: "Go",
          primaryButtonLink: "ledgerlive://earn",
          isLocal: true,
        } as unknown as GenericAwarenessModalState["contentCards"][number],
      ]);

      const found = getLocalCardsForLocation(
        ContentCardLocation.GenericAwarenessModal,
        gamCard,
        [],
      );

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe("debug-local-gam-1");
    });

    it("should ignore non-local Generic Awareness Modal (Braze) campaigns", () => {
      const cards = getLocalGenericAwarenessModalCardsAsBrazeLike([
        {
          id: "braze-gam-1",
          layout: GenericAwarenessModalLayout.Prompt,
          title: "Braze prompt",
          subtitle: "",
          primaryButtonLabel: "Go",
          primaryButtonLink: "ledgerlive://earn",
        } as unknown as GenericAwarenessModalState["contentCards"][number],
      ]);

      expect(cards).toEqual([]);
    });
  });

  describe("orphan cards (for CRM)", () => {
    it("should surface a raw card with a bogus location as orphaned, rather than silently dropping it", () => {
      const bogusLocationCard = brazeCard("crm-bogus-location", {
        platform: "mobile",
        location: "crm_typo_location",
        type: "hero",
        title: "Misconfigured CRM campaign",
      });
      const buckets = buildCardPipelineBuckets({
        dynamicContent: { ...emptyDynamicContent, mobileCards: [bogusLocationCard] },
        genericAwarenessModal: emptyGenericAwarenessModal,
        dismissedContentCards: {},
      });

      const orphans = findUnmappedCards(buckets);
      expect(orphans.map(card => card.id)).toEqual(["crm-bogus-location"]);
      expect(explainOrphanCard(orphans[0])).toMatch(/unrecognized|typo/i);
    });

    it("should explain a wrong-platform orphan by its platform, not a generic message", () => {
      const wrongPlatformCard = brazeCard("crm-wrong-platform", {
        platform: "ios",
        location: ContentCardLocation.Wallet,
        type: "hero",
      });

      expect(explainOrphanCard(wrongPlatformCard)).toMatch(/Wrong platform \("ios"\)/);
    });

    it("should call out a dangling categoryId that matches no known category", () => {
      const danglingChild = brazeCard("crm-dangling-child", {
        platform: "mobile",
        categoryId: "category-that-does-not-exist",
        title: "Orphaned category child",
      });
      const buckets = buildCardPipelineBuckets({
        dynamicContent: { ...emptyDynamicContent, mobileCards: [danglingChild] },
        genericAwarenessModal: emptyGenericAwarenessModal,
        dismissedContentCards: {},
      });

      expect(findUnmappedCards(buckets).map(card => card.id)).toEqual(["crm-dangling-child"]);
      expect(explainOrphanCard(danglingChild)).toMatch(/dangling reference/);
      expect(explainOrphanCard(danglingChild)).toContain("category-that-does-not-exist");
    });

    it("should fall back to a generic explanation for a card whose location/type is individually valid but still matches nothing", () => {
      const nonsensicalCard = brazeCard("crm-nonsensical", {
        platform: "mobile",
        location: ContentCardLocation.TopWallet,
        type: "hero",
      });
      const buckets = buildCardPipelineBuckets({
        dynamicContent: { ...emptyDynamicContent, mobileCards: [nonsensicalCard] },
        genericAwarenessModal: emptyGenericAwarenessModal,
        dismissedContentCards: {},
      });

      expect(findUnmappedCards(buckets).map(card => card.id)).toEqual(["crm-nonsensical"]);
      expect(explainOrphanCard(nonsensicalCard)).toMatch(/matches no known placement/);
    });
  });

  describe("buildLandingPageCategoryCounts", () => {
    it("should count 0 for every landing page use case when nothing targets any of them", () => {
      const buckets = buildCardPipelineBuckets({
        dynamicContent: emptyDynamicContent,
        genericAwarenessModal: emptyGenericAwarenessModal,
        dismissedContentCards: {},
      });

      const counts = buildLandingPageCategoryCounts(buckets);

      expect(counts[LandingPageUseCase.LP_Buy]).toBe(0);
      expect(counts[LandingPageUseCase.LP_Stake]).toBe(0);
    });

    it("should count eligible children per use case, matching the use case's own Active status", () => {
      const category = brazeCard("buy-category", {
        platform: "mobile",
        location: LandingPageUseCase.LP_Buy,
        type: "category",
        cardsType: "action",
        cardsLayout: "carousel",
        id: "Buy_USPs",
      });
      const children = ["buy-child-1", "buy-child-2", "buy-child-3"].map(id =>
        brazeCard(id, { categoryId: "Buy_USPs", title: id }),
      );
      const buckets = buildCardPipelineBuckets({
        dynamicContent: { ...emptyDynamicContent, mobileCards: [category, ...children] },
        genericAwarenessModal: emptyGenericAwarenessModal,
        dismissedContentCards: {},
      });

      const counts = buildLandingPageCategoryCounts(buckets);

      expect(counts[LandingPageUseCase.LP_Buy]).toBe(3);
      expect(counts[LandingPageUseCase.LP_Stake]).toBe(0);
    });
  });

  describe("random default media images", () => {
    it("should build default cards with Ledger media urls and cache-buster signatures", () => {
      const values = buildDefaultCardBuilderValues(1000);

      expect(values.mediaUrl).toMatch(/^https:\/\/ledger-wp-website-s3-prd\.ledger\.com\//);
      expect(values.mediaUrl).toMatch(/\?sig=/);
    });

    it("should keep image_background in sync with refreshed media", () => {
      const base = buildPresetCardBuilderValues("walletCarousel", 1000);

      const next = withFreshRandomMedia(base);

      expect(next.mediaUrl).toMatch(/\?sig=/);
      expect(next.extras.image_background).toBe(next.mediaUrl);
    });
  });

  describe("getCardOpenLink", () => {
    it("should open a category's own location deeplink (e.g. a landing page)", () => {
      const category = brazeCard("stake-category", {
        platform: "mobile",
        location: LandingPageUseCase.LP_Stake,
        type: "category",
        id: "Stake_USPs",
      });
      expect(getCardOpenLink(category)).toBe("ledgerlive://landing-page?useCase=LP_Stake");
    });

    it("should open the one landing page a sticky CTA is pinned to, not its own CTA link", () => {
      const stickyCta = brazeCard("sticky-cta-stake", {
        platform: "mobile",
        location: ContentCardLocation.LandingPageStickyCta,
        landingPage: LandingPageUseCase.LP_Stake,
        link: "ledgerlive://market",
      });
      expect(getCardOpenLink(stickyCta)).toBe("ledgerlive://landing-page?useCase=LP_Stake");
    });

    it("should open a direct card's placement, not its own CTA link", () => {
      const walletCard = brazeCard("wallet-card", {
        platform: "mobile",
        location: ContentCardLocation.Wallet,
        link: "ledgerlive://discover",
      });
      const assetCard = brazeCard("asset-card", {
        platform: "mobile",
        location: ContentCardLocation.Asset,
        link: "ledgerlive://market",
      });

      expect(getCardOpenLink(walletCard)).toBe("ledgerlive://portfolio");
      expect(getCardOpenLink(assetCard)).toBe("ledgerlive://assets");
    });

    it("should open a category child's placement when the debug screen knows it", () => {
      const categoryChild = brazeCard("child-card", {
        categoryId: "debug-local-category-my-ledger",
        link: "ledgerlive://market",
      });
      expect(getCardOpenLink(categoryChild, ContentCardLocation.MyLedger)).toBe(
        "ledgerlive://myledger",
      );
    });

    it("should fall back to a category child's own link without placement context", () => {
      const categoryChild = brazeCard("child-card", {
        categoryId: "debug-local-category-my-ledger",
        link: "ledgerlive://myledger",
      });

      expect(getCardOpenLink(categoryChild)).toBe("ledgerlive://myledger");
    });

    it("should open the Portfolio host screen for a Top wallet category child", () => {
      const topWalletChild = brazeCard("top-wallet-child", {
        categoryId: "alwayson",
        link: "ledgerlive://myledger",
      });
      expect(getCardOpenLink(topWalletChild)).toBe("ledgerlive://portfolio");
    });

    it("should open a deeplink-triggered Generic Awareness Modal campaign by id, but fall back for app-start ones", () => {
      const deeplinkTriggered = brazeCard("gam-slide-1", {
        location: ContentCardLocation.GenericAwarenessModal,
        campaignId: "debug_generic_awareness_prompt",
      });
      const appStartTriggered = brazeCard("gam-slide-2", {
        location: ContentCardLocation.GenericAwarenessModal,
        campaignId: "app_start_debug_generic_awareness_prompt",
        primaryButtonLink: "ledgerlive://buy/bitcoin",
      });

      expect(getCardOpenLink(deeplinkTriggered)).toBe(
        "ledgerlive://generic-awareness-modal?id=debug_generic_awareness_prompt",
      );
      expect(getCardOpenLink(appStartTriggered)).toBe("ledgerlive://buy/bitcoin");
    });
  });
});

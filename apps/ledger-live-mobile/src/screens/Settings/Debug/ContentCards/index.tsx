import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { Box, Button as LumenButton } from "@ledgerhq/lumen-ui-rnative";
import useEnv from "@features/platform-env";

import { useToastsActions } from "~/actions/toast";
import {
  hasNonTokenAccountsSelector,
  hasTokenAccountsNotBlacklistedSelector,
  hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
} from "~/reducers/accounts";
import {
  addLocalContentCards,
  addLocalWalletCarouselCards,
  appendLocalContentCards,
  clearLocalContentCards,
} from "~/actions/dynamicContent";
import { clearDismissedContentCards, setDismissedDynamicCards } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import {
  buildDefaultGenericAwarenessModalFormValues,
  buildLocalGenericAwarenessModalContentCards,
  getDefaultGenericAwarenessModalCampaignId,
  type GenericAwarenessModalDebugFormValues,
  type GenericAwarenessModalDebugItem,
  type GenericAwarenessModalDebugLayout,
  type GenericAwarenessModalDebugTrigger,
} from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import {
  ContentCardLocation,
  LandingPageUseCase,
  type BrazeContentCard,
  type CategoryContentCard,
} from "~/dynamicContent/types";
import { dismissedContentCardsSelector, dismissedDynamicCardsSelector } from "~/reducers/settings";
import {
  appendGenericAwarenessModalContentCards,
  clearLocalGenericAwarenessModalContentCards,
} from "~/reducers/genericAwarenessModal";

import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { QaConsoleDetailSheet } from "./QaConsoleDetailSheet";
import {
  LandingPagesDetailContent,
  OverviewSection,
  PlacementDetailContent,
  type PlacementCardGroup,
  type PlacementCreateAction,
} from "./Overview";
import { CardsSection, CardDetailContent, cardRowTitle } from "./Inspect";
import {
  ALL_BUILDER_PRESETS,
  BUILDER_CATEGORY_TITLES,
  BuilderForm,
  CARDS_PER_PLACEMENT_SEED,
  PRESET_CATEGORY,
  type BuilderPreset,
  type BuilderCategory,
} from "./Builder";
import {
  GenericAwarenessModalFormContent,
  getGenericAwarenessModalFormTitleKey,
} from "./GenericAwarenessModalFormContent";
import {
  buildCardPipelineBuckets,
  buildDebugContentCard,
  buildDefaultCardBuilderValues,
  buildLandingPageCategoryCounts,
  buildLandingPageCategoryDiagnostic,
  buildLandingPageStickyCtaDiagnostic,
  buildOtherCategoryDiagnostics,
  buildPlacementDiagnostics,
  buildPresetCardBuilderValues,
  buildRandomLedgerImageUrl,
  getLocalCardsForLocation,
  getLocalGenericAwarenessModalCardsAsBrazeLike,
  withFreshRandomMedia,
  findUnmappedCards,
  getDismissalKey,
  getPlacementLabel,
  isLandingPageUseCase,
  type BuiltDebugCards,
  type CardBuilderValues,
  type OtherCategoryDiagnostic,
  type PlacementDiagnostic,
  type QaConsolePlacement,
} from "./qaConsole";

const FEATURE_INTRO_MAX_ITEMS = 3;

type QaTabId = "overview" | "inspect";

type QaTab = {
  id: QaTabId;
  label: string;
};

type DetailSheetState =
  | { type: "placement"; placement: QaConsolePlacement }
  | { type: "category"; location: string }
  | { type: "landingPages" }
  | { type: "builder"; category: BuilderCategory }
  | { type: "gam" };

const QA_TABS: QaTab[] = [
  { id: "overview", label: "Overview" },
  { id: "inspect", label: "Inspect" },
];

function getDetailSheetTitle({
  activeDetail,
  genericAwarenessForm,
  selectedPlacementDiagnostic,
  selectedCategoryDiagnostic,
  t,
}: {
  activeDetail?: DetailSheetState;
  genericAwarenessForm: GenericAwarenessModalDebugFormValues;
  selectedPlacementDiagnostic?: PlacementDiagnostic;
  selectedCategoryDiagnostic?: OtherCategoryDiagnostic;
  t: (key: string) => string;
}): string {
  switch (activeDetail?.type) {
    case "builder":
      return BUILDER_CATEGORY_TITLES[activeDetail.category];
    case "gam":
      return t(getGenericAwarenessModalFormTitleKey(genericAwarenessForm.layout));
    case "placement":
      return selectedPlacementDiagnostic
        ? getPlacementLabel(selectedPlacementDiagnostic.placement)
        : "";
    case "category":
      return selectedCategoryDiagnostic?.label ?? "";
    case "landingPages":
      return "Landing pages";
    default:
      return "";
  }
}

function getDetailSheetScrollResetKey({
  activeDetail,
  genericAwarenessForm,
  selectedPlacementDiagnostic,
  selectedCategoryDiagnostic,
  landingPageUseCase,
}: {
  activeDetail?: DetailSheetState;
  genericAwarenessForm: GenericAwarenessModalDebugFormValues;
  selectedPlacementDiagnostic?: PlacementDiagnostic;
  selectedCategoryDiagnostic?: OtherCategoryDiagnostic;
  landingPageUseCase: LandingPageUseCase;
}): string {
  let contentKey = "";
  switch (activeDetail?.type) {
    case "builder":
      contentKey = activeDetail.category;
      break;
    case "gam":
      contentKey = genericAwarenessForm.layout;
      break;
    case "placement":
      contentKey = selectedPlacementDiagnostic?.placement ?? "";
      break;
    case "category":
      contentKey = selectedCategoryDiagnostic?.location ?? "";
      break;
    case "landingPages":
      contentKey = landingPageUseCase;
      break;
  }

  return `${activeDetail?.type ?? "closed"}:${contentKey}`;
}

const buildDefaultItem = (index: number): GenericAwarenessModalDebugItem => ({
  title: `Step ${index + 1}`,
  subtitle: "Describe this step for QA.",
  imageUrlLight: buildRandomLedgerImageUrl(),
  imageUrlDark: "",
  primaryButtonLabel: "Continue",
  primaryButtonLink: "ledgerlive://earn",
  icon: "Info",
});

const GENERIC_AWARENESS_LAYOUT_LABELS: Record<GenericAwarenessModalLayout, string> = {
  [GenericAwarenessModalLayout.Carousel]: "Carousel",
  [GenericAwarenessModalLayout.Prompt]: "Prompt",
  [GenericAwarenessModalLayout.FeatureIntro]: "Feature intro",
};
const TOP_WALLET_CATEGORY_ID = "alwayson";

function buildCategoryGroup(
  category: CategoryContentCard,
  cards: BrazeContentCard[],
  isLocal: boolean,
): PlacementCardGroup | undefined {
  const children = cards.filter(card => card.extras.categoryId === category.categoryId);
  if (children.length === 0) return undefined;
  const categoryId = category.categoryId ?? category.id;
  return {
    id: `${isLocal ? "local" : "braze"}-${categoryId}`,
    title: `Card Category (${categoryId})`,
    subtitle: `${children.length} child card(s)`,
    cards: children.map(card => ({ card, isLocal })),
  };
}

function buildGenericAwarenessModalGroups(cards: BrazeContentCard[]): PlacementCardGroup[] {
  return Object.values(GenericAwarenessModalLayout)
    .map(layout => {
      const layoutCards = cards.filter(card => card.extras.layout === layout);
      if (layoutCards.length === 0) return undefined;
      return {
        id: `generic-awareness-modal-${layout}`,
        title: GENERIC_AWARENESS_LAYOUT_LABELS[layout],
        cards: layoutCards.map(card => ({ card, isLocal: true })),
      };
    })
    .filter((group): group is PlacementCardGroup => Boolean(group));
}

export default function DebugContentCards() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pushToast } = useToastsActions();
  const dynamicContent = useSelector(state => state.dynamicContent);
  const genericAwarenessModal = useSelector(state => state.genericAwarenessModal);
  const dismissedContentCards = useSelector(dismissedContentCardsSelector);
  const dismissedDynamicCards = useSelector(dismissedDynamicCardsSelector);
  const hasNonTokenAccounts = useSelector(hasNonTokenAccountsSelector);
  const hasTokenAccounts = useSelector(hasTokenAccountsNotBlacklistedSelector);
  const hasTokenAccountsWithPositiveBalance = useSelector(
    hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
  );
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  // Mirrors Portfolio's `showAssets`: Wallet/Top wallet never mount below this - the
  // screen falls back to the onboarding/empty state instead, regardless of card data.
  const hasDisplayableAccounts =
    hasNonTokenAccounts ||
    hasTokenAccountsWithPositiveBalance ||
    (!hideEmptyTokenAccount && hasTokenAccounts);
  const allDismissedContentCards = useMemo(
    () => ({
      ...dismissedContentCards,
      ...Object.fromEntries(
        dismissedDynamicCards.map(id => [id, dismissedContentCards[id] ?? Date.now()]),
      ),
    }),
    [dismissedContentCards, dismissedDynamicCards],
  );

  const [detailStack, setDetailStack] = useState<DetailSheetState[]>([]);
  const [landingPageUseCase, setLandingPageUseCase] = useState<LandingPageUseCase>(
    LandingPageUseCase.LP_Stake,
  );
  const [selectedRawCardId, setSelectedRawCardId] = useState<string | undefined>();
  const [builderValues, setBuilderValues] = useState<CardBuilderValues>(
    buildDefaultCardBuilderValues,
  );
  const [builderWarnings, setBuilderWarnings] = useState<string[]>([]);
  const [activeBuilderPreset, setActiveBuilderPreset] = useState<BuilderPreset | undefined>();
  const [genericAwarenessForm, setGenericAwarenessForm] =
    useState<GenericAwarenessModalDebugFormValues>(buildDefaultGenericAwarenessModalFormValues);
  const [activeTab, setActiveTab] = useState<QaTabId>("overview");
  const activeDetail = detailStack[detailStack.length - 1];

  const buckets = useMemo(
    () =>
      buildCardPipelineBuckets({
        dynamicContent,
        genericAwarenessModal,
        dismissedContentCards: allDismissedContentCards,
      }),
    [allDismissedContentCards, dynamicContent, genericAwarenessModal],
  );
  const placementDiagnostics = useMemo(
    () => buildPlacementDiagnostics(buckets, allDismissedContentCards, hasDisplayableAccounts),
    [buckets, allDismissedContentCards, hasDisplayableAccounts],
  );
  const otherCategoryDiagnostics = useMemo(
    () => buildOtherCategoryDiagnostics(buckets, allDismissedContentCards),
    [buckets, allDismissedContentCards],
  );
  const dismissedIds = Object.keys(allDismissedContentCards);

  const selectedPlacementDiagnostic = placementDiagnostics.find(
    diagnostic =>
      activeDetail?.type === "placement" && diagnostic.placement === activeDetail.placement,
  );
  const selectedCategoryDiagnostic = otherCategoryDiagnostics.find(
    diagnostic =>
      activeDetail?.type === "category" && diagnostic.location === activeDetail.location,
  );
  const landingPageCategoryDiagnostic = buildLandingPageCategoryDiagnostic(
    landingPageUseCase,
    buckets,
    allDismissedContentCards,
  );
  const landingPageStickyCtaDiagnostic = buildLandingPageStickyCtaDiagnostic(
    landingPageUseCase,
    buckets,
    allDismissedContentCards,
  );
  const landingPageCategoryCounts = useMemo(
    () => buildLandingPageCategoryCounts(buckets),
    [buckets],
  );
  const unmappedCards = findUnmappedCards(buckets);
  const localCards: BrazeContentCard[] = buckets.local.mobileCards.concat(
    buckets.local.walletCards.map(
      card =>
        ({
          id: card.id,
          created: card.createdAt,
          viewed: card.viewed,
          extras: card.extras ?? {},
        }) as unknown as BrazeContentCard,
    ),
    getLocalGenericAwarenessModalCardsAsBrazeLike(genericAwarenessModal.contentCards),
  );
  const getLocalCardsForPlacement = (location: string) =>
    getLocalCardsForLocation(location, localCards, buckets.local.categories);
  const getCardGroupsForPlacement = (location: string): PlacementCardGroup[] => {
    if (location === ContentCardLocation.LandingPageStickyCta) {
      const stickyCards = localCards.filter(
        card =>
          card.extras.location === ContentCardLocation.LandingPageStickyCta &&
          card.extras.landingPage === landingPageUseCase,
      );
      return stickyCards.length > 0
        ? [
            {
              id: `${location}-${landingPageUseCase}-cards`,
              title: "Cards",
              cards: stickyCards.map(card => ({ card, isLocal: true })),
            },
          ]
        : [];
    }

    if (location === ContentCardLocation.GenericAwarenessModal) {
      return buildGenericAwarenessModalGroups(getLocalCardsForPlacement(location));
    }

    if (
      location === ContentCardLocation.Wallet ||
      location === ContentCardLocation.Asset ||
      location === ContentCardLocation.NotificationCenter
    ) {
      const cards = getLocalCardsForPlacement(location);
      return cards.length > 0
        ? [
            {
              id: `${location}-cards`,
              title: "Cards",
              cards: cards.map(card => ({ card, isLocal: true })),
            },
          ]
        : [];
    }

    const categoryGroups = [
      ...buckets.parsed.categories
        .filter(category => category.location === location)
        .map(category => buildCategoryGroup(category, buckets.mobileCards, false)),
      ...buckets.local.categories
        .filter(category => category.location === location)
        .map(category => buildCategoryGroup(category, buckets.local.mobileCards, true)),
    ].filter((group): group is PlacementCardGroup => Boolean(group));

    if (
      location === ContentCardLocation.TopWallet &&
      !categoryGroups.some(group => group.title === `Card Category (${TOP_WALLET_CATEGORY_ID})`)
    ) {
      return [
        {
          id: `top-wallet-${TOP_WALLET_CATEGORY_ID}`,
          title: `Card Category (${TOP_WALLET_CATEGORY_ID})`,
          subtitle: "0 child card(s)",
          cards: [],
        },
        ...categoryGroups,
      ];
    }

    return categoryGroups;
  };
  const selectedRawCard =
    buckets.rawCards.find(card => card.id === selectedRawCardId) ??
    localCards.find(card => card.id === selectedRawCardId);

  const copyJson = (id: string, value: unknown) => {
    Clipboard.setString(JSON.stringify(value, null, 2));
    pushToast({
      id,
      type: "success",
      icon: "success",
      title: "Element copied",
    });
  };

  const copyCardJson = (card: BrazeContentCard) => copyJson(`content-cards-raw-${card.id}`, card);

  const clearAllDismissedCards = () => {
    Alert.alert(
      "Clear all dismissed content cards",
      `Clear ${dismissedIds.length} dismissed content card id(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            dispatch(clearDismissedContentCards(dismissedIds));
            dispatch(setDismissedDynamicCards([]));
          },
        },
      ],
    );
  };

  const undismissCard = (cardId: string) => {
    dispatch(clearDismissedContentCards([cardId]));
    dispatch(setDismissedDynamicCards(dismissedDynamicCards.filter(id => id !== cardId)));
  };

  const updateBuilderValue = <Key extends keyof CardBuilderValues>(
    key: Key,
    value: CardBuilderValues[Key],
  ) => {
    setBuilderValues(current => ({ ...current, [key]: value }));
  };

  const updateBuilderExtraField = (key: string, value: string) => {
    setBuilderValues(current => {
      const nextExtras = { ...current.extras };
      if (value) {
        nextExtras[key] = value;
      } else {
        delete nextExtras[key];
      }
      return { ...current, extras: nextExtras };
    });
  };

  const applyBuilderPreset = (
    preset: BuilderPreset,
    locationOverride?: string,
    extrasOverride?: Record<string, string>,
  ) => {
    const nextValues = buildPresetCardBuilderValues(preset);
    if (locationOverride) {
      nextValues.location = locationOverride as CardBuilderValues["location"];
    }
    if (extrasOverride) {
      nextValues.extras = { ...nextValues.extras, ...extrasOverride };
    }
    setBuilderValues(nextValues);
    setBuilderWarnings([]);
    setActiveBuilderPreset(preset);
    setDetailStack(current =>
      current[current.length - 1]?.type === "builder"
        ? [...current.slice(0, -1), { type: "builder", category: PRESET_CATEGORY[preset] }]
        : [...current, { type: "builder", category: PRESET_CATEGORY[preset] }],
    );
  };

  const closeAllDetailContent = () => {
    setDetailStack([]);
  };

  const selectPlacement = (placement: QaConsolePlacement) => {
    setDetailStack([{ type: "placement", placement }]);
  };

  const selectCategoryLocation = (location: string) => {
    setDetailStack([{ type: "category", location }]);
  };

  const dispatchBuiltDebugCards = (
    result: BuiltDebugCards,
    location: CardBuilderValues["location"],
  ) => {
    if (result.cards.length === 0) return;

    if (location === ContentCardLocation.Wallet) {
      dispatch(
        addLocalWalletCarouselCards(
          result.cards.map(card => ({
            id: card.id,
            location: ContentCardLocation.Wallet,
            createdAt: card.created,
            viewed: card.viewed,
            order: Number(card.extras.order),
            title: card.extras.title,
            tag: card.extras.tag,
            picto: card.extras.picto,
            image: card.extras.image,
            image_background: card.extras.image_background,
            link: card.extras.link,
            extras: card.extras,
          })),
        ),
      );
      return;
    }

    if (result.category) {
      dispatch(
        addLocalContentCards({
          category: result.category,
          cards: result.cards,
        }),
      );
    } else {
      dispatch(appendLocalContentCards(result.cards));
    }
  };

  const addBuiltDebugCard = () => {
    const result = buildDebugContentCard(builderValues);
    setBuilderWarnings(result.warnings);
    if (result.warnings.length > 0) return;
    setDetailStack(current => current.slice(0, -1));
    dispatchBuiltDebugCards(result, builderValues.location);
  };

  const seedAllPresets = () => {
    const baseTimestamp = Date.now();
    let totalSeeded = 0;
    ALL_BUILDER_PRESETS.forEach((preset, presetIndex) => {
      const baseValues = buildPresetCardBuilderValues(preset, baseTimestamp + presetIndex);
      for (let variant = 1; variant <= CARDS_PER_PLACEMENT_SEED; variant++) {
        const values: CardBuilderValues = {
          ...withFreshRandomMedia(baseValues),
          id: `${baseValues.id}-${variant}`,
          title: `${baseValues.title} ${variant}`,
          order: String(variant - 1),
        };
        dispatchBuiltDebugCards(buildDebugContentCard(values, true), values.location);
        totalSeeded++;
      }
    });
    pushToast({
      id: "content-cards-seed-all-presets",
      type: "success",
      icon: "success",
      title: `Seeded ${totalSeeded} local cards`,
    });
  };

  const clearAllLocalCards = () => {
    dispatch(clearLocalContentCards());
    dispatch(clearLocalGenericAwarenessModalContentCards());
    pushToast({
      id: "content-cards-clear-local-cards",
      type: "success",
      icon: "success",
      title: "Cleared all local cards",
    });
  };

  const updateGenericAwarenessForm = <Key extends keyof GenericAwarenessModalDebugFormValues>(
    key: Key,
    value: GenericAwarenessModalDebugFormValues[Key],
  ) => {
    setGenericAwarenessForm(current => ({ ...current, [key]: value }));
  };

  const updateGenericAwarenessTrigger = (trigger: GenericAwarenessModalDebugTrigger) => {
    setGenericAwarenessForm(current => ({
      ...current,
      trigger,
      campaignId: getDefaultGenericAwarenessModalCampaignId(current.layout, trigger),
    }));
  };

  const updateGenericAwarenessItem = (
    index: number,
    values: Partial<GenericAwarenessModalDebugItem>,
  ) => {
    setGenericAwarenessForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...values } : item,
      ),
    }));
  };

  const addGenericAwarenessItem = () => {
    setGenericAwarenessForm(current => ({
      ...current,
      items: [...current.items, buildDefaultItem(current.items.length)],
    }));
  };

  const removeGenericAwarenessItem = (index: number) => {
    setGenericAwarenessForm(current =>
      current.items.length <= 1
        ? current
        : {
            ...current,
            items: current.items.filter((_, itemIndex) => itemIndex !== index),
          },
    );
  };

  const onCreateGenericAwarenessModal = () => {
    dispatch(
      appendGenericAwarenessModalContentCards(
        buildLocalGenericAwarenessModalContentCards(genericAwarenessForm),
      ),
    );
    setDetailStack(current => current.slice(0, -1));
  };

  const openGenericAwarenessForm = (layout: GenericAwarenessModalDebugLayout) => {
    setGenericAwarenessForm(current => ({
      ...current,
      layout,
      campaignId: getDefaultGenericAwarenessModalCampaignId(layout, current.trigger),
      items:
        layout === GenericAwarenessModalLayout.FeatureIntro
          ? current.items.slice(0, FEATURE_INTRO_MAX_ITEMS)
          : current.items,
    }));
    setDetailStack(current => [...current, { type: "gam" }]);
  };

  const selectTab = (tabId: QaTabId) => {
    setActiveTab(tabId);
  };

  const openLandingPagesSheet = () => {
    setDetailStack([{ type: "landingPages" }]);
  };

  const buildCreateActionsForPlacement = (
    placement: QaConsolePlacement,
  ): PlacementCreateAction[] => {
    if (placement === ContentCardLocation.GenericAwarenessModal) {
      return [
        {
          label: t("settings.debug.contentCards.genericAwareness.carousel"),
          onPress: () => openGenericAwarenessForm(GenericAwarenessModalLayout.Carousel),
          testID: "debug-generic-awareness-create-carousel",
        },
        {
          label: t("settings.debug.contentCards.genericAwareness.featureIntro"),
          onPress: () => openGenericAwarenessForm(GenericAwarenessModalLayout.FeatureIntro),
          testID: "debug-generic-awareness-create-feature-intro",
        },
        {
          label: t("settings.debug.contentCards.genericAwareness.prompt"),
          onPress: () => openGenericAwarenessForm(GenericAwarenessModalLayout.Prompt),
          testID: "debug-generic-awareness-create-prompt",
        },
      ];
    }
    const presetByPlacement: Partial<Record<QaConsolePlacement, BuilderPreset>> = {
      [ContentCardLocation.TopWallet]: "topWalletHardwareCarousel",
      [ContentCardLocation.Wallet]: "walletCarousel",
      [ContentCardLocation.Asset]: "asset",
      [ContentCardLocation.MyLedger]: "myLedger",
      [ContentCardLocation.NotificationCenter]: "notification",
    };
    const preset = presetByPlacement[placement];
    if (!preset) return [];
    return [
      {
        label: "Create a local card",
        onPress: () => applyBuilderPreset(preset),
        testID: `debug-content-cards-create-${placement}`,
      },
    ];
  };

  const buildCreateActionsForCategoryLocation = (location: string): PlacementCreateAction[] => {
    if (!isLandingPageUseCase(location)) return [];
    return [
      {
        label: "Create a local card for this landing page",
        onPress: () => applyBuilderPreset("landingPageCategory", location),
        testID: "debug-content-cards-create-landingPageCategory-for-location",
      },
    ];
  };

  const buildCreateActionsForLandingPageStickyCta = (
    location: LandingPageUseCase,
  ): PlacementCreateAction[] => [
    {
      label: "Create a local sticky CTA card",
      onPress: () =>
        applyBuilderPreset("landingPageStickyCta", undefined, { landingPage: location }),
      testID: "debug-content-cards-create-landingPageStickyCta-for-location",
    },
  ];

  const detailSheetContentKind = activeDetail?.type;
  const closeDetailSheet = closeAllDetailContent;

  const detailSheetTitle = getDetailSheetTitle({
    activeDetail,
    genericAwarenessForm,
    selectedPlacementDiagnostic,
    selectedCategoryDiagnostic,
    t,
  });
  const detailSheetScrollResetKey = getDetailSheetScrollResetKey({
    activeDetail,
    genericAwarenessForm,
    selectedPlacementDiagnostic,
    selectedCategoryDiagnostic,
    landingPageUseCase,
  });

  let activeTabContent: React.ReactNode;
  if (activeTab === "overview") {
    activeTabContent = (
      <OverviewSection
        placementDiagnostics={placementDiagnostics}
        otherCategoryDiagnostics={otherCategoryDiagnostics}
        onSelectPlacement={selectPlacement}
        onSelectCategoryLocation={selectCategoryLocation}
        onOpenLandingPages={openLandingPagesSheet}
      />
    );
  } else {
    activeTabContent = (
      <CardsSection
        cardsFetched={{
          fetched: buckets.rawCards.length,
          dismissedRemoved: buckets.rawCards.length - buckets.filteredCards.length,
          wrongPlatformRemoved: buckets.filteredCards.length - buckets.mobileCards.length,
          mobileEligible: buckets.mobileCards.length,
        }}
        dismissedIds={dismissedIds}
        onClearAllDismissed={dismissedIds.length > 0 ? clearAllDismissedCards : undefined}
        onUndismiss={undismissCard}
        allCards={buckets.rawCards}
        unmappedCards={unmappedCards}
        onSelectCard={setSelectedRawCardId}
        onCopyCards={(id, cards) => copyJson(id, cards)}
        localCardsCount={localCards.length}
        seedAllCount={ALL_BUILDER_PRESETS.length * CARDS_PER_PLACEMENT_SEED}
        onSeedAllPresets={seedAllPresets}
        onClearLocalCards={clearAllLocalCards}
      />
    );
  }

  return (
    <>
      <Box lx={{ flex: 1 }}>
        <TabSelector activeTab={activeTab} onSelect={selectTab} />

        {activeTab === "inspect" ? (
          <Box lx={{ flex: 1 }}>{activeTabContent}</Box>
        ) : (
          <SettingsNavigationScrollView>{activeTabContent}</SettingsNavigationScrollView>
        )}
      </Box>

      <QaConsoleDetailSheet
        title={selectedRawCard ? cardRowTitle(selectedRawCard) : ""}
        isOpen={Boolean(selectedRawCardId)}
        onClose={() => setSelectedRawCardId(undefined)}
      >
        {selectedRawCard ? (
          <CardDetailContent
            card={selectedRawCard}
            isDismissed={dismissedIds.includes(
              getDismissalKey(selectedRawCard) ?? selectedRawCard.id,
            )}
            isUnmapped={unmappedCards.some(card => card.id === selectedRawCard.id)}
            onCopy={() => copyCardJson(selectedRawCard)}
          />
        ) : null}
      </QaConsoleDetailSheet>

      <QaConsoleDetailSheet
        title={detailSheetTitle}
        isOpen={detailSheetContentKind !== undefined}
        onClose={closeDetailSheet}
        scrollResetKey={detailSheetScrollResetKey}
      >
        {detailSheetContentKind === "placement" && selectedPlacementDiagnostic ? (
          <PlacementDetailContent
            location={selectedPlacementDiagnostic.placement}
            status={selectedPlacementDiagnostic.status}
            blockers={selectedPlacementDiagnostic.blockers}
            createActions={buildCreateActionsForPlacement(selectedPlacementDiagnostic.placement)}
            cardGroups={getCardGroupsForPlacement(selectedPlacementDiagnostic.placement)}
            dismissedIds={dismissedIds}
            unmappedCards={unmappedCards}
            onCopyCard={copyCardJson}
          />
        ) : null}
        {detailSheetContentKind === "category" && selectedCategoryDiagnostic ? (
          <PlacementDetailContent
            location={selectedCategoryDiagnostic.location}
            status={selectedCategoryDiagnostic.status}
            blockers={selectedCategoryDiagnostic.blockers}
            createActions={buildCreateActionsForCategoryLocation(
              selectedCategoryDiagnostic.location,
            )}
            cardGroups={getCardGroupsForPlacement(selectedCategoryDiagnostic.location)}
            dismissedIds={dismissedIds}
            unmappedCards={unmappedCards}
            onCopyCard={copyCardJson}
          />
        ) : null}
        {detailSheetContentKind === "landingPages" ? (
          <LandingPagesDetailContent
            selectedUseCase={landingPageUseCase}
            onSelectUseCase={value => setLandingPageUseCase(value as LandingPageUseCase)}
            useCaseCounts={landingPageCategoryCounts}
            categoryStatus={landingPageCategoryDiagnostic.status}
            categoryBlockers={landingPageCategoryDiagnostic.blockers}
            categoryCreateActions={buildCreateActionsForCategoryLocation(landingPageUseCase)}
            categoryCardGroups={getCardGroupsForPlacement(landingPageUseCase)}
            stickyCtaStatus={landingPageStickyCtaDiagnostic.status}
            stickyCtaBlockers={landingPageStickyCtaDiagnostic.blockers}
            stickyCtaCreateActions={buildCreateActionsForLandingPageStickyCta(landingPageUseCase)}
            stickyCtaCardGroups={getCardGroupsForPlacement(
              ContentCardLocation.LandingPageStickyCta,
            )}
            dismissedIds={dismissedIds}
            unmappedCards={unmappedCards}
            onCopyCard={copyCardJson}
          />
        ) : null}
        {activeDetail?.type === "builder" ? (
          <BuilderForm
            category={activeDetail.category}
            activePreset={activeBuilderPreset}
            values={builderValues}
            warnings={builderWarnings}
            onSelectPreset={applyBuilderPreset}
            onChange={updateBuilderValue}
            onChangeExtraField={updateBuilderExtraField}
            onCreate={addBuiltDebugCard}
            onCopyPreview={() =>
              copyJson("content-cards-builder-preview", buildDebugContentCard(builderValues, true))
            }
          />
        ) : null}
        {detailSheetContentKind === "gam" ? (
          <GenericAwarenessModalFormContent
            form={genericAwarenessForm}
            maxFeatureIntroItems={FEATURE_INTRO_MAX_ITEMS}
            onCreate={onCreateGenericAwarenessModal}
            onCopyPreview={() =>
              copyJson(
                "content-cards-generic-awareness-preview",
                buildLocalGenericAwarenessModalContentCards(genericAwarenessForm),
              )
            }
            onChangeField={updateGenericAwarenessForm}
            onChangeTrigger={updateGenericAwarenessTrigger}
            onAddItem={addGenericAwarenessItem}
            onRemoveItem={removeGenericAwarenessItem}
            onChangeItem={updateGenericAwarenessItem}
          />
        ) : null}
      </QaConsoleDetailSheet>
    </>
  );
}

function TabSelector({
  activeTab,
  onSelect,
}: Readonly<{
  activeTab: QaTabId;
  onSelect: (tab: QaTabId) => void;
}>) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        gap: "s8",
        paddingHorizontal: "s24",
        paddingBottom: "s12",
      }}
    >
      {QA_TABS.map(tab => (
        <LumenButton
          key={tab.id}
          size="sm"
          appearance={activeTab === tab.id ? "base" : "gray"}
          onPress={() => onSelect(tab.id)}
          testID={`debug-content-cards-tab-${tab.id}`}
        >
          {tab.label}
        </LumenButton>
      ))}
    </Box>
  );
}

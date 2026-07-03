import React, { useMemo, useState } from "react";
import { Linking, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Box, Button as LumenButton, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { ChevronLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import type { AllLocations, BrazeContentCard, LandingPageUseCase } from "~/dynamicContent/types";
import { ContentCardLocation } from "~/dynamicContent/types";
import {
  FIXED_PLACEMENTS,
  getCardShape,
  getDeeplinkForLocation,
  getLocationExplanation,
  getLocationShape,
  getPlacementLabel,
  type OtherCategoryDiagnostic,
  type PlacementDiagnostic,
  type QaConsolePlacement,
  type VisibilityStatus,
} from "./qaConsole";
import { LandingPageSelect } from "./Builder";
import { CardDetailContent, cardRowTitle, cardRowSubtitle } from "./Inspect";
import { StatusRow, type TagAppearance } from "./StatusRow";
import {
  SectionTitle,
  SectionCard,
  CollapsibleSection,
  BlockerExplanation,
  ShapeTag,
} from "./shared";
export type PlacementCreateAction = {
  label: string;
  onPress: () => void;
  testID?: string;
};
export type PlacementCardGroup = {
  id: string;
  title: string;
  subtitle?: string;
  cards: PlacementCardItem[];
};
export type PlacementCardItem = {
  card: BrazeContentCard;
  isLocal: boolean;
};

export function visibilityStatusAppearance(status: VisibilityStatus): TagAppearance {
  if (status === "Active") return "success";
  if (status === "Blocked") return "error";
  return "gray";
}
function PlacementStatusRow({
  diagnostic,
  onSelect,
}: Readonly<{
  diagnostic: PlacementDiagnostic;
  onSelect: (placement: QaConsolePlacement) => void;
}>) {
  return (
    <StatusRow
      title={getPlacementLabel(diagnostic.placement)}
      subtitle={`${diagnostic.eligibleCardIds.length} eligible card(s)`}
      shape={getLocationShape(diagnostic.placement)}
      statusLabel={diagnostic.status}
      statusAppearance={visibilityStatusAppearance(diagnostic.status)}
      onPress={() => onSelect(diagnostic.placement)}
      testID={`debug-content-cards-placement-${diagnostic.placement}`}
    />
  );
}
function SinglePlacementSectionCard({
  title,
  subtitle,
  diagnostic,
  onSelect,
}: Readonly<{
  title: string;
  subtitle: string;
  diagnostic: PlacementDiagnostic | undefined;
  onSelect: (placement: QaConsolePlacement) => void;
}>) {
  if (!diagnostic) return null;
  return (
    <SectionCard title={title} subtitle={subtitle}>
      <PlacementStatusRow diagnostic={diagnostic} onSelect={onSelect} />
    </SectionCard>
  );
}

export function OverviewSection({
  placementDiagnostics,
  otherCategoryDiagnostics,
  onSelectPlacement,
  onSelectCategoryLocation,
  onOpenLandingPages,
}: Readonly<{
  placementDiagnostics: PlacementDiagnostic[];
  otherCategoryDiagnostics: OtherCategoryDiagnostic[];
  onSelectPlacement: (placement: QaConsolePlacement) => void;
  onSelectCategoryLocation: (location: string) => void;
  onOpenLandingPages: () => void;
}>) {
  const [isOtherCategoriesExpanded, setIsOtherCategoriesExpanded] = useState(false);
  const fixedPlacementDiagnostics = placementDiagnostics.filter(diagnostic =>
    FIXED_PLACEMENTS.has(diagnostic.placement),
  );
  const notificationDiagnostic = placementDiagnostics.find(
    diagnostic => diagnostic.placement === ContentCardLocation.NotificationCenter,
  );
  const genericAwarenessModalDiagnostic = placementDiagnostics.find(
    diagnostic => diagnostic.placement === ContentCardLocation.GenericAwarenessModal,
  );

  return (
    <>
      <SectionTitle
        title="Overview"
        subtitle="What QA sees per placement, and why a placement can be empty."
      />
      <SectionCard
        title="Fixed placements"
        subtitle="Always checked, whether or not Braze has cards targeting them. Tap one to see why it's empty, or to create a local card for it."
      >
        {fixedPlacementDiagnostics.map(diagnostic => (
          <PlacementStatusRow
            key={diagnostic.placement}
            diagnostic={diagnostic}
            onSelect={onSelectPlacement}
          />
        ))}
      </SectionCard>
      <SinglePlacementSectionCard
        title="Notifications"
        subtitle="A row in the Notifications inbox - its own delivery mechanism, not a fixed placement variant."
        diagnostic={notificationDiagnostic}
        onSelect={onSelectPlacement}
      />
      <SinglePlacementSectionCard
        title="Generic Awareness Modal"
        subtitle="A bottom-sheet modal, assembled from multiple cards - unrelated to categories."
        diagnostic={genericAwarenessModalDiagnostic}
        onSelect={onSelectPlacement}
      />
      <SectionCard
        title="Landing pages"
        subtitle="~30 possible landing pages. Each can show category content and/or a sticky CTA - pick one to inspect both."
      >
        <StatusRow
          title="Inspect a landing page"
          subtitle="Choose which landing page to check, or to create a local card for"
          shape="category"
          onPress={onOpenLandingPages}
          testID="debug-content-cards-landing-pages"
        />
      </SectionCard>
      {otherCategoryDiagnostics.length > 0 ? (
        <CollapsibleSection
          title="Other categories"
          subtitle={`${otherCategoryDiagnostics.length} location(s) found - e.g. Learn (dead, nothing renders it)`}
          isExpanded={isOtherCategoriesExpanded}
          onToggle={() => setIsOtherCategoriesExpanded(expanded => !expanded)}
          testID="debug-content-cards-other-categories-toggle"
        >
          <Text typography="body2" lx={{ color: "muted", marginBottom: "s8" }}>
            Not in the fixed placement list, but categories targeting them exist in the fetched
            cards - so they can show as "Mapped" in Inspect without a placement row here.
          </Text>
          {otherCategoryDiagnostics.map(diagnostic => (
            <StatusRow
              key={diagnostic.location}
              title={diagnostic.label}
              subtitle={`${
                diagnostic.eligibleCardIds.length
              } eligible card(s) - ${diagnostic.categoryCount} categor${
                diagnostic.categoryCount === 1 ? "y" : "ies"
              }`}
              shape={getLocationShape(diagnostic.location)}
              statusLabel={diagnostic.status}
              statusAppearance={visibilityStatusAppearance(diagnostic.status)}
              onPress={() => onSelectCategoryLocation(diagnostic.location)}
              testID={`debug-content-cards-other-category-${diagnostic.location}`}
            />
          ))}
        </CollapsibleSection>
      ) : null}
    </>
  );
}

function BackButton({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <Pressable onPress={onPress}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
        <ChevronLeft size={16} color="muted" />
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          Back
        </Text>
      </Box>
    </Pressable>
  );
}

function isDismissedCard(
  card: BrazeContentCard,
  location: string,
  dismissedIdSet: Set<string>,
): boolean {
  if (dismissedIdSet.has(card.id)) return true;

  return (
    location === ContentCardLocation.GenericAwarenessModal &&
    Boolean(card.extras?.campaignId && dismissedIdSet.has(card.extras.campaignId))
  );
}

export function PlacementDetailContent({
  location,
  status,
  blockers,
  createActions = [],
  cardGroups = [],
  dismissedIds = [],
  unmappedCards = [],
  onCopyCard,
  heading,
  showOpenExpectedScreenButton = true,
}: Readonly<{
  location: string;
  status: VisibilityStatus;
  blockers: string[];
  createActions?: PlacementCreateAction[];
  cardGroups?: PlacementCardGroup[];
  dismissedIds?: string[];
  unmappedCards?: BrazeContentCard[];
  onCopyCard: (card: BrazeContentCard) => void;
  heading?: string;
  showOpenExpectedScreenButton?: boolean;
}>) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const shape = getLocationShape(location);
  const deeplink =
    showOpenExpectedScreenButton && status === "Active"
      ? getDeeplinkForLocation(location as AllLocations)
      : undefined;
  const opensNotificationCenter = location === ContentCardLocation.NotificationCenter;
  const canOpenExpectedScreen =
    showOpenExpectedScreenButton &&
    status === "Active" &&
    (opensNotificationCenter || Boolean(deeplink));
  const openExpectedScreen = () => {
    if (opensNotificationCenter) {
      navigation.navigate(NavigatorName.NotificationCenter, {
        screen: ScreenName.NotificationCenter,
      });
      return;
    }
    if (deeplink) Linking.openURL(deeplink);
  };
  const [inlineCardId, setInlineCardId] = useState<string | undefined>();
  const cardsById = useMemo(
    () => new Map(cardGroups.flatMap(group => group.cards.map(item => [item.card.id, item]))),
    [cardGroups],
  );
  const dismissedIdSet = useMemo(() => new Set(dismissedIds), [dismissedIds]);
  const unmappedIdSet = useMemo(() => new Set(unmappedCards.map(card => card.id)), [unmappedCards]);
  const inlineCardItem = inlineCardId ? cardsById.get(inlineCardId) : undefined;

  if (inlineCardItem) {
    return (
      <Box lx={{ paddingHorizontal: "s24", gap: "s12" }}>
        <BackButton onPress={() => setInlineCardId(undefined)} />
        <CardDetailContent
          card={inlineCardItem.card}
          placement={location as AllLocations}
          isDismissed={isDismissedCard(inlineCardItem.card, location, dismissedIdSet)}
          isUnmapped={unmappedIdSet.has(inlineCardItem.card.id)}
          onCopy={() => onCopyCard(inlineCardItem.card)}
        />
      </Box>
    );
  }

  return (
    <Box lx={{ paddingHorizontal: "s24", gap: "s12" }}>
      {heading ? (
        <Text typography="body1SemiBold" lx={{ color: "base" }}>
          {heading}
        </Text>
      ) : null}
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
        <ShapeTag shape={shape} />
        <Tag label={status} size="sm" appearance={visibilityStatusAppearance(status)} />
      </Box>
      <Text typography="body2" lx={{ color: "muted" }}>
        {getLocationExplanation(location)}
      </Text>
      {canOpenExpectedScreen ? (
        <LumenButton
          size="sm"
          appearance="gray"
          onPress={openExpectedScreen}
          testID="debug-content-cards-open-expected-screen"
        >
          Open expected screen
        </LumenButton>
      ) : null}
      {blockers.length > 0 ? (
        <Box lx={{ gap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            {status === "Active" ? "Other cards at this placement have issues" : "Why it's blocked"}
          </Text>
          {status === "Active" ? (
            <Text typography="body2" lx={{ color: "muted" }}>
              At least one card shows, but these others won't render until fixed.
            </Text>
          ) : null}
          {blockers.map(blocker => (
            <BlockerExplanation key={blocker} blocker={blocker} emphasized />
          ))}
        </Box>
      ) : null}
      {createActions.length > 0 ? (
        <Box lx={{ gap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            Create a local card
          </Text>
          <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
            {createActions.map(action => (
              <LumenButton
                key={action.label}
                size="sm"
                appearance="base"
                onPress={action.onPress}
                testID={action.testID}
              >
                {action.label}
              </LumenButton>
            ))}
          </Box>
        </Box>
      ) : null}
      {cardGroups.map(group => (
        <Box key={group.id} lx={{ gap: "s4" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            {group.title}
          </Text>
          {group.subtitle ? (
            <Text typography="body2" lx={{ color: "muted" }}>
              {group.subtitle}
            </Text>
          ) : null}
          {group.cards.map(({ card, isLocal }) => {
            const isDismissed = isDismissedCard(card, location, dismissedIdSet);

            return (
              <StatusRow
                key={card.id}
                title={cardRowTitle(card)}
                subtitle={cardRowSubtitle(card)}
                shape={getCardShape(card)}
                isLocal={isLocal}
                statusLabel={isDismissed ? "Dismissed" : undefined}
                statusAppearance={isDismissed ? "gray" : undefined}
                onPress={() => setInlineCardId(card.id)}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
export function LandingPagesDetailContent({
  selectedUseCase,
  onSelectUseCase,
  useCaseCounts,
  categoryStatus,
  categoryBlockers,
  categoryCreateActions,
  categoryCardGroups,
  stickyCtaStatus,
  stickyCtaBlockers,
  stickyCtaCreateActions,
  stickyCtaCardGroups,
  dismissedIds,
  unmappedCards,
  onCopyCard,
}: Readonly<{
  selectedUseCase: string;
  onSelectUseCase: (useCase: string) => void;
  useCaseCounts?: Partial<Record<LandingPageUseCase, number>>;
  categoryStatus: VisibilityStatus;
  categoryBlockers: string[];
  categoryCreateActions?: PlacementCreateAction[];
  categoryCardGroups?: PlacementCardGroup[];
  stickyCtaStatus: VisibilityStatus;
  stickyCtaBlockers: string[];
  stickyCtaCreateActions?: PlacementCreateAction[];
  stickyCtaCardGroups?: PlacementCardGroup[];
  dismissedIds?: string[];
  unmappedCards?: BrazeContentCard[];
  onCopyCard: (card: BrazeContentCard) => void;
}>) {
  const isActive = categoryStatus === "Active" || stickyCtaStatus === "Active";
  const deeplink = isActive ? getDeeplinkForLocation(selectedUseCase as AllLocations) : undefined;

  return (
    <Box lx={{ gap: "s12" }}>
      <Box lx={{ paddingHorizontal: "s24", gap: "s12" }}>
        <LandingPageSelect
          value={selectedUseCase}
          onSelect={onSelectUseCase}
          counts={useCaseCounts}
          splitByStatus
        />
        {deeplink ? (
          <LumenButton
            size="sm"
            appearance="gray"
            onPress={() => Linking.openURL(deeplink)}
            testID="debug-content-cards-open-expected-screen"
          >
            Open expected screen
          </LumenButton>
        ) : null}
      </Box>
      <PlacementDetailContent
        heading="Category content"
        location={selectedUseCase}
        status={categoryStatus}
        blockers={categoryBlockers}
        createActions={categoryCreateActions}
        cardGroups={categoryCardGroups}
        dismissedIds={dismissedIds}
        unmappedCards={unmappedCards}
        onCopyCard={onCopyCard}
        showOpenExpectedScreenButton={false}
      />
      <PlacementDetailContent
        heading="Sticky CTA"
        location={ContentCardLocation.LandingPageStickyCta}
        status={stickyCtaStatus}
        blockers={stickyCtaBlockers}
        createActions={stickyCtaCreateActions}
        cardGroups={stickyCtaCardGroups}
        dismissedIds={dismissedIds}
        unmappedCards={unmappedCards}
        onCopyCard={onCopyCard}
        showOpenExpectedScreenButton={false}
      />
    </Box>
  );
}

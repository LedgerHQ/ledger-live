import React, { useMemo, useState } from "react";
import { Linking, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Box, Button as LumenButton, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useFeature } from "@features/platform-feature-flags";
import SettingsRow from "~/components/SettingsRow";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import {
  ContentCardLocation,
  type AllLocations,
  type BrazeContentCard,
} from "~/dynamicContent/types";
import { explainOrphanCard, getCardOpenLink, getCardShape, getDismissalKey } from "./qaConsole";
import { StatusRow } from "./StatusRow";
import { CollapsibleSection, SectionCard, ShapeTag } from "./shared";
function truncateCardId(id: string): string {
  return id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-6)}` : id;
}

export function cardRowTitle(card: BrazeContentCard): string {
  return card.extras?.title || `Untitled (${truncateCardId(card.id)})`;
}
function isWrongPlatform(card: BrazeContentCard): boolean {
  return Boolean(card.extras?.platform && card.extras.platform !== "mobile");
}

export function cardRowSubtitle(card: BrazeContentCard): string {
  if (isWrongPlatform(card)) return `Wrong platform ("${card.extras.platform}")`;
  const shape = getCardShape(card);
  if (shape === "gam") {
    return card.extras?.campaignId
      ? `GAM slide "${card.extras.campaignId}"`
      : "Generic Awareness Modal slide";
  }
  if (shape === "categoryChild") return `Category child of "${card.extras.categoryId}"`;
  const locationAndType = [card.extras?.location, card.extras?.type].filter(Boolean).join(" - ");
  if (locationAndType) return locationAndType;
  return "Missing location/type extras";
}
function cardRoleExplanation(card: BrazeContentCard): string {
  if (isWrongPlatform(card)) {
    return `Wrong platform ("${card.extras.platform}") - Ledger Wallet drops this before it ever reaches a placement check, regardless of its shape below.`;
  }
  const shape = getCardShape(card);
  if (shape === "gam") {
    return `Generic Awareness Modal slide - one of several cards sharing campaignId="${card.extras.campaignId}", stitched client-side into a single modal. Never renders alone.`;
  }
  if (shape === "category") {
    const categoryId = card.extras.id ?? card.id;
    return `Category ("folder") card - never renders itself. Card(s) with categoryId="${categoryId}" render as its children.`;
  }
  if (shape === "categoryChild") {
    return `Category child of "${card.extras.categoryId}" - renders inside that category, not directly at its own location.`;
  }
  if (shape === "direct") {
    return `Direct content card - renders as-is at "${card.extras.location}", no category involved.`;
  }
  return "Missing location/type extras and no categoryId - won't render anywhere.";
}
function orphanCardSubtitle(card: BrazeContentCard): string {
  const location = card.extras?.location ?? "(none)";
  const type = card.extras?.type ?? "(none)";
  const categoryId = card.extras?.categoryId ?? "(none)";
  return `location: ${location} · type: ${type} · categoryId: ${categoryId}\n${explainOrphanCard(card)}`;
}

function getCardRowStatus(
  isUnmapped: boolean,
  isDismissed: boolean,
): { statusLabel?: string; statusAppearance?: "error" | "gray" } {
  if (isUnmapped) return { statusLabel: "Unmapped", statusAppearance: "error" };
  if (isDismissed) return { statusLabel: "Dismissed", statusAppearance: "gray" };
  return {};
}

function FunnelStat({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: number; tone?: "positive" | "negative" }>) {
  const color = value > 0 && tone === "positive" ? "success" : value > 0 && tone === "negative" ? "error" : "base";
  return (
    <Box lx={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body2SemiBold" lx={{ color }}>
        {value}
      </Text>
    </Box>
  );
}
type CardsFetchedSummary = {
  fetched: number;
  dismissedRemoved: number;
  wrongPlatformRemoved: number;
  mobileEligible: number;
};

const FEATURE_FLAG_ROWS = [
  {
    id: "lwmWallet40",
    note: "Gates when top_wallet mounts on the new Wallet UI, and the Lumen wallet-carousel layout.",
  },
  {
    id: "lwmGenericAwarenessModal",
    note: "Gates whether Generic Awareness Modal can open at all.",
  },
] as const;

function FeatureFlagRow({
  id,
  note,
}: Readonly<{ id: (typeof FEATURE_FLAG_ROWS)[number]["id"]; note: string }>) {
  const flag = useFeature(id);
  const enabled = flag?.enabled ?? false;
  return (
    <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s8", gap: "s4" }}>
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "s8",
        }}
      >
        <Text typography="body1SemiBold" lx={{ color: "base" }}>
          {id}
        </Text>
        <Tag
          label={enabled ? "Enabled" : "Disabled"}
          size="sm"
          appearance={enabled ? "success" : "gray"}
        />
      </Box>
      <Text typography="body2" lx={{ color: "muted" }}>
        {note}
      </Text>
    </Box>
  );
}

function FeatureFlagsSectionCard() {
  return (
    <SectionCard
      title="Feature flags"
      subtitle="Can hide a placement even when its own cards/category are configured correctly."
    >
      {FEATURE_FLAG_ROWS.map(row => (
        <FeatureFlagRow key={row.id} id={row.id} note={row.note} />
      ))}
    </SectionCard>
  );
}

export function CardsSection({
  cardsFetched,
  dismissedIds,
  onClearAllDismissed,
  onUndismiss,
  allCards,
  unmappedCards,
  onSelectCard,
  onCopyCards,
  localCardsCount,
  seedAllCount,
  onSeedAllPresets,
  onClearLocalCards,
}: Readonly<{
  cardsFetched: CardsFetchedSummary;
  dismissedIds: string[];
  onClearAllDismissed?: () => void;
  onUndismiss: (cardId: string) => void;
  allCards: BrazeContentCard[];
  unmappedCards: BrazeContentCard[];
  onSelectCard: (cardId: string) => void;
  onCopyCards: (id: string, cards: BrazeContentCard[]) => void;
  localCardsCount: number;
  seedAllCount: number;
  onSeedAllPresets: () => void;
  onClearLocalCards: () => void;
}>) {
  const [expandedSection, setExpandedSection] = useState<
    "allCards" | "orphans" | "dismissed" | undefined
  >(undefined);
  const toggleSection = (section: "allCards" | "orphans" | "dismissed") =>
    setExpandedSection(current => (current === section ? undefined : section));
  const unmappedIds = useMemo(() => new Set(unmappedCards.map(card => card.id)), [unmappedCards]);
  const dismissedIdSet = useMemo(() => new Set(dismissedIds), [dismissedIds]);
  const renderCardRow = (card: BrazeContentCard) => {
    const isUnmapped = unmappedIds.has(card.id);
    const dismissalKey = getDismissalKey(card);
    const isDismissed = Boolean(dismissalKey && dismissedIdSet.has(dismissalKey));
    const { statusLabel, statusAppearance } = getCardRowStatus(isUnmapped, isDismissed);
    return (
      <StatusRow
        key={card.id}
        title={cardRowTitle(card)}
        subtitle={cardRowSubtitle(card)}
        shape={getCardShape(card)}
        statusLabel={statusLabel}
        statusAppearance={statusAppearance}
        onPress={() => onSelectCard(card.id)}
      />
    );
  };

  const renderOrphanRow = (card: BrazeContentCard) => (
    <StatusRow
      key={card.id}
      title={cardRowTitle(card)}
      subtitle={orphanCardSubtitle(card)}
      onPress={() => onSelectCard(card.id)}
      testID={`debug-content-cards-orphan-${card.id}`}
    />
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <FeatureFlagsSectionCard />
      <SectionCard
        title="Bulk actions"
        subtitle={`${localCardsCount} local card(s) across every placement`}
      >
        <Box lx={{ flexDirection: "row", gap: "s8", paddingHorizontal: "s16" }}>
          <LumenButton
            size="sm"
            appearance="base"
            onPress={onSeedAllPresets}
            testID="debug-content-cards-seed-all-presets"
          >
            {`Seed (${seedAllCount})`}
          </LumenButton>
          <LumenButton
            size="sm"
            appearance="gray"
            onPress={onClearLocalCards}
            testID="debug-content-cards-clear-local-cards"
          >
            Clear
          </LumenButton>
        </Box>
      </SectionCard>

      <CollapsibleSection
        title="All cards"
        subtitle={`${cardsFetched.fetched} fetched → ${cardsFetched.mobileEligible} eligible`}
        trailing={
          unmappedCards.length > 0 ? (
            <Tag label={`${unmappedCards.length} unmapped`} size="sm" appearance="error" />
          ) : undefined
        }
        isExpanded={expandedSection === "allCards"}
        onToggle={() => toggleSection("allCards")}
        testID="debug-content-cards-section-all-cards"
      >
        <Box lx={{ paddingHorizontal: "s24", gap: "s4" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            Pipeline
          </Text>
          <FunnelStat label="Fetched from Braze" value={cardsFetched.fetched} />
          <FunnelStat
            label="Removed (already dismissed)"
            value={cardsFetched.dismissedRemoved}
            tone="negative"
          />
          <FunnelStat
            label="Removed (wrong platform)"
            value={cardsFetched.wrongPlatformRemoved}
            tone="negative"
          />
          <FunnelStat label="Mobile eligible" value={cardsFetched.mobileEligible} tone="positive" />
        </Box>

        <Box lx={{ paddingHorizontal: "s24", marginTop: "s12" }}>
          <LumenButton
            size="sm"
            appearance="gray"
            onPress={() => onCopyCards("content-cards-all", allCards)}
            testID="debug-content-cards-allcards-copy"
          >
            Copy all cards JSON
          </LumenButton>
        </Box>

        {unmappedCards.length > 0 ? (
          <Box lx={{ paddingHorizontal: "s24", gap: "s4", marginTop: "s12" }}>
            <Text typography="body2" lx={{ color: "muted" }}>
              A card tagged "Unmapped" above is either the wrong platform, or has no matching
              placement "location"/"type" and no "categoryId" matching a live category. Category
              children only need "categoryId", not location/type. Open a card for the exact reason.
              Fix the extras in Braze.
            </Text>
          </Box>
        ) : null}

        {allCards.length === 0 ? (
          <Text
            typography="body2"
            lx={{ color: "muted", paddingHorizontal: "s24", marginTop: "s8" }}
          >
            No cards.
          </Text>
        ) : (
          <Box>{allCards.map(renderCardRow)}</Box>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Orphan cards"
        subtitle="For CRM: Braze cards that match no known placement or category."
        trailing={
          unmappedCards.length > 0 ? (
            <Tag label={String(unmappedCards.length)} size="sm" appearance="error" />
          ) : undefined
        }
        isExpanded={expandedSection === "orphans"}
        onToggle={() => toggleSection("orphans")}
        testID="debug-content-cards-section-orphans"
      >
        {unmappedCards.length === 0 ? (
          <Text typography="body2" lx={{ color: "muted", paddingHorizontal: "s24" }}>
            No orphan cards - every fetched card matches a known placement, category, or Generic
            Awareness Modal.
          </Text>
        ) : (
          <Box>{unmappedCards.map(renderOrphanRow)}</Box>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Dismissed cards"
        subtitle={`${dismissedIds.length} dismissed id(s).`}
        isExpanded={expandedSection === "dismissed"}
        onToggle={() => toggleSection("dismissed")}
        testID="debug-content-cards-section-dismissed"
      >
        <DismissedCardsContent
          dismissedIds={dismissedIds}
          onClearAll={onClearAllDismissed}
          onUndismiss={onUndismiss}
        />
      </CollapsibleSection>
    </ScrollView>
  );
}

export function CardDetailContent({
  card,
  placement,
  isDismissed,
  isUnmapped,
  onCopy,
}: Readonly<{
  card: BrazeContentCard;
  placement?: AllLocations;
  isDismissed: boolean;
  isUnmapped: boolean;
  onCopy: () => void;
}>) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const extrasEntries = Object.entries(card.extras ?? {});
  const openLink = getCardOpenLink(card, placement);
  const location = placement ?? (card.extras.location as AllLocations | undefined);
  const opensNotificationCenter = location === ContentCardLocation.NotificationCenter;
  const canOpenExpectedScreen = opensNotificationCenter || Boolean(openLink);
  const openExpectedScreen = () => {
    if (opensNotificationCenter) {
      navigation.navigate(NavigatorName.NotificationCenter, {
        screen: ScreenName.NotificationCenter,
      });
      return;
    }
    if (openLink) Linking.openURL(openLink);
  };

  return (
    <Box lx={{ paddingHorizontal: "s24", gap: "s12" }}>
      <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
        <ShapeTag shape={getCardShape(card)} />
        <Tag
          label={isDismissed ? "Dismissed" : "Fetched"}
          size="sm"
          appearance={isDismissed ? "gray" : "success"}
        />
        {isUnmapped ? <Tag label="Unmapped" size="sm" appearance="error" /> : null}
      </Box>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {cardRoleExplanation(card)}
      </Text>
      {canOpenExpectedScreen ? (
        <LumenButton
          size="sm"
          appearance="gray"
          onPress={openExpectedScreen}
          testID="debug-content-cards-card-open-link"
        >
          Open expected screen
        </LumenButton>
      ) : null}
      <Text typography="body2" lx={{ color: "muted" }}>
        id: {card.id}
      </Text>
      <Text typography="body2" lx={{ color: "muted" }}>
        created: {new Date(card.created * 1000).toLocaleString()}
      </Text>
      <Text typography="body2" lx={{ color: "muted" }}>
        viewed: {card.viewed ? "yes" : "no"}
      </Text>
      <Box lx={{ gap: "s4" }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          Extras
        </Text>
        {extrasEntries.length === 0 ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            No extras.
          </Text>
        ) : (
          extrasEntries.map(([key, value]) => (
            <Text key={key} typography="body2" lx={{ color: "muted" }}>
              {key}: {String(value)}
            </Text>
          ))
        )}
      </Box>
      <LumenButton size="sm" appearance="gray" onPress={onCopy}>
        Copy card JSON
      </LumenButton>
    </Box>
  );
}

function DismissedCardsContent({
  dismissedIds,
  onClearAll,
  onUndismiss,
}: Readonly<{
  dismissedIds: string[];
  onClearAll?: () => void;
  onUndismiss: (cardId: string) => void;
}>) {
  return (
    <Box lx={{ paddingHorizontal: "s24", gap: "s8" }}>
      <LumenButton size="sm" appearance="gray" onPress={onClearAll} disabled={!onClearAll}>
        Clear all dismissed ids
      </LumenButton>
      {dismissedIds.length === 0 ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          No dismissed cards.
        </Text>
      ) : (
        dismissedIds.map(cardId => (
          <SettingsRow
            key={cardId}
            title={cardId}
            desc="Undismiss this card"
            iconLeft={<Trash size={24} color="base" />}
            onPress={() => onUndismiss(cardId)}
            testID={`debug-content-cards-undismiss-${cardId}`}
          />
        ))
      )}
    </Box>
  );
}

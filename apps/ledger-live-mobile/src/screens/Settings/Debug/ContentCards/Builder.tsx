import React from "react";
import {
  Box,
  Button as LumenButton,
  MediaCard,
  MediaCardTitle,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import {
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  LandingPageUseCase,
} from "~/dynamicContent/types";
import VerticalCard from "~/contentCards/cards/vertical";
import { ContentBannerActionCard } from "~/contentCards/cards/contentBannerAction";
import HeroCard from "~/contentCards/cards/hero";
import { WidthFactor } from "~/contentCards/layouts/types";
import type { Size } from "~/contentCards/cards/vertical/types";
import type { ContentCardMetadata } from "~/contentCards/cards/types";
import {
  DEBUG_CARD_PREFIX,
  DEBUG_CATEGORY_PREFIX,
  getLocationExplanation,
  getLocationShape,
  buildPresetCardBuilderValues,
  type CardBuilderValues,
  type CardShape,
} from "./qaConsole";
import { GenericAwarenessModalField } from "./GenericAwarenessModalField";
import { ShapeTag } from "./shared";
type OnChangeField = <Key extends keyof CardBuilderValues>(
  key: Key,
  value: CardBuilderValues[Key],
) => void;
type OnChangeExtraField = (key: string, value: string) => void;
export const LANDING_PAGE_USE_CASES = Object.values(LandingPageUseCase);
function landingPageChipLabel(useCase: LandingPageUseCase): string {
  return useCase.replace(/^LP_/, "").replaceAll("_", " ");
}

export type BuilderPreset = Parameters<typeof buildPresetCardBuilderValues>[0];

const BUILDER_PRESET_LABELS: Record<BuilderPreset, string> = {
  topWalletHero: "Portfolio hero (single card)",
  topWalletHardwareCarousel: "Small card carousel",
  topWalletHeroCarousel: "Hero carousel (legacy debug)",
  topWalletAction: "Portfolio action carousel",
  walletCarousel: "Bottom carousel",
  asset: "Asset card",
  myLedger: "My Ledger card",
  notification: "Notification card",
  landingPageCategory: "Landing page category",
  landingPageStickyCta: "Landing sticky CTA",
};
const BUILDER_PRESET_SHAPE: Record<BuilderPreset, CardShape> = {
  topWalletHero: "categoryChild",
  topWalletHardwareCarousel: "categoryChild",
  topWalletHeroCarousel: "categoryChild",
  topWalletAction: "categoryChild",
  walletCarousel: "direct",
  asset: "direct",
  myLedger: "categoryChild",
  notification: "direct",
  landingPageCategory: "categoryChild",
  landingPageStickyCta: "direct",
};
export type BuilderCategory =
  | "topWallet"
  | "wallet"
  | "asset"
  | "myLedger"
  | "notification"
  | "landingPageCategory"
  | "landingPageStickyCta";

export const PRESET_CATEGORY: Record<BuilderPreset, BuilderCategory> = {
  topWalletHero: "topWallet",
  topWalletHardwareCarousel: "topWallet",
  topWalletHeroCarousel: "topWallet",
  topWalletAction: "topWallet",
  walletCarousel: "wallet",
  asset: "asset",
  myLedger: "myLedger",
  notification: "notification",
  landingPageCategory: "landingPageCategory",
  landingPageStickyCta: "landingPageStickyCta",
};
const AUTO_CATEGORY_SUBTITLE = "Also creates its required category shell automatically.";
const CATEGORIES_WITH_AUTO_SHELL = new Set<BuilderCategory>([
  "topWallet",
  "myLedger",
  "landingPageCategory",
]);

export const BUILDER_CATEGORY_TITLES: Record<BuilderCategory, string> = {
  topWallet: "Build a Top wallet card",
  wallet: "Build a Wallet card",
  asset: "Build an Asset card",
  myLedger: "Build a My Ledger card",
  notification: "Build a Notification center card",
  landingPageCategory: "Build a Landing page category card",
  landingPageStickyCta: "Build a Landing sticky CTA card",
};

const TOPWALLET_PRESETS = [
  "topWalletHardwareCarousel",
  "topWalletHero",
  "topWalletHeroCarousel",
  "topWalletAction",
] as const;
export const ALL_BUILDER_PRESETS: BuilderPreset[] = [
  "topWalletHardwareCarousel",
  "topWalletHero",
  "topWalletHeroCarousel",
  "topWalletAction",
  "walletCarousel",
  "asset",
  "myLedger",
  "notification",
  "landingPageCategory",
  "landingPageStickyCta",
];
export const CARDS_PER_PLACEMENT_SEED = 2;

function ChoiceButtons<T extends string>({
  values,
  selected,
  onSelect,
  getLabel = value => value,
}: Readonly<{
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  getLabel?: (value: T) => string;
}>) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "s8",
        marginBottom: "s12",
      }}
    >
      {values.map(value => (
        <LumenButton
          key={value}
          size="sm"
          appearance={selected === value ? "base" : "gray"}
          onPress={() => onSelect(value)}
        >
          {getLabel(value)}
        </LumenButton>
      ))}
    </Box>
  );
}
function SelectField<T extends string>({
  label,
  values,
  selected,
  onSelect,
  getLabel = value => value,
}: Readonly<{
  label: string;
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  getLabel?: (value: T) => string;
}>) {
  return (
    <Box>
      <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
        {label}
      </Text>
      <ChoiceButtons values={values} selected={selected} onSelect={onSelect} getLabel={getLabel} />
    </Box>
  );
}
const DEFAULT_ICON = "Settings";
// Fixed shortlist instead of a searchable picker over every Lumen icon - good enough
// for QA debug cards; swap back to a searchable picker if QA needs more variety.
const COMMON_ICON_NAMES: (keyof typeof Icons)[] = [
  "Settings",
  "Plus",
  "Gift",
  "Star",
  "Bell",
  "Wallet",
  "Coins",
  "Percentage",
];
function IconSelectField({
  selected,
  onSelect,
}: Readonly<{ selected: string; onSelect: (icon: string) => void }>) {
  return (
    <SelectField
      label="Icon"
      values={COMMON_ICON_NAMES}
      selected={(selected || DEFAULT_ICON) as keyof typeof Icons}
      onSelect={onSelect}
    />
  );
}
function IdentifierFields({
  values,
  onChange,
}: Readonly<{ values: CardBuilderValues; onChange: OnChangeField }>) {
  return (
    <>
      <GenericAwarenessModalField
        label="ID"
        value={values.id}
        onChangeText={value => onChange("id", value)}
      />
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }}>
        Must start with "{DEBUG_CARD_PREFIX}-".
      </Text>
      <GenericAwarenessModalField
        label="Order (lower shows first)"
        value={values.order}
        onChangeText={value => onChange("order", value)}
      />
    </>
  );
}

const CENTERED_TEXT_LABELS: Record<"true" | "false", string> = {
  true: "Centered",
  false: "Left-aligned",
};
const TOP_WALLET_ACTION_VISUAL_LABELS: Record<"icon" | "imageBackground", string> = {
  icon: "Icon",
  imageBackground: "Image background",
};
function CanvasTrackingFields({
  category,
  values,
  onChange,
  onChangeExtraField,
}: Readonly<{
  category: BuilderCategory | undefined;
  values: CardBuilderValues;
  onChange: OnChangeField;
  onChangeExtraField: OnChangeExtraField;
}>) {
  const hasCategoryShell = category ? CATEGORIES_WITH_AUTO_SHELL.has(category) : false;
  return (
    <>
      {hasCategoryShell ? (
        <GenericAwarenessModalField
          label="Category canvas name (used when the card below has none of its own)"
          value={values.categoryCanvasName}
          onChangeText={value => onChange("categoryCanvasName", value)}
        />
      ) : null}
      <GenericAwarenessModalField
        label="Canvas name"
        value={values.extras.canvas_name ?? ""}
        onChangeText={value => onChangeExtraField("canvas_name", value)}
      />
      <GenericAwarenessModalField
        label="Canvas step name (never inherited from the category above)"
        value={values.extras.canvas_step_name ?? ""}
        onChangeText={value => onChangeExtraField("canvas_step_name", value)}
      />
    </>
  );
}

function TopWalletFields({
  values,
  onChange,
  onChangeExtraField,
}: Readonly<{
  values: CardBuilderValues;
  onChange: OnChangeField;
  onChangeExtraField: OnChangeExtraField;
}>) {
  const isAction = values.type === ContentCardsType.action;
  const isHardwareCarousel =
    values.layout === ContentCardsLayout.carousel && values.type === ContentCardsType.smallSquare;
  const actionVisual =
    isAction && values.extras.image_background?.trim() ? "imageBackground" : "icon";
  return (
    <>
      <Box lx={{ marginBottom: "s12" }}>
        <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s4" }}>
          Category ID
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {values.categoryId} - shared by both Top wallet formats, like prod's "alwayson". Not
          editable here.
        </Text>
      </Box>
      {isHardwareCarousel ? (
        <GenericAwarenessModalField
          label="Section title (category header, e.g. Touchscreen offers)"
          value={values.categoryTitle}
          onChangeText={value => onChange("categoryTitle", value)}
        />
      ) : null}
      <GenericAwarenessModalField
        label={isHardwareCarousel ? "Product title (child card)" : "Title"}
        value={values.title}
        onChangeText={value => onChange("title", value)}
      />
      <GenericAwarenessModalField
        label="Description"
        value={values.description}
        onChangeText={value => onChange("description", value)}
        multiline
      />
      {isAction ? (
        <SelectField
          label="Action visual"
          values={["icon", "imageBackground"] as const}
          selected={actionVisual}
          onSelect={value => {
            if (value === "imageBackground") {
              onChangeExtraField("image_background", values.mediaUrl);
              return;
            }
            onChangeExtraField("image_background", "");
          }}
          getLabel={value => TOP_WALLET_ACTION_VISUAL_LABELS[value]}
        />
      ) : null}
      {isAction && actionVisual === "icon" ? (
        <IconSelectField
          selected={values.extras.icon ?? DEFAULT_ICON}
          onSelect={value => onChangeExtraField("icon", value)}
        />
      ) : null}
      <GenericAwarenessModalField
        label={isAction ? "Background image URL" : "Media URL"}
        value={values.mediaUrl}
        onChangeText={value => {
          onChange("mediaUrl", value);
          if (isAction && actionVisual === "imageBackground") {
            onChangeExtraField("image_background", value);
          }
        }}
      />
      {isAction ? null : (
        <>
          <GenericAwarenessModalField
            label="Tag (optional)"
            value={values.extras.tag ?? ""}
            onChangeText={value => onChangeExtraField("tag", value)}
          />
          <SelectField
            label="Text alignment"
            values={["false", "true"] as const}
            selected={values.extras.centeredText === "true" ? "true" : "false"}
            onSelect={value => onChangeExtraField("centeredText", value)}
            getLabel={value => CENTERED_TEXT_LABELS[value]}
          />
        </>
      )}
      <GenericAwarenessModalField
        label="CTA"
        value={values.cta}
        onChangeText={value => onChange("cta", value)}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}

function WalletFields({
  values,
  onChange,
  onChangeExtraField,
}: Readonly<{
  values: CardBuilderValues;
  onChange: OnChangeField;
  onChangeExtraField: OnChangeExtraField;
}>) {
  return (
    <>
      <GenericAwarenessModalField
        label="Title"
        value={values.title}
        onChangeText={value => onChange("title", value)}
      />
      <GenericAwarenessModalField
        label="Picto (crypto asset id, e.g. bitcoin - takes priority over Tag below when set)"
        value={values.extras.picto ?? ""}
        onChangeText={value => onChangeExtraField("picto", value)}
      />
      <GenericAwarenessModalField
        label="Tag"
        value={values.extras.tag ?? ""}
        onChangeText={value => onChangeExtraField("tag", value)}
      />
      <GenericAwarenessModalField
        label="Image URL"
        value={values.mediaUrl}
        onChangeText={value => {
          onChange("mediaUrl", value);
          onChangeExtraField("image_background", value);
        }}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}

const DISPLAY_ON_EVERY_ASSET_LABELS: Record<"true" | "false", string> = {
  true: "Yes, every asset",
  false: "No, only the ones above",
};

function AssetFields({
  values,
  onChange,
  onChangeExtraField,
}: Readonly<{
  values: CardBuilderValues;
  onChange: OnChangeField;
  onChangeExtraField: OnChangeExtraField;
}>) {
  return (
    <>
      <GenericAwarenessModalField
        label="Title"
        value={values.title}
        onChangeText={value => onChange("title", value)}
      />
      <GenericAwarenessModalField
        label="Assets (comma-separated ids, e.g. bitcoin,ethereum)"
        value={values.extras.assets ?? ""}
        onChangeText={value => onChangeExtraField("assets", value)}
      />
      <SelectField
        label="Show on every asset page?"
        values={["false", "true"] as const}
        selected={values.extras.displayOnEveryAssets === "true" ? "true" : "false"}
        onSelect={value =>
          onChangeExtraField("displayOnEveryAssets", value === "true" ? value : "")
        }
        getLabel={value => DISPLAY_ON_EVERY_ASSET_LABELS[value]}
      />
      <GenericAwarenessModalField
        label="Media URL"
        value={values.mediaUrl}
        onChangeText={value => onChange("mediaUrl", value)}
      />
      <GenericAwarenessModalField
        label="CTA"
        value={values.cta}
        onChangeText={value => onChange("cta", value)}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}

function NotificationFields({
  values,
  onChange,
}: Readonly<{ values: CardBuilderValues; onChange: OnChangeField }>) {
  return (
    <>
      <GenericAwarenessModalField
        label="Title"
        value={values.title}
        onChangeText={value => onChange("title", value)}
      />
      <GenericAwarenessModalField
        label="Description"
        value={values.description}
        onChangeText={value => onChange("description", value)}
        multiline
      />
      <GenericAwarenessModalField
        label="CTA"
        value={values.cta}
        onChangeText={value => onChange("cta", value)}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}
export function LandingPageSelect({
  value,
  onSelect,
  counts,
  splitByStatus,
}: Readonly<{
  value: string;
  onSelect: (value: LandingPageUseCase) => void;
  counts?: Partial<Record<LandingPageUseCase, number>>;
  splitByStatus?: boolean;
}>) {
  const getLabel = counts
    ? (useCase: LandingPageUseCase) => `${landingPageChipLabel(useCase)} (${counts[useCase] ?? 0})`
    : landingPageChipLabel;
  const activeUseCases = LANDING_PAGE_USE_CASES.filter(useCase => (counts?.[useCase] ?? 0) > 0);
  const emptyUseCases = LANDING_PAGE_USE_CASES.filter(useCase => (counts?.[useCase] ?? 0) === 0);

  if (counts && splitByStatus) {
    return (
      <Box lx={{ marginBottom: "s12" }}>
        <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
          Landing page
        </Text>
        {activeUseCases.length > 0 ? (
          <LandingPageSelectSection
            title="Active landing pages"
            values={activeUseCases}
            selected={value as LandingPageUseCase}
            onSelect={onSelect}
            getLabel={getLabel}
          />
        ) : null}
        <LandingPageSelectSection
          title="Empty landing pages"
          values={emptyUseCases}
          selected={value as LandingPageUseCase}
          onSelect={onSelect}
          getLabel={getLabel}
        />
        <Text typography="body2" lx={{ color: "muted", marginTop: "s8" }}>
          {getLocationExplanation(value)}
        </Text>
      </Box>
    );
  }

  return (
    <Box lx={{ marginBottom: "s12" }}>
      <SelectField
        label="Landing page"
        values={LANDING_PAGE_USE_CASES}
        selected={value as LandingPageUseCase}
        onSelect={onSelect}
        getLabel={getLabel}
      />
      <Text typography="body2" lx={{ color: "muted", marginTop: "s8" }}>
        {getLocationExplanation(value)}
      </Text>
    </Box>
  );
}

function LandingPageSelectSection({
  title,
  values,
  selected,
  onSelect,
  getLabel,
}: Readonly<{
  title: string;
  values: LandingPageUseCase[];
  selected: LandingPageUseCase;
  onSelect: (value: LandingPageUseCase) => void;
  getLabel: (value: LandingPageUseCase) => string;
}>) {
  return (
    <Box lx={{ marginBottom: "s12" }}>
      <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
        {title}
      </Text>
      <ChoiceButtons values={values} selected={selected} onSelect={onSelect} getLabel={getLabel} />
    </Box>
  );
}
const CARDS_TYPE_LABELS: Partial<Record<ContentCardsType, string>> = {
  [ContentCardsType.hero]: "Hero",
  [ContentCardsType.action]: "Action",
  [ContentCardsType.smallSquare]: "Small square",
  [ContentCardsType.mediumSquare]: "Medium square",
  [ContentCardsType.bigSquare]: "Big square",
};
const CHILD_CARD_TYPES = Object.keys(CARDS_TYPE_LABELS) as ContentCardsType[];

const CARDS_LAYOUT_LABELS: Record<ContentCardsLayout, string> = {
  [ContentCardsLayout.unique]: "Unique (one big card)",
  [ContentCardsLayout.carousel]: "Carousel",
  [ContentCardsLayout.grid]: "Grid",
};
const CHILD_CARD_LAYOUTS = Object.values(ContentCardsLayout);

function CategoryFormatFields({
  values,
  onChange,
}: Readonly<{ values: CardBuilderValues; onChange: OnChangeField }>) {
  return (
    <>
      <SelectField
        label="Card view (cardsType - decided by the category, never by the child)"
        values={CHILD_CARD_TYPES}
        selected={values.type}
        onSelect={value => onChange("type", value)}
        getLabel={value => CARDS_TYPE_LABELS[value] ?? value}
      />
      <SelectField
        label="Layout (cardsLayout)"
        values={CHILD_CARD_LAYOUTS}
        selected={values.layout}
        onSelect={value => onChange("layout", value)}
        getLabel={value => CARDS_LAYOUT_LABELS[value] ?? value}
      />
    </>
  );
}

function MyLedgerFields({
  values,
  onChange,
}: Readonly<{ values: CardBuilderValues; onChange: OnChangeField }>) {
  return (
    <>
      <CategoryFormatFields values={values} onChange={onChange} />
      <GenericAwarenessModalField
        label="Category ID"
        value={values.categoryId}
        onChangeText={value => onChange("categoryId", value)}
      />
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }}>
        Must start with "{DEBUG_CATEGORY_PREFIX}-".
      </Text>
      <GenericAwarenessModalField
        label="Title"
        value={values.title}
        onChangeText={value => onChange("title", value)}
      />
      <GenericAwarenessModalField
        label="Description"
        value={values.description}
        onChangeText={value => onChange("description", value)}
        multiline
      />
      <GenericAwarenessModalField
        label="Media URL"
        value={values.mediaUrl}
        onChangeText={value => onChange("mediaUrl", value)}
      />
      <GenericAwarenessModalField
        label="CTA"
        value={values.cta}
        onChangeText={value => onChange("cta", value)}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}

function LandingPageCategoryFields({
  values,
  onChange,
}: Readonly<{ values: CardBuilderValues; onChange: OnChangeField }>) {
  return (
    <>
      <LandingPageSelect value={values.location} onSelect={value => onChange("location", value)} />
      <CategoryFormatFields values={values} onChange={onChange} />
      <GenericAwarenessModalField
        label="Category ID"
        value={values.categoryId}
        onChangeText={value => onChange("categoryId", value)}
      />
      <Text typography="body3" lx={{ color: "muted", marginBottom: "s8" }}>
        Must start with "{DEBUG_CATEGORY_PREFIX}-".
      </Text>
      <GenericAwarenessModalField
        label="Title"
        value={values.title}
        onChangeText={value => onChange("title", value)}
      />
      <GenericAwarenessModalField
        label="Description"
        value={values.description}
        onChangeText={value => onChange("description", value)}
        multiline
      />
      <GenericAwarenessModalField
        label="Media URL"
        value={values.mediaUrl}
        onChangeText={value => onChange("mediaUrl", value)}
      />
      <GenericAwarenessModalField
        label="CTA"
        value={values.cta}
        onChangeText={value => onChange("cta", value)}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}

function LandingPageStickyCtaFields({
  values,
  onChange,
  onChangeExtraField,
}: Readonly<{
  values: CardBuilderValues;
  onChange: OnChangeField;
  onChangeExtraField: OnChangeExtraField;
}>) {
  const landingPage = values.extras.landingPage || LandingPageUseCase.LP_Stake;
  return (
    <>
      <LandingPageSelect
        value={landingPage}
        onSelect={value => onChangeExtraField("landingPage", value)}
      />
      <GenericAwarenessModalField
        label="CTA"
        value={values.cta}
        onChangeText={value => onChange("cta", value)}
      />
      <GenericAwarenessModalField
        label="Link or deeplink"
        value={values.link}
        onChangeText={value => onChange("link", value)}
      />
    </>
  );
}

export function BuilderForm({
  category,
  activePreset,
  values,
  warnings,
  onSelectPreset,
  onChange,
  onChangeExtraField,
  onCreate,
  onCopyPreview,
}: Readonly<{
  category: BuilderCategory | undefined;
  activePreset: BuilderPreset | undefined;
  values: CardBuilderValues;
  warnings: string[];
  onSelectPreset: (preset: BuilderPreset) => void;
  onChange: OnChangeField;
  onChangeExtraField: OnChangeExtraField;
  onCreate: () => void;
  onCopyPreview: () => void;
}>) {
  const variantPresets = category === "topWallet" ? TOPWALLET_PRESETS : undefined;
  const previewShape = activePreset
    ? BUILDER_PRESET_SHAPE[activePreset]
    : getLocationShape(values.location);

  return (
    <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s16" }}>
      {category ? (
        <>
          <Box lx={{ alignItems: "flex-start", marginBottom: "s12" }}>
            <ShapeTag shape={previewShape} />
          </Box>
          {CATEGORIES_WITH_AUTO_SHELL.has(category) ? (
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s12" }}>
              {AUTO_CATEGORY_SUBTITLE}
            </Text>
          ) : null}
          <BuilderPreview values={values} />
        </>
      ) : null}
      {variantPresets ? (
        <Box lx={{ marginBottom: "s12" }}>
          <SelectField
            label="Format"
            values={variantPresets}
            selected={(activePreset ?? variantPresets[0]) as (typeof variantPresets)[number]}
            onSelect={onSelectPreset}
            getLabel={preset => BUILDER_PRESET_LABELS[preset]}
          />
        </Box>
      ) : null}
      {category === "topWallet" ? (
        <TopWalletFields
          values={values}
          onChange={onChange}
          onChangeExtraField={onChangeExtraField}
        />
      ) : null}
      {category === "wallet" ? (
        <WalletFields values={values} onChange={onChange} onChangeExtraField={onChangeExtraField} />
      ) : null}
      {category === "asset" ? (
        <AssetFields values={values} onChange={onChange} onChangeExtraField={onChangeExtraField} />
      ) : null}
      {category === "myLedger" ? <MyLedgerFields values={values} onChange={onChange} /> : null}
      {category === "notification" ? (
        <NotificationFields values={values} onChange={onChange} />
      ) : null}
      {category === "landingPageCategory" ? (
        <LandingPageCategoryFields values={values} onChange={onChange} />
      ) : null}
      {category === "landingPageStickyCta" ? (
        <LandingPageStickyCtaFields
          values={values}
          onChange={onChange}
          onChangeExtraField={onChangeExtraField}
        />
      ) : null}
      <CanvasTrackingFields
        category={category}
        values={values}
        onChange={onChange}
        onChangeExtraField={onChangeExtraField}
      />
      <IdentifierFields values={values} onChange={onChange} />
      {warnings.map(warning => (
        <Text key={warning} typography="body2SemiBold" lx={{ color: "error", marginBottom: "s8" }}>
          - {warning}
        </Text>
      ))}
      <Box
        lx={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "s8",
          marginTop: "s8",
        }}
      >
        <LumenButton appearance="base" size="md" onPress={onCreate}>
          Create card
        </LumenButton>
        <LumenButton appearance="gray" size="md" onPress={onCopyPreview}>
          Copy raw JSON
        </LumenButton>
      </Box>
    </Box>
  );
}
const PREVIEWABLE_TYPES = new Set<ContentCardsType>([
  ContentCardsType.hero,
  ContentCardsType.action,
  ContentCardsType.smallSquare,
  ContentCardsType.mediumSquare,
  ContentCardsType.bigSquare,
]);
const NON_PREVIEWABLE_LOCATIONS = new Set<string>([
  ContentCardLocation.NotificationCenter,
  ContentCardLocation.LandingPageStickyCta,
]);

const VERTICAL_SIZE_BY_TYPE: Partial<Record<ContentCardsType, Size>> = {
  [ContentCardsType.smallSquare]: "S",
  [ContentCardsType.mediumSquare]: "M",
  [ContentCardsType.bigSquare]: "L",
};

const PREVIEW_METADATA: ContentCardMetadata = { id: "builder-preview" };

function PreviewFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box lx={{ gap: "s8", marginBottom: "s16" }}>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        Preview
      </Text>
      <Box
        lx={{
          backgroundColor: "surface",
          borderRadius: "md",
          padding: "s16",
          overflow: "hidden",
        }}
      >
        {children}
      </Box>
      <Text typography="body2" lx={{ color: "muted" }}>
        Approximate render - not clickable, spacing/theme may differ from the real placement.
      </Text>
    </Box>
  );
}

function BuilderPreview({ values }: Readonly<{ values: CardBuilderValues }>) {
  if (values.location === ContentCardLocation.Wallet) {
    const imageUrl = values.extras.image_background?.trim() || values.mediaUrl.trim();
    const picto = values.extras.picto?.trim();
    let badge: React.ReactNode;
    if (picto) {
      badge = <CryptoIcon ledgerId={picto} ticker={picto} size={32} />;
    } else if (values.extras.tag) {
      badge = <Tag label={values.extras.tag} size="md" />;
    }

    return (
      <PreviewFrame>
        <MediaCard imageUrl={imageUrl}>
          {badge}
          {values.title ? <MediaCardTitle>{values.title}</MediaCardTitle> : null}
        </MediaCard>
      </PreviewFrame>
    );
  }

  if (!PREVIEWABLE_TYPES.has(values.type) || NON_PREVIEWABLE_LOCATIONS.has(values.location)) {
    return null;
  }

  const common = {
    id: "builder-preview",
    createdAt: 0,
    viewed: false,
    type: values.type,
    metadata: PREVIEW_METADATA,
  };

  let preview: React.ReactNode;
  if (values.type === ContentCardsType.action) {
    const props = {
      ...common,
      title: values.title,
      description: values.description,
      image_background: values.extras.image_background,
      icon: values.extras.icon,
    } as unknown as Parameters<typeof ContentBannerActionCard>[0];
    preview = <ContentBannerActionCard {...props} />;
  } else if (values.type === ContentCardsType.hero) {
    preview = (
      <HeroCard
        {...common}
        title={values.title}
        image={values.mediaUrl}
        secondaryText={values.description}
        cta={values.cta}
        tag={values.extras.tag}
        centeredText={values.extras.centeredText === "true"}
      />
    );
  } else {
    preview = (
      <VerticalCard
        {...common}
        title={values.title}
        description={values.description}
        media={values.mediaUrl}
        cta={values.cta}
        tag={values.extras.tag}
        size={VERTICAL_SIZE_BY_TYPE[values.type] ?? "M"}
        widthFactor={WidthFactor.Full}
      />
    );
  }

  return <PreviewFrame>{preview}</PreviewFrame>;
}

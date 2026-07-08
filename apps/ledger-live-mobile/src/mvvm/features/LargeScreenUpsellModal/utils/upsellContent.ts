import { Image } from "react-native";
import {
  GenericAwarenessModalLayout,
  createThemedImageUrls,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { buildLargeScreenUpsellCtaLink } from "./upsellCta";

export type LargeScreenUpsellVariant = "opted_in" | "opted_out";

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export type BuildLargeScreenUpsellContentInput = Readonly<{
  id: string;
  variant: LargeScreenUpsellVariant;
  discount: number;
  optedInLink: string;
  optedOutLink: string;
  t: TranslationFn;
}>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const optedInHeroAsset = require("../assets/large_screen_upsell_opted_in.webp");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const optedOutHeroAsset = require("../assets/large_screen_upsell_opted_out.webp");

const optedInHeroImageUri =
  Image.resolveAssetSource(optedInHeroAsset).uri ?? optedInHeroAsset.testUri ?? "";
const optedOutHeroImageUri =
  Image.resolveAssetSource(optedOutHeroAsset).uri ?? optedOutHeroAsset.testUri ?? "";

const optedInHeroUrls = createThemedImageUrls(optedInHeroImageUri);
const optedOutHeroUrls = createThemedImageUrls(optedOutHeroImageUri);

export function buildLargeScreenUpsellContent({
  id,
  variant,
  discount,
  optedInLink,
  optedOutLink,
  t,
}: BuildLargeScreenUpsellContentInput): GenericAwarenessModalFeatureIntro {
  const discountPercentage = Math.max(0, Math.round(discount * 100));
  const primaryButtonLink = buildLargeScreenUpsellCtaLink(
    variant === "opted_in" ? optedInLink : optedOutLink,
  );

  const titleKey =
    variant === "opted_in"
      ? "largeScreenUpsellModal.optedIn.title"
      : "largeScreenUpsellModal.optedOut.title";
  const subtitleKey =
    variant === "opted_in"
      ? "largeScreenUpsellModal.optedIn.subtitle"
      : "largeScreenUpsellModal.optedOut.subtitle";
  const imageUrls = variant === "opted_in" ? optedInHeroUrls : optedOutHeroUrls;

  return {
    id,
    layout: GenericAwarenessModalLayout.FeatureIntro,
    ...imageUrls,
    title: t(titleKey, { discount: discountPercentage }),
    subtitle: t(subtitleKey, { discount: discountPercentage }),
    primaryButtonLabel: t("largeScreenUpsellModal.cta"),
    primaryButtonLink,
    secondaryButtonLabel: "",
    secondaryButtonLink: "",
    items: [],
    isReady: true,
  };
}

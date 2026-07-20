import { buildLargeScreenUpsellCtaLink } from "./upsellCta";

export type LargeScreenUpsellVariant = "opted_in" | "opted_out";

export type BuildLargeScreenUpsellContentInput = Readonly<{
  id: string;
  variant: LargeScreenUpsellVariant;
  discount: number;
  optedInLink: string;
  optedOutLink: string;
  medium: "mobile" | "desktop";
  t: (key: string, options?: Record<string, unknown>) => string;
  imageUrlLight?: string;
  imageUrlDark?: string;
}>;

export type LargeScreenUpsellContent = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  imageUrlLight: string;
  imageUrlDark: string;
}>;

export function buildLargeScreenUpsellContent({
  id,
  variant,
  discount,
  optedInLink,
  optedOutLink,
  medium,
  t,
  imageUrlLight = "",
  imageUrlDark = "",
}: BuildLargeScreenUpsellContentInput): LargeScreenUpsellContent {
  const discountPercentage = Math.max(0, Math.round(discount * 100));
  const primaryButtonLink = buildLargeScreenUpsellCtaLink(
    variant === "opted_in" ? optedInLink : optedOutLink,
    medium,
  );

  const titleKey =
    variant === "opted_in"
      ? "largeScreenUpsellModal.optedIn.title"
      : "largeScreenUpsellModal.optedOut.title";
  const subtitleKey =
    variant === "opted_in"
      ? "largeScreenUpsellModal.optedIn.subtitle"
      : "largeScreenUpsellModal.optedOut.subtitle";

  return {
    id,
    title: t(titleKey, { discount: discountPercentage }),
    subtitle: t(subtitleKey, { discount: discountPercentage }),
    primaryButtonLabel: t("largeScreenUpsellModal.cta"),
    primaryButtonLink,
    imageUrlLight,
    imageUrlDark,
  };
}

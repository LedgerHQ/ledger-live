import type { UseLargeScreenUpsellDecisionInput } from "../../hooks/useLargeScreenUpsellDecision";
import type {
  BuildLargeScreenUpsellContentInput,
  LargeScreenUpsellVariant,
} from "../../utils/upsellContent";
import type {
  LargeScreenUpsellDismissMethod,
  LargeScreenUpsellModalAnalyticsPorts,
} from "./analyticsPorts";

export type LargeScreenUpsellModalViewModel = {
  isOpen: boolean;
  imageSrc: string;
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  onDismiss: (method: LargeScreenUpsellDismissMethod) => void;
  onCtaPress: () => void;
};

export type UseLargeScreenUpsellModalViewModelInput = UseLargeScreenUpsellDecisionInput & {
  medium: "mobile" | "desktop";
  theme: "light" | "dark";
  variant: LargeScreenUpsellVariant;
  t: BuildLargeScreenUpsellContentInput["t"];
  openUrl: (url: string) => void;
  analytics?: LargeScreenUpsellModalAnalyticsPorts;
  /**
   * When false, close without counting a retry (e.g. another app-start modal has preference).
   * The host still marks the session blocked so the upsell does not reopen later.
   */
  isAllowedToDisplay?: boolean;
};

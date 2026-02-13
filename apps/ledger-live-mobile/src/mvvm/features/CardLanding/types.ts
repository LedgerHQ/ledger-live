import type { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";

/**
 * Available Card landing CTA identifiers
 */
export type CardLandingCtaId = "explore_cards" | "i_have_a_card";

/**
 * Represents a CTA button on the Card landing page
 */
export interface CardLandingCta {
  readonly id: CardLandingCtaId;
  readonly label: string;
  readonly icon: TileButtonProps["icon"];
  readonly onPress: () => void;
  readonly testID: string;
}

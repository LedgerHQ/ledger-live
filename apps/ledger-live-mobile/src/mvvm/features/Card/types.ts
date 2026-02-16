import type { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { ScreenName } from "~/const";

/**
 * Available Card landing CTA identifiers
 */
type CardLandingCtaId = "explore_cards" | "i_have_a_card";

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

export type CardLandingNavigatorParamList = {
  [ScreenName.Card]: undefined;
};

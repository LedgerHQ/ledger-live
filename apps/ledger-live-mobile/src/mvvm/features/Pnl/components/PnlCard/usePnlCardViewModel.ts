import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { TriangleDown, TriangleUp } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenTextStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CardType } from "@ledgerhq/lumen-ui-rnative";
import { PnlCardProps } from "./types";

const TREND_ICON = {
  up: TriangleUp,
  down: TriangleDown,
  neutral: undefined,
} as const;

const TREND_COLOR: Record<"up" | "down" | "neutral", LumenTextStyle["color"]> = {
  up: "success",
  down: "error",
  neutral: "muted",
};

export type PnlCardViewModel = {
  shouldRender: boolean;
  title: string;
  displayedValue: string;
  cardType: CardType;
  showInfoIcon: boolean;
  showChevron: boolean;
  TrendIcon?: typeof TriangleUp;
  trendColor?: LumenTextStyle["color"];
  onPress?: () => void;
  testID?: string;
};

export function usePnlCardViewModel(props: PnlCardProps): PnlCardViewModel {
  const { shouldDisplayPnl } = useWalletFeaturesConfig("mobile");

  const isInteractive = props.type === "interactive";
  const onPress = props.onPress;
  const cardType: CardType = onPress ? "interactive" : "info";

  return {
    shouldRender: shouldDisplayPnl,
    title: props.title,
    displayedValue: props.value,
    cardType,
    showInfoIcon: props.type === "info",
    showChevron: isInteractive,
    TrendIcon: isInteractive ? TREND_ICON[props.trend] : undefined,
    trendColor: isInteractive ? TREND_COLOR[props.trend] : undefined,
    onPress,
    testID: props.testID,
  };
}

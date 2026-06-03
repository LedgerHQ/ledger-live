import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
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
  const onPress = props.type === "value" ? undefined : props.onPress;
  const cardType: CardType = onPress ? "interactive" : "info";
  const TrendIcon = props.type === "info" ? undefined : TREND_ICON[props.trend];
  const trendColor = props.type === "info" ? undefined : TREND_COLOR[props.trend];

  return {
    shouldRender: shouldDisplayPnl,
    title: props.title,
    displayedValue: props.value,
    cardType,
    showInfoIcon: props.type === "info",
    showChevron: isInteractive,
    TrendIcon,
    trendColor,
    onPress,
    testID: props.testID,
  };
}

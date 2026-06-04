import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";

export type FearAndGreedExpandedCardProps = Readonly<{
  data: FearAndGreedIndex;
  width?: number;
  onPress?: () => void;
}>;

export type FearAndGreedExpandedCardSkeletonProps = Readonly<{
  width?: number;
  testID?: string;
}>;

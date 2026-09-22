import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";

export type FearAndGreedExpandedCardProps = Readonly<{
  data: FearAndGreedIndex;
  width?: number;
  onPress?: () => void;
}>;

export type FearAndGreedExpandedCardSkeletonProps = Readonly<{
  width?: number;
  testID?: string;
}>;

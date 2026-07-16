import type { FearAndGreedIndex } from "@domain/entity-market-sentiment";

export type FearAndGreedExpandedCardProps = Readonly<{
  data: FearAndGreedIndex;
  width?: number;
  onPress?: () => void;
}>;

export type FearAndGreedExpandedCardSkeletonProps = Readonly<{
  width?: number;
  testID?: string;
}>;

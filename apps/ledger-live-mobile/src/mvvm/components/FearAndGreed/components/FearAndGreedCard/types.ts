import type { FearAndGreedIndex } from "@domain/entity-market-sentiment";

export type FearAndGreedCardProps = Readonly<{
  data: FearAndGreedIndex;
  onPress?: () => void;
}>;

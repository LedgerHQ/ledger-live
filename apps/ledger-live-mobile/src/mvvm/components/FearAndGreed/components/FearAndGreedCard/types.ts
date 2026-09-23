import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";

export type FearAndGreedCardProps = Readonly<{
  data: FearAndGreedIndex;
  onPress?: () => void;
}>;

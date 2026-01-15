import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";

export type FearAndGreedCardProps = Readonly<{
  data: FearAndGreedIndex;
  onPress?: () => void;
}>;

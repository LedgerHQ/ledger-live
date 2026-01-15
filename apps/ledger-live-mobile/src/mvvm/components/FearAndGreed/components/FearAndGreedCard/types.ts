import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";

export interface FearAndGreedCardProps {
  readonly data: FearAndGreedIndex;
  readonly onPress?: () => void;
}

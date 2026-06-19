import React, { memo } from "react";
import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";
import { useMoodIndexAvailability } from "./hooks/useMoodIndexAvailability";
import { useFearAndGreedViewModel } from "./hooks/useFearAndGreedViewModel";
import { FearAndGreedTile } from "./components/FearAndGreedTile";
import { LoadingTile } from "./components/LoadingTile";

type FearAndGreedViewProps = {
  readonly isLoading: boolean;
  readonly data: FearAndGreedIndex | undefined;
};

const FearAndGreedView = memo(function FearAndGreedView({
  isLoading,
  data,
}: FearAndGreedViewProps) {
  let content: React.ReactNode = null;
  if (isLoading) {
    content = <LoadingTile />;
  } else if (data) {
    content = <FearAndGreedTile data={data} />;
  }

  return content;
});

const FearAndGreedContent = () => {
  const { isLoading, data } = useFearAndGreedViewModel();

  return <FearAndGreedView isLoading={isLoading} data={data} />;
};

const FearAndGreed = () => {
  const isMoodIndexAvailable = useMoodIndexAvailability();

  if (!isMoodIndexAvailable) return null;

  return <FearAndGreedContent />;
};

export { FearAndGreedView };
export default FearAndGreed;

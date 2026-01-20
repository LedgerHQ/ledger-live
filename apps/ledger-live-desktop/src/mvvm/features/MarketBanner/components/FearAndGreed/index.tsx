import React, { memo } from "react";
import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";
import { useFearAndGreedViewModel } from "../../hooks/useFearAndGreedViewModel";
import { LoadingTile } from "./LoadingTile";
import { FearAndGreedTile } from "./FearAndGreedTile";

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

const FearAndGreed = () => {
  const { isLoading, data } = useFearAndGreedViewModel();

  return <FearAndGreedView isLoading={isLoading} data={data} />;
};

export { FearAndGreedView };
export default FearAndGreed;

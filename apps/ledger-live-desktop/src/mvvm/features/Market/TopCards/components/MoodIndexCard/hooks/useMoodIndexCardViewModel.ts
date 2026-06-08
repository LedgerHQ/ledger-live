import { useFearAndGreedViewModel } from "LLD/features/FearAndGreed/hooks/useFearAndGreedViewModel";
import { track } from "~/renderer/analytics/segment";

export const useMoodIndexCardViewModel = () => {
  const { data, isError, isLoading } = useFearAndGreedViewModel();

  const onClick = () => {
    track("button_clicked", {
      button: "mood_index",
    });
  };

  return {
    data,
    isError,
    isLoading,
    onClick,
  };
};

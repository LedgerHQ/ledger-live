import { useFearAndGreedViewModel } from "LLD/features/FearAndGreed/hooks/useFearAndGreedViewModel";
import { track } from "@shared/analytics";

export const useMoodIndexCardViewModel = () => {
  const { data, isError, isLoading } = useFearAndGreedViewModel();

  const onClick = () => {
    track("button_clicked", {
      button: "mood_index_definition",
    });
  };

  return {
    data,
    isError,
    isLoading,
    onClick,
  };
};

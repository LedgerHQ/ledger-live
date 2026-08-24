import { useFeature } from "@features/platform-feature-flags";

export const useCardVisibility = (): boolean => {
  const lwdPayTab = useFeature("lwdPayTab");

  return !!lwdPayTab?.enabled;
};

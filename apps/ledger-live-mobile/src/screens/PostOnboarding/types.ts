import { PostOnboardingActionId } from "@ledgerhq/types-live";

export type ParamList = {
  PostOnboardingHub: Record<string, never>;
  PostOnboardingDebugScreen: Record<string, never>;
  PostOnboardingMockActionScreen: { id: PostOnboardingActionId };
};

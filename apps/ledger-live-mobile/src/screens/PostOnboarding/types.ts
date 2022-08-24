import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { ScreenName } from "../../const";

export type ParamList = {
  PostOnboardingHub: Record<string, never>;
  PostOnboardingDebugScreen: Record<string, never>;
  PostOnboardingMockActionScreen: { id: PostOnboardingActionId };
};

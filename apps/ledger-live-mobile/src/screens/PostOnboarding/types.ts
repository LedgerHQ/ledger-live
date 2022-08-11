import { PostOnboardingActionId } from "@ledgerhq/live-common/lib/postOnboarding/types";
import { ScreenName } from "../../const";

export type ParamList = {
  PostOnboardingHub: {};
  PostOnboardingDebugScreen: {};
  PostOnboardingMockActionScreen: { id: PostOnboardingActionId };
};

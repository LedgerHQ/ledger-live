import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { ScreenName } from "../../const";

export type ParamList = {
  PostOnboardingHub: {};
  PostOnboardingDebugScreen: {};
  PostOnboardingMockActionScreen: { id: PostOnboardingActionId };
};

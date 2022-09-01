import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type PostOnboardingNavigatorParamList = {
  [ScreenName.PostOnboardingHub]: Record<string, never>;
  [ScreenName.PostOnboardingDebugScreen]: Record<string, never>;
  [ScreenName.PostOnboardingMockActionScreen]: { id: PostOnboardingActionId };
};

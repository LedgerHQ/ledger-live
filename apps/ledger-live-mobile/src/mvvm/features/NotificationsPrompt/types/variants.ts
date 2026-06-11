import { FEATURE_FLAGS_SCHEMAS } from "@shared/feature-flags";

export const AB_TESTING_VARIANTS = FEATURE_FLAGS_SCHEMAS.lwmNewWordingOptInNotificationsDrawer
  .unwrap()
  .shape.params.unwrap().shape.variant.enum;

export type ABTestingVariants = (typeof AB_TESTING_VARIANTS)[keyof typeof AB_TESTING_VARIANTS];

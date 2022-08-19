export const testStoryInstanceID =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTIxOTh9.XqNitheri5VPDqebtA4JFu1VucVOHYlryki2TqCb1DQ";
export const onboardingTipsStoryInstanceID =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTI0ODh9.gFt9c5R8rLsnYpZfoBBchKqo9nEJJs5_G3-i215mTlU";

export const storyInstancesIDs = [onboardingTipsStoryInstanceID, testStoryInstanceID] as const;

export const storyInstancesIDsMap: Record<string, StorylyInstanceID> = {
  onboarding_tips: onboardingTipsStoryInstanceID,
  test_story: testStoryInstanceID,
};

export type StorylyInstanceID = typeof storyInstancesIDs[number];

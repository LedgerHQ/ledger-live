export const onboardingTipsStoryInstanceID =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTI0ODh9.gFt9c5R8rLsnYpZfoBBchKqo9nEJJs5_G3-i215mTlU";

const storyInstancesIDs = [onboardingTipsStoryInstanceID] as const;

export type StorylyInstanceID = typeof storyInstancesIDs[number];

export enum StorylyInstanceID {
  recoverySeed = "recoverySeed",
  testStory = "testStory",
  storylyExample = "storylyExample",
}

export type StorylyInstanceType = { testingEnabled: boolean; token: string; instanceId?: string };

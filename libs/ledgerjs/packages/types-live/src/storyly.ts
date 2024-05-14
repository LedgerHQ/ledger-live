export enum StorylyInstanceID {
  recoverySeed = "recoverySeed",
  backupRecoverySeed = "backupRecoverySeed",
  testStory = "testStory",
  storylyExample = "storylyExample",
}

export type StorylyInstanceType = { testingEnabled: boolean; token: string; instanceId?: string };

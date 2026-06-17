export const AB_TESTING_VARIANTS = {
  A: "A",
  B: "B",
} as const;

export type ABTestingVariants = (typeof AB_TESTING_VARIANTS)[keyof typeof AB_TESTING_VARIANTS];

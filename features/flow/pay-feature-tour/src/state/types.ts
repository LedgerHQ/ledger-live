/** Fully persisted across app restarts: every field is stored under the `payCard` key. */
export type PayCardFeatureTourState = Readonly<{
  hasSeenFeatureTour: boolean;
}>;

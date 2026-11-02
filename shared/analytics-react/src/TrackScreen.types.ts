export type TrackScreenProps = {
  /** First part of the event name. */
  category?: string;
  /** Second part of the event name. */
  name?: string;
  /** Should the full screen name become the `source` of further screen events. */
  refreshSource?: boolean;
  /** Send the screen event even when standard analytics tracking is disabled. */
  mandatory?: boolean;
  /**
   * Drop the event when the last screen event emitted was this same one.
   * @platform native
   */
  avoidDuplicates?: boolean;
  [key: string]: unknown;
};

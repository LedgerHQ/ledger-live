export type DataOfUser = {
  // timestamps in ms of every time the user dismisses the opt in prompt (until he opts in)
  dismissedOptInDrawerAtList?: number[];

  // This old logic is helpful to know if the user has already opted out of notifications
  /** If set, we will not prompt the push notification modal again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Maybe later" cta */
  alreadyDelayedToLater?: boolean;
};

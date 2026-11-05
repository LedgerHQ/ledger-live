export const copy = {
  analyticsIntroductionTitle: "Analytics card",
  dismissedStatus: "Dismissed — the card no longer shows on Account Detail.",
  visibleStatus: "Visible — the card shows on accounts with a confirmed operation.",
  reset: "Reset",
} as const;

export const statusOf = (hasDismissed: boolean) =>
  hasDismissed ? copy.dismissedStatus : copy.visibleStatus;

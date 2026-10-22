// React Navigation ships ESM and needs a navigator. A flow component renders outside one, so it
// stands as the focused screen: `TrackScreen` from `@shared/analytics-react` tracks on mount.
module.exports = {
  __esModule: true,
  useIsFocused: () => true,
};

export type RecorderConfig = {
  seed?: string;
  coinapps?: string;
  overridesAppPath?: string;
  goNextOnText?: string[];
  approveOnText?: string[];
};

export const recorderConfigDefaults = {
  goNextOnText: ["Login request", "Identify with your", "request?", "Ensure you trust the"],
  approveOnText: ["Log in to", "Enable"],
};

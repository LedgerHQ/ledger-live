import { useState } from "react";
import { useFeature } from "../featureFlags";

/** Only returns the value that the flag has at first render */
export const useLdmkFeatureFlagInitiallyEnabled = () => {
  const flagEnabled = !!useFeature("ldmkTransport")?.enabled;
  const [isEnabled] = useState(flagEnabled);
  return isEnabled;
};

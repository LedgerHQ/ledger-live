import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRef } from "react";

export const useLdmkFeatureEnabled = () => {
  const isEnabled = useRef(!!useFeature("ldmkTransport")?.enabled);
  return isEnabled.current;
};

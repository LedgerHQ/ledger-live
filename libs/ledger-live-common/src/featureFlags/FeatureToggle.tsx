import React, { ReactNode } from "react";

import useFeature from "./useFeature";
import type { FeatureId } from "@ledgerhq/types-live";

type Props = {
  feature: FeatureId;
  fallback?: ReactNode;
  children?: ReactNode;
};

const FeatureToggle = ({ feature: featureId, fallback, children }: Props): JSX.Element => {
  const feature = useFeature(featureId);

  if (!feature || !feature.enabled) {
    return <>{fallback || null}</>;
  }

  return <>{children || null}</>;
};

export default FeatureToggle;

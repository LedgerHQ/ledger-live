import React from "react";
import { Flex } from "@ledgerhq/react-ui/index";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import FeatureFlagDetails from "../FeatureFlagsSettings/FeatureFlagDetails";
import { MODULAR_DRAWER_FEATURE_FLAGS } from "./constants";

export const FeatureFlags = withV3StyleProvider(() => {
  const [focusedName, setFocusedName] = React.useState<string | undefined>();

  return (
    <Flex rowGap={1} flexDirection={"column"}>
      {MODULAR_DRAWER_FEATURE_FLAGS.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          flagName={flagName}
          setFocusedName={setFocusedName}
        />
      ))}
    </Flex>
  );
});

import React, { useCallback } from "react";
import ButtonV2 from "~/renderer/components/Button";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Text, Flex, Tag } from "@ledgerhq/react-ui";
import { FeatureId } from "@ledgerhq/types-live";
import { withV2StyleProvider } from "~/renderer/styles/StyleProvider";
import Box from "~/renderer/components/Box";
import FeatureFlagEdit from "./FeatureFlagEdit";

const OldButton = withV2StyleProvider(ButtonV2);

type Props = {
  flagName: FeatureId;
  focused?: boolean;
  setFocusedName: (arg0: string | undefined) => void;
};

const FeatureFlagDetails: React.FC<Props> = props => {
  const { flagName, focused, setFocusedName } = props;
  const { getFeature } = useFeatureFlags();
  const flagValue = getFeature(flagName as FeatureId);

  const {
    overriddenByEnv,
    overridesRemote,
    enabledOverriddenForCurrentLanguage,
    enabledOverriddenForCurrentDesktopVersion,
  } = flagValue || {};

  const handleClick = useCallback(() => {
    focused ? setFocusedName(undefined) : setFocusedName(flagName);
  }, [focused, flagName, setFocusedName]);

  if (!flagValue) return null;

  return (
    <>
      <OldButton flexDirection="row" py={1} onClick={handleClick}>
        <Flex flex={1} mr={3} alignItems="center">
          <Box
            bg={flagValue?.enabled ? "success.c50" : "error.c50"}
            height={10}
            width={10}
            mr={2}
            borderRadius={999}
          />
          <Text mr={1}>{flagName}</Text>
          {overriddenByEnv ? (
            <Tag active mx={1} type="opacity" size="small">
              overridden by env
            </Tag>
          ) : overridesRemote ? (
            <Tag active mx={1} type="opacity" size="small">
              overridden locally
            </Tag>
          ) : null}
          {enabledOverriddenForCurrentLanguage ? (
            <Tag active mx={1} type="outlinedOpacity" size="small">
              disabled for current language
            </Tag>
          ) : null}
          {enabledOverriddenForCurrentDesktopVersion ? (
            <Tag active mx={1} type="outlinedOpacity" size="small">
              disabled for current version
            </Tag>
          ) : null}
        </Flex>
      </OldButton>
      {focused ? <FeatureFlagEdit flagName={flagName} flagValue={flagValue} /> : null}
    </>
  );
};

export default FeatureFlagDetails;

import React from "react";
import { Pressable, View } from "react-native";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import type { FeatureId } from "@ledgerhq/types-live";

import { Flex, Divider, Tag } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import FeatureFlagEdit from "./FeatureFlagEdit";

export const TagEnabled = styled(Tag).attrs({
  bg: "success.c50",
  uppercase: false,
  type: "color",
  mr: 2,
})``;

export const TagDisabled = styled(Tag).attrs({
  bg: "error.c50",
  uppercase: false,
  type: "color",
  mr: 2,
})``;

type Props = {
  flagName: FeatureId;
  focused?: boolean;
  setFocusedName: (arg0: string | undefined) => void;
  isLast?: boolean;
};

const FeatureFlagDetails: React.FC<Props> = props => {
  const { flagName, focused, setFocusedName, isLast } = props;

  const { getFeature } = useFeatureFlags();
  const flagValue = getFeature(flagName as FeatureId);

  if (!flagValue) return null;

  const {
    overriddenByEnv,
    overridesRemote,
    enabledOverriddenForCurrentLanguage,
    enabledOverriddenForCurrentMobileVersion,
  } = flagValue;

  return (
    <View key={flagName}>
      <Pressable onPress={() => setFocusedName(focused ? undefined : flagName)}>
        <Flex flexDirection="row" alignItems="center" my={3} flexWrap="wrap">
          {flagValue?.enabled ? (
            <TagEnabled>{flagName}</TagEnabled>
          ) : (
            <TagDisabled>{flagName}</TagDisabled>
          )}
          {overriddenByEnv ? (
            <Tag my={1} mr={2}>
              overridden by env
            </Tag>
          ) : overridesRemote ? (
            <Tag my={1} mr={2}>
              overridden locally
            </Tag>
          ) : null}
          {enabledOverriddenForCurrentLanguage && (
            <Tag my={1} mr={2}>
              disabled for current language
            </Tag>
          )}
          {enabledOverriddenForCurrentMobileVersion && (
            <Tag my={1} mr={2}>
              disabled for current version
            </Tag>
          )}
        </Flex>
      </Pressable>
      {focused ? <FeatureFlagEdit flagName={flagName} flagValue={flagValue} /> : null}
      {!isLast && focused ? <Divider /> : null}
    </View>
  );
};

export default FeatureFlagDetails;

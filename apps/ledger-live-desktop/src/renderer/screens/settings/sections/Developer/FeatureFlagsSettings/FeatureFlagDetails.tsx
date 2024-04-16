import React, { useCallback } from "react";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Text, Flex, Tag } from "@ledgerhq/react-ui";
import { FeatureId } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import FeatureFlagEdit from "./FeatureFlagEdit";
import styled, { DefaultTheme, StyledComponent } from "styled-components";
import { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex";
import { useTranslation } from "react-i18next";

type Props = {
  flagName: FeatureId;
  focused?: boolean;
  setFocusedName: (arg0: string | undefined) => void;
};

export const Row: StyledComponent<"div", DefaultTheme, FlexBoxProps> = styled(Flex).attrs({
  px: 4,
  py: 1,
  padding: 4,
  flexDirection: "row",
  borderRadius: 1,
})`
  :hover {
    background: ${p => p.theme.colors.opacityDefault.c05};
  }
`;

const FeatureFlagDetails: React.FC<Props> = props => {
  const { flagName, focused, setFocusedName } = props;
  const { getFeature } = useFeatureFlags();
  const flagValue = getFeature(flagName as FeatureId);
  const { t } = useTranslation();

  const {
    overriddenByEnv,
    overridesRemote,
    enabledOverriddenForCurrentLanguage,
    enabledOverriddenForCurrentVersion,
  } = flagValue || {};

  const handleClick = useCallback(() => {
    focused ? setFocusedName(undefined) : setFocusedName(flagName);
  }, [focused, flagName, setFocusedName]);

  if (!flagValue) return null;

  return (
    <>
      <Row onClick={handleClick}>
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
              {t("settings.developer.overridden.byEnv")}
            </Tag>
          ) : overridesRemote ? (
            <Tag active mx={1} type="opacity" size="small">
              {t("settings.developer.overridden.overriddenLocally")}
            </Tag>
          ) : null}
          {enabledOverriddenForCurrentLanguage ? (
            <Tag active mx={1} type="outlinedOpacity" size="small">
              {t("settings.developer.overridden.disableForLanguage")}
            </Tag>
          ) : null}
          {enabledOverriddenForCurrentVersion ? (
            <Tag active mx={1} type="outlinedOpacity" size="small">
              {t("settings.developer.overridden.disableForVersion")}
            </Tag>
          ) : null}
        </Flex>
      </Row>
      {focused ? <FeatureFlagEdit flagName={flagName} flagValue={flagValue} /> : null}
    </>
  );
};

export default FeatureFlagDetails;

import { groupedFeatures } from "@ledgerhq/live-common/featureFlags/groupedFeatures";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/provider";
import { Flex, Link, Tag, Box, Switch, Text } from "@ledgerhq/react-ui";
import { FeatureId } from "@ledgerhq/types-live";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FeatureFlagDetails, { Row } from "./FeatureFlagDetails";

type Props = {
  groupName: string;
  focused: boolean;
  setFocusedGroupName: (name: string | undefined) => void;
};

const GroupedFeatures = ({ groupName, focused, setFocusedGroupName }: Props) => {
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const { featureIds } = groupedFeatures[groupName];
  const { t } = useTranslation();

  const { getFeature, overrideFeature, resetFeature } = useFeatureFlags();

  const flagsList = useMemo(
    () =>
      featureIds.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          flagName={flagName as FeatureId}
          setFocusedName={setFocusedName}
        />
      )),
    [featureIds, focusedName],
  );

  let someEnabled = false;
  let allEnabled = true;
  let someOverridden = false;
  featureIds.forEach(featureId => {
    const val = getFeature(featureId);
    const { enabled, overridesRemote } = val || {};
    someEnabled = someEnabled || Boolean(enabled);
    allEnabled = allEnabled && Boolean(enabled);
    someOverridden = someOverridden || Boolean(overridesRemote);
  });

  const handleSwitchChange = useCallback(() => {
    featureIds.forEach(featureId =>
      overrideFeature(featureId, { ...getFeature(featureId), enabled: !allEnabled }),
    );
  }, [allEnabled, featureIds, getFeature, overrideFeature]);

  const handleReset = useCallback(() => {
    featureIds.forEach(featureId => resetFeature(featureId));
  }, [featureIds, resetFeature]);

  return (
    <>
      <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
        <Row flex={1} onClick={() => setFocusedGroupName(focused ? undefined : groupName)}>
          <Flex flex={1} mr={3} alignItems="center">
            <Box
              bg={allEnabled ? "success.c50" : someEnabled ? "palette.warning.c50" : "error.c50"}
              height={10}
              width={10}
              mr={2}
              borderRadius={999}
            />
            <Text mr={1}>{groupName}</Text>
            {someOverridden ? (
              <Tag active mx={1} type="opacity" size="small">
                overridden locally
              </Tag>
            ) : null}
            <Flex flexDirection="row" alignItems={"center"}>
              {someOverridden ? (
                <Link size="small" type="color" onClick={handleReset}>
                  {t("settings.developer.featureFlagsRestore")}
                </Link>
              ) : null}
              <Flex mr={3} />
            </Flex>
          </Flex>
        </Row>
        <Switch name="group-feature-flags" checked={allEnabled} onChange={handleSwitchChange} />
      </Flex>
      {focused ? (
        <Flex pl={6} flexDirection="column">
          {flagsList}
        </Flex>
      ) : null}
    </>
  );
};

export default GroupedFeatures;

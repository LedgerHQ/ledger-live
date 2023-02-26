import { groupedFeatures } from "@ledgerhq/live-common/featureFlags/groupedFeatures";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/provider";
import { Divider, Flex, Link, Switch, Tag } from "@ledgerhq/native-ui";
import { FeatureId } from "@ledgerhq/types-live";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import FeatureFlagDetails, { TagEnabled } from "./FeatureFlagDetails";

type Props = {
  groupName: string;
  focused: boolean;
  setFocusedGroupName: (name: string | undefined) => void;
  isLast: boolean;
};

const GroupedFeatures: React.FC<Props> = ({
  groupName,
  focused,
  setFocusedGroupName,
  isLast,
}) => {
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const { featureIds } = groupedFeatures[groupName];
  const { t } = useTranslation();

  const { getFeature, overrideFeature, resetFeature } = useFeatureFlags();

  const flagsList = useMemo(
    () =>
      featureIds.map((flagName, index, arr) => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          flagName={flagName as FeatureId}
          setFocusedName={setFocusedName}
          isLast={index === arr.length - 1}
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

  const handleSwitchChange = useCallback(
    enabled => {
      featureIds.forEach(featureId =>
        overrideFeature(featureId, { ...getFeature(featureId), enabled }),
      );
    },
    [featureIds, getFeature, overrideFeature],
  );

  const handleReset = useCallback(() => {
    featureIds.forEach(featureId => resetFeature(featureId));
  }, [featureIds, resetFeature]);

  return (
    <Flex mb={2}>
      <Pressable
        onPress={() => setFocusedGroupName(focused ? undefined : groupName)}
      >
        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Flex flexDirection={"row"} alignItems="center">
            <TagEnabled
              backgroundColor={
                allEnabled
                  ? "success.c100"
                  : someEnabled
                  ? "warning.c100"
                  : "error.c100"
              }
            >
              {groupName}
            </TagEnabled>
            {someOverridden ? (
              <Tag my={1} mr={2}>
                overridden locally
              </Tag>
            ) : null}
          </Flex>
          <Flex flexDirection="row" alignItems={"center"}>
            {someOverridden ? (
              <Link size="small" type="color" onPress={handleReset}>
                {t("settings.debug.featureFlagsRestore")}
              </Link>
            ) : null}
            <Flex mr={3} />
            <Switch checked={allEnabled} onChange={handleSwitchChange} />
          </Flex>
        </Flex>
      </Pressable>
      {focused ? <Flex pl={6}>{flagsList}</Flex> : null}
      {!isLast && focused ? <Divider /> : null}
    </Flex>
  );
};

export default GroupedFeatures;

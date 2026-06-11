import { useFeatureFlags } from "@features/platform-feature-flags";
import { groupedFeatures, GroupedFeature, setOverride } from "@shared/feature-flags";
import type { FeatureId } from "@shared/feature-flags";
import { Divider, Flex, Link, Switch, Tag } from "@ledgerhq/native-ui";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "~/context/Locale";
import { Pressable } from "react-native";
import FeatureFlagDetails, { TagEnabled } from "./FeatureFlagDetails";

type Props = {
  groupName: GroupedFeature;
  focused: boolean;
  setFocusedGroupName: (name: GroupedFeature | undefined) => void;
  isLast: boolean;
};

const GroupedFeatures: React.FC<Props> = ({ groupName, focused, setFocusedGroupName, isLast }) => {
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const { featureIds } = groupedFeatures[groupName];
  const { t } = useTranslation();

  const flags = useFeatureFlags();
  const dispatch = useDispatch();

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
    const val = flags[featureId];
    const { enabled, overridesRemote } = val || {};
    someEnabled = someEnabled || Boolean(enabled);
    allEnabled = allEnabled && Boolean(enabled);
    someOverridden = someOverridden || Boolean(overridesRemote);
  });

  const handleSwitchChange = useCallback(
    (enabled: boolean) => {
      featureIds.forEach(featureId =>
        dispatch(
          setOverride({
            key: featureId,
            value: { ...flags[featureId], enabled, overridesRemote: true },
          }),
        ),
      );
    },
    [featureIds, flags, dispatch],
  );

  const handleReset = useCallback(() => {
    featureIds.forEach(featureId => dispatch(setOverride({ key: featureId, value: undefined })));
  }, [featureIds, dispatch]);

  return (
    <Flex mb={2}>
      <Pressable onPress={() => setFocusedGroupName(focused ? undefined : groupName)}>
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Flex flexDirection={"row"} alignItems="center">
            <TagEnabled
              backgroundColor={
                allEnabled ? "success.c50" : someEnabled ? "warning.c50" : "error.c50"
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

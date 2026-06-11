import { groupedFeatures, type GroupedFeature, setOverride } from "@shared/feature-flags";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { useDispatch } from "LLD/hooks/redux";
import { Flex, Link, Tag, Box, Text } from "@ledgerhq/react-ui";
import { Switch } from "@ledgerhq/lumen-ui-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FeatureFlagDetails, { Row } from "./FeatureFlagDetails";

type Props = {
  groupName: GroupedFeature;
  focused: boolean;
  setFocusedGroupName: (name: GroupedFeature | undefined) => void;
};

const GroupedFeatures = ({ groupName, focused, setFocusedGroupName }: Props) => {
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const { featureIds } = groupedFeatures[groupName];
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const flags = useFeatureFlags();

  const flagsList = useMemo(
    () =>
      featureIds.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          flagName={flagName}
          setFocusedName={setFocusedName}
        />
      )),
    [featureIds, focusedName],
  );

  let someEnabled = false;
  let allEnabled = true;
  let someOverridden = false;
  featureIds.forEach(featureId => {
    const { enabled, overridesRemote } = flags[featureId] ?? {};
    someEnabled = someEnabled || Boolean(enabled);
    allEnabled = allEnabled && Boolean(enabled);
    someOverridden = someOverridden || Boolean(overridesRemote);
  });

  const handleSwitchChange = useCallback(() => {
    featureIds.forEach(featureId =>
      dispatch(
        setOverride({ key: featureId, value: { ...flags[featureId], enabled: !allEnabled } }),
      ),
    );
  }, [allEnabled, featureIds, flags, dispatch]);

  const handleReset = useCallback(() => {
    featureIds.forEach(featureId => dispatch(setOverride({ key: featureId, value: undefined })));
  }, [featureIds, dispatch]);

  return (
    <>
      <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
        <Row flex={1} onClick={() => setFocusedGroupName(focused ? undefined : groupName)}>
          <Flex flex={1} mr={3} alignItems="center">
            <Box
              bg={allEnabled ? "success.c50" : someEnabled ? "warning.c50" : "error.c50"}
              height={10}
              width={10}
              mr={2}
              borderRadius={999}
            />
            <Text mr={1}>{groupName}</Text>
            {someOverridden ? (
              <Tag active mx={1} type="opacity" size="small">
                {t("settings.developer.overridden.overriddenLocally")}
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
        <Switch name="group-feature-flags" selected={allEnabled} onChange={handleSwitchChange} />
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

import React, { useEffect, useState, useCallback } from "react";
import ButtonV2 from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Flex, Button, Text } from "@ledgerhq/react-ui";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { useOpenAssetFlow } from "~/newArch/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "~/newArch/features/ModularDrawer";
import FeatureFlagDetails from "../FeatureFlagsSettings/FeatureFlagDetails";
import Switch from "~/renderer/components/Switch";
import Select from "~/renderer/components/Select";

const FeatureFlags = withV3StyleProvider(() => {
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const modularDrawerFeatureFlags = ["lldModularDrawer", "llmModularDrawer"];

  return (
    <Flex rowGap={1} flexDirection={"column"}>
      {modularDrawerFeatureFlags.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          flagName={flagName as FeatureId}
          setFocusedName={setFocusedName}
        />
      ))}
    </Flex>
  );
});

const entryPoints = [
  {
    value: ModularDrawerLocation.ADD_ACCOUNT,
    label: "Add Account",
  },
  {
    value: ModularDrawerLocation.EARN_FLOW,
    label: "Earn",
  },
  {
    value: ModularDrawerLocation.LIVE_APP,
    label: "Live App",
  },
  {
    value: ModularDrawerLocation.RECEIVE_FLOW,
    label: "Receive",
  },
  {
    value: ModularDrawerLocation.SEND_FLOW,
    label: "Send",
  },
];

export const ModularDrawerDevToolContent = (props: { expanded?: boolean }) => {
  const { t } = useTranslation();
  const [includeTokens, setIncludeTokens] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [entryPoint, setEntryPoint] = useState(entryPoints[0]);
  const { openAssetFlow } = useOpenAssetFlow(
    ModularDrawerLocation.ADD_ACCOUNT,
    "receive",
    openModal ? "MODAL_RECEIVE" : undefined,
  );

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.modularDrawerDevTool.description")}</div>
      {props.expanded && (
        <Flex flexDirection="column" rowGap={4} mt={2}>
          <FeatureFlags />
          <Flex flexDirection="column" justifyContent="center" width="250px">
            <Text variant="body" fontSize="14px" mb="2">
              Entry Point
            </Text>
            <Select
              value={entryPoint}
              options={entryPoints}
              onChange={option => option && setEntryPoint(option)}
              isSearchable={false}
            />
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            <Text variant="body" fontSize="14px" mr="2">
              Include Tokens
            </Text>
            <Switch isChecked={includeTokens} onChange={setIncludeTokens} />
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            <Text variant="body" fontSize="14px" mr="2">
              Open Modal ?
            </Text>
            <Switch isChecked={openModal} onChange={setOpenModal} />
          </Flex>
          <Flex>
            <Button variant="color" onClick={() => openAssetFlow(includeTokens)}>
              Open Drawer
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

const ModularDrawerDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(true);
  const location = useLocation<{ shouldOpenFeatureFlags?: boolean }>();

  useEffect(
    () => setContentExpanded(Boolean(location.state?.shouldOpenFeatureFlags)),
    [location.state?.shouldOpenFeatureFlags],
  );

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(!contentExpanded);
  }, [contentExpanded]);

  return (
    <Row
      title={t("settings.developer.modularDrawerDevTool.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<ModularDrawerDevToolContent expanded={contentExpanded} />}
    >
      <ButtonV2 small primary onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </ButtonV2>
    </Row>
  );
};

export default ModularDrawerDevTool;

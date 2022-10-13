import React, { useState, useMemo, useCallback } from "react";
import ButtonV2 from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { defaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { Input, Icons, Flex, SearchInput } from "@ledgerhq/react-ui";
import { FeatureId } from "@ledgerhq/types-live";
import { InputRenderLeftContainer } from "@ledgerhq/react-ui/components/form/BaseInput/index";
import { includes, lowerCase } from "lodash";
import { withV2StyleProvider } from "~/renderer/styles/StyleProvider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import FeatureFlagDetails from "./FeatureFlagDetails";

const OldButton = withV2StyleProvider(ButtonV2);

const FeatureFlagsSettings = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [hiddenFlagName, setHiddenFlagName] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(defaultFeatures);
    if (hiddenFlagName && !featureKeys.includes(hiddenFlagName)) featureKeys.push(hiddenFlagName);
    return featureKeys;
  }, [hiddenFlagName]);

  const handleAddHiddenFlag = useCallback(
    value => {
      setHiddenFlagName(value);
      setSearchInput(value);
    },
    [setSearchInput, setHiddenFlagName],
  );

  const filteredFlags = useMemo(() => {
    return featureFlags
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(name => !searchInput || includes(lowerCase(name), lowerCase(searchInput)));
  }, [featureFlags, searchInput]);

  const handleClick = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const content = useMemo(
    () =>
      filteredFlags.map(flagName => (
        <FeatureFlagDetails
          key={flagName}
          focused={focusedName === flagName}
          flagName={flagName as FeatureId}
          setFocusedName={setFocusedName}
        />
      )),
    [filteredFlags, focusedName],
  );

  return (
    <Row
      title={t("settings.developer.featureFlagsTitle")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: visible ? "flex-start" : "center" }}
      desc={
        <Flex flexDirection="column" pt={2} rowGap={1} alignSelf="stretch">
          {t("settings.developer.featureFlagsDesc")}
          {!visible ? null : (
            <>
              <SearchInput
                placeholder="Search"
                value={searchInput}
                onChange={setSearchInput}
                clearable
              />
              <Input
                renderLeft={() => (
                  <InputRenderLeftContainer>
                    <Icons.PlusMedium color="neutral.c80" />
                  </InputRenderLeftContainer>
                )}
                clearable
                placeholder="Add missing flag"
                value={hiddenFlagName}
                onChange={handleAddHiddenFlag}
              />
              <Flex height={15} />
              {content}
            </>
          )}
        </Flex>
      }
    >
      <OldButton small primary onClick={handleClick}>
        {visible ? "Hide" : "Show"}
      </OldButton>
    </Row>
  );
};

export default withV3StyleProvider(FeatureFlagsSettings);

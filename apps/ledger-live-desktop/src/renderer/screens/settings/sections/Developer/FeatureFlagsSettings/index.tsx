import React, { useState, useMemo, useCallback, useRef } from "react";
import ButtonV2 from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import {
  defaultFeatures,
  useFeature,
  useFeatureFlags,
} from "@ledgerhq/live-common/featureFlags/index";
import { Input, Icons, Flex, SearchInput, Alert, Tag } from "@ledgerhq/react-ui";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { FeatureId } from "@ledgerhq/types-live";
import { InputRenderLeftContainer } from "@ledgerhq/react-ui/components/form/BaseInput/index";
import { includes, lowerCase, trim } from "lodash";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import FeatureFlagDetails from "./FeatureFlagDetails";

const addFlagHint = `\
If a feature flag is defined in the targeted Firebase environment \
but it is missing from the following list, you can type its name in \
the input field below and it will appear in the list. Type the \
flag name in camelCase without the "feature" prefix.\
`;

export const FeatureFlagContent = withV3StyleProvider((props: { visible?: boolean }) => {
  const { t } = useTranslation();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [hiddenFlagName, setHiddenFlagName] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const trimmedHiddenFlagName = trim(hiddenFlagName);

  const featureFlags = useMemo(() => {
    const featureKeys = Object.keys(defaultFeatures);
    if (trimmedHiddenFlagName && !featureKeys.includes(trimmedHiddenFlagName))
      featureKeys.push(trimmedHiddenFlagName);
    return featureKeys;
  }, [trimmedHiddenFlagName]);

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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressCount = useRef(0);

  const { getFeature, overrideFeature } = useFeatureFlags();

  const [cheatActivated, setCheatActivated] = useState(false);
  const ruleThemAll = useCallback(() => {
    (["customImage", "deviceInitialApps", "syncOnboarding"] as FeatureId[]).forEach(featureId =>
      overrideFeature(featureId, { ...getFeature(featureId), enabled: true }),
    );
    setCheatActivated(true);
  }, [overrideFeature, getFeature]);

  const onDescriptionClick = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pressCount.current += 1;
    const timeout = setTimeout(() => {
      pressCount.current = 0;
    }, 300);
    if (pressCount.current > 6) {
      ruleThemAll();
      pressCount.current = 0;
    }
    timeoutRef.current = timeout;
    return () => {
      clearTimeout(timeout);
    };
  }, [ruleThemAll]);

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

  const config = useFeature("firebaseEnvironmentReadOnly");
  const project = config?.params?.project;

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div onClick={onDescriptionClick}>
        {t("settings.developer.featureFlagsDesc")}
        {cheatActivated ? " With great power comes great responsibility." : null}
      </div>
      {!props.visible ? null : (
        <>
          <Flex flexDirection="row" alignItems="center" columnGap={3}>
            {t("settings.developer.firebaseProject")}
            <Tag type="opacity" size="small" textProps={{ uppercase: false }} active>
              {project}
            </Tag>
          </Flex>
          <SearchInput
            placeholder="Search"
            value={searchInput}
            onChange={setSearchInput}
            clearable
          />
          <Alert type="info" title={addFlagHint} showIcon={false} />
          <Input
            renderLeft={() => (
              <InputRenderLeftContainer>
                <Icons.PlusMedium color="neutral.c80" />
              </InputRenderLeftContainer>
            )}
            clearable
            placeholder={"Add missing flag (instructions above)"}
            value={hiddenFlagName}
            onChange={handleAddHiddenFlag}
          />
          <Flex height={15} />
          {content}
        </>
      )}
    </Flex>
  );
});

const FeatureFlagsSettings = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const handleClick = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  return (
    <Row
      title={t("settings.developer.featureFlagsTitle")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: visible ? "flex-start" : "center" }}
      desc={<FeatureFlagContent visible={visible} />}
    >
      <ButtonV2 small primary onClick={handleClick}>
        {visible ? "Hide" : "Show"}
      </ButtonV2>
    </Row>
  );
};

export default FeatureFlagsSettings;

import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  parseContentAbTestPayload,
  setContentAbTestOverride,
  type ContentAbTestPayload,
} from "@features/platform-content-ab-tests";
import { Text, Flex, Button, Switch } from "@ledgerhq/native-ui";
import { InputRenderRightContainer } from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";
import { useTheme } from "styled-components/native";
import { refreshMountedScreens } from "./refreshMountedScreens";

const EMPTY_PAYLOAD: ContentAbTestPayload = { enabled: false, copy: {} };

const formatPayload = (value: ContentAbTestPayload) => JSON.stringify(value, null, 2);

const ContentAbTestEdit: React.FC<{
  testName: string;
  testValue: ContentAbTestPayload | undefined;
}> = ({ testName, testValue }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pureValue = testValue ?? EMPTY_PAYLOAD;
  const [error, setError] = useState<string | undefined>();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const stringifiedPureValue = useMemo(() => formatPayload(pureValue), [pureValue]);
  const inputValueDefaulted = inputValue ?? stringifiedPureValue;

  const isChecked = useMemo(() => {
    try {
      return JSON.parse(inputValueDefaulted)?.enabled === true;
    } catch {
      return false;
    }
  }, [inputValueDefaulted]);

  const handleInputChange = useCallback((value: string) => {
    setError(undefined);
    setInputValue(value);
  }, []);

  const handleRestore = useCallback(() => {
    setError(undefined);
    setInputValue(undefined);
    setContentAbTestOverride(testName, undefined);
    refreshMountedScreens();
  }, [testName]);

  const handleOverride = useCallback(() => {
    setError(undefined);
    try {
      const payload = parseContentAbTestPayload(JSON.parse(inputValueDefaulted));
      if (!payload) {
        setError(t("settings.debug.contentAbTests.invalidPayload"));
        return;
      }
      setInputValue(undefined);
      setContentAbTestOverride(testName, payload);
      refreshMountedScreens();
    } catch (error) {
      setError(String(error));
    }
  }, [inputValueDefaulted, testName, t]);

  const handleSwitchChange = useCallback(
    (enabled: boolean) => {
      setError(undefined);
      setInputValue(undefined);
      setContentAbTestOverride(testName, { ...pureValue, enabled });
      refreshMountedScreens();
    },
    [testName, pureValue],
  );

  return (
    <Flex>
      <TextInput
        testID="content-ab-test-payload"
        style={{
          borderWidth: 1,
          borderColor: error ? colors.error.c60 : colors.primary.c80,
          borderRadius: 8,
          padding: 4,
          backgroundColor: colors.neutral.c30,
          color: colors.neutral.c100,
        }}
        value={inputValueDefaulted}
        onChangeText={handleInputChange}
        multiline
        autoCapitalize="none"
        underlineColorAndroid="transparent"
      />
      {error ? (
        <Flex mt={2}>
          <Text color="error.c60">{error}</Text>
        </Flex>
      ) : null}
      <Flex flexDirection="row" mt={3} alignItems="center">
        <InputRenderRightContainer>
          <Switch
            testID="content-ab-test-enabled"
            checked={isChecked}
            onChange={handleSwitchChange}
          />
        </InputRenderRightContainer>
        <Button size="small" type="main" outline onPress={handleRestore}>
          {t("settings.debug.featureFlagsRestore")}
        </Button>
        <Button
          size="small"
          type="main"
          disabled={inputValue === undefined}
          onPress={handleOverride}
          ml="3"
        >
          {t("common.apply")}
        </Button>
      </Flex>
      <Flex mt={2} backgroundColor="neutral.c30" p={2}>
        <ScrollView horizontal>
          <Text selectable>{formatPayload(pureValue)}</Text>
        </ScrollView>
      </Flex>
    </Flex>
  );
};

export default ContentAbTestEdit;

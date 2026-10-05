import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  parseContentAbTestPayload,
  setContentAbTestOverride,
  type ContentAbTestPayload,
} from "@features/platform-content-ab-tests";
import { Box, Button, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { refreshMountedScreens } from "./refreshMountedScreens";

const EMPTY_PAYLOAD: ContentAbTestPayload = { enabled: false, copy: {} };

const formatPayload = (value: ContentAbTestPayload) => JSON.stringify(value, null, 2);

const ContentAbTestEdit: React.FC<{
  testName: string;
  testValue: ContentAbTestPayload | undefined;
}> = ({ testName, testValue }) => {
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
    <Box lx={{ gap: "s12" }}>
      <TextInput
        testID="content-ab-test-payload"
        style={[styles.editor, error ? styles.editorError : null]}
        value={inputValueDefaulted}
        onChangeText={handleInputChange}
        multiline
        autoCapitalize="none"
        underlineColorAndroid="transparent"
      />
      {error ? (
        <Text typography="body2" lx={{ color: "error" }}>
          {error}
        </Text>
      ) : null}
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}>
        <Switch
          testID="content-ab-test-enabled"
          checked={isChecked}
          onCheckedChange={handleSwitchChange}
        />
        <Button appearance="gray" size="sm" onPress={handleRestore}>
          {t("settings.debug.featureFlagsRestore")}
        </Button>
        <Button
          appearance="accent"
          size="sm"
          disabled={inputValue === undefined}
          onPress={handleOverride}
        >
          {t("common.apply")}
        </Button>
      </Box>
      <Box lx={{ padding: "s8", backgroundColor: "surface" }}>
        <ScrollView horizontal>
          <Text typography="body2" selectable>
            {formatPayload(pureValue)}
          </Text>
        </ScrollView>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  editor: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minHeight: 96,
  },
  editorError: {
    borderColor: "red",
  },
});

export default ContentAbTestEdit;

import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  parseContentAbTestPayload,
  setContentAbTestOverride,
  type ContentAbTestPayload,
} from "@features/platform-content-ab-tests";
import { Box, Button, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { refreshMountedScreens } from "./refreshMountedScreens";

const EMPTY_PAYLOAD: ContentAbTestPayload = { enabled: false, copy: {} };

const formatPayload = (value: ContentAbTestPayload) => JSON.stringify(value, null, 2);

const ContentAbTestEdit: React.FC<{
  testName: string;
  testValue: ContentAbTestPayload | undefined;
}> = ({ testName, testValue }) => {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      editor: {
        borderWidth: theme.borderWidth.s1,
        borderColor: theme.colors.border.muted,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacings.s8,
        minHeight: 96,
        color: theme.colors.text.base,
      },
      editorError: {
        borderColor: theme.colors.border.error,
      },
    }),
    [],
  );
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
          <Text typography="body2" lx={{ color: "base" }} selectable>
            {formatPayload(pureValue)}
          </Text>
        </ScrollView>
      </Box>
    </Box>
  );
};

export default ContentAbTestEdit;

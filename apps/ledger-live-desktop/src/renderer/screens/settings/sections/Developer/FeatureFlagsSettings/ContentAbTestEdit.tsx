import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  parseContentAbTestPayload,
  setContentAbTestOverride,
  type ContentAbTestPayload,
} from "~/firebase/contentAbTestCopy";
import { Text, Input, Flex } from "@ledgerhq/react-ui";
import { Switch, Button } from "@ledgerhq/lumen-ui-react";
import { InputRenderRightContainer } from "@ledgerhq/react-ui/components/form/BaseInput/index";
import Alert from "~/renderer/components/Alert";

const EMPTY_PAYLOAD: ContentAbTestPayload = { enabled: false, copy: {} };

const ContentAbTestEdit: React.FC<{
  testName: string;
  testValue: ContentAbTestPayload | undefined;
}> = ({ testName, testValue }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | undefined>();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const pureValue = testValue ?? EMPTY_PAYLOAD;
  const stringifiedPureValue = useMemo(() => JSON.stringify(pureValue), [pureValue]);
  const inputValueDefaulted = inputValue || stringifiedPureValue;

  const isChecked = useMemo(() => {
    try {
      return JSON.parse(inputValueDefaulted)?.enabled === true;
    } catch {
      return false;
    }
  }, [inputValueDefaulted]);

  const handleInputChange = useCallback((value?: string) => {
    setError(undefined);
    setInputValue(value);
  }, []);

  const handleRestoreContentAbTest = useCallback(() => {
    setError(undefined);
    setInputValue(undefined);
    setContentAbTestOverride(testName, undefined);
  }, [testName]);

  const handleOverrideContentAbTest = useCallback(() => {
    setError(undefined);
    try {
      const payload = parseContentAbTestPayload(JSON.parse(inputValueDefaulted));
      if (!payload) {
        setError(t("settings.developer.contentAbTests.invalidPayload"));
        return;
      }
      setInputValue(undefined);
      setContentAbTestOverride(testName, payload);
    } catch (e) {
      setError(String(e));
    }
  }, [inputValueDefaulted, testName, t]);

  const handleSwitchChange = useCallback(() => {
    setError(undefined);
    setInputValue(undefined);
    setContentAbTestOverride(testName, { ...pureValue, enabled: !isChecked });
  }, [testName, pureValue, isChecked]);

  return (
    <Flex flexDirection="column" pl={6} rowGap={3}>
      <Flex flex={1} flexDirection="row" alignItems={"center"} columnGap={2}>
        {error ? (
          <Alert mb={3} type="warning">
            {error}
          </Alert>
        ) : null}
        <Flex flex={1} flexDirection="column">
          <Input
            value={inputValueDefaulted}
            onChange={handleInputChange}
            renderRight={() => (
              <InputRenderRightContainer>
                <Switch
                  name={`content-ab-test-${testName}`}
                  selected={isChecked}
                  onChange={handleSwitchChange}
                />
              </InputRenderRightContainer>
            )}
          />
        </Flex>
        <Button appearance="transparent" onClick={handleRestoreContentAbTest}>
          {t("settings.developer.featureFlagsRestore")}
        </Button>
        <Button disabled={!inputValue} appearance="base" onClick={handleOverrideContentAbTest}>
          {t("settings.developer.featureFlagsOverride")}
        </Button>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c30" overflowX={"scroll"}>
        <Text whiteSpace="pre">{JSON.stringify(pureValue, null, 2)}</Text>
      </Flex>
    </Flex>
  );
};

export default ContentAbTestEdit;

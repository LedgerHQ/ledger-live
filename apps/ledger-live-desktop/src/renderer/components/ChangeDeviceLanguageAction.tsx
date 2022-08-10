import React, { useCallback, useEffect } from "react";

import { command } from "~/renderer/commands";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "./DeviceAction";
import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Button, Divider, Flex, Icons, Log } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const installLanguageExec = command("installLanguage");
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : installLanguageExec);

const DeviceLanguageInstalled = ({
  onContinue,
  onMount,
}: {
  onContinue: () => void;
  onMount: () => void;
}) => {
  useEffect(() => onMount(), []);

  const { t } = useTranslation();

  return (
    <Flex height="100%" flexDirection="column" data-test-id="language-installed">
      <Flex flex={1} flexDirection="column" alignItems="center" justifyContent="center">
        <BoxedIcon Icon={Icons.CheckAloneMedium} iconColor="success.c100" size={64} iconSize={24} />
        <Log extraTextProps={{ fontSize: 20 }} alignSelf="stretch" mx={16} mt={10}>
          {t("deviceLocalization.languageInstalled")}
        </Log>
      </Flex>
      <Flex flexDirection="column" rowGap={10}>
        <Divider variant="light" />
        <Flex alignSelf="end">
          <Button
            variant="main"
            onClick={onContinue}
            data-test-id="close-language-installation-button"
          >
            {t("common.close")}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

type Props = {
  language: Language;
  onResult?: () => void;
  onError?: () => void;
  onSuccess: () => void;
  onContinue: () => void;
};

const ChangeDeviceLanguageAction: React.FC<Props> = ({
  language,
  onResult,
  onContinue,
  onError,
  onSuccess,
}) => {
  const Result = useCallback(() => {
    return <DeviceLanguageInstalled onContinue={onContinue} onMount={onSuccess} />;
  }, [onContinue, onSuccess]);

  return (
    <DeviceAction
      action={action}
      request={language}
      onResult={onResult}
      Result={Result}
      onError={onError}
    />
  );
};

export default withV3StyleProvider(ChangeDeviceLanguageAction);

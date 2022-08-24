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

const DeviceLanguageInstalled = () => {
  const { t } = useTranslation();

  return (
    <Flex
      flex={1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      data-test-id="language-installed"
    >
      <BoxedIcon Icon={Icons.CheckAloneMedium} iconColor="success.c100" size={64} iconSize={24} />
      <Log extraTextProps={{ fontSize: 20 }} alignSelf="stretch" mx={16} mt={10}>
        {t("deviceLocalization.languageInstalled")}
      </Log>
    </Flex>
  );
};

type Props = {
  language: Language;
  onResult?: () => void;
  onError?: (error: Error) => void;
  onSuccess: () => void;
};

const ChangeDeviceLanguageAction: React.FC<Props> = ({ language, onError, onSuccess }) => {
  return (
    <DeviceAction
      action={action}
      request={language}
      onResult={onSuccess}
      Result={DeviceLanguageInstalled}
      onError={onError}
    />
  );
};

export default withV3StyleProvider(ChangeDeviceLanguageAction);

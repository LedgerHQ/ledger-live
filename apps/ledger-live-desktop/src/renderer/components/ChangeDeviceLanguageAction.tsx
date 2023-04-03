import React from "react";

import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "./DeviceAction";
import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, Icons, Text } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : installLanguage);

const DeviceLanguageInstalled = ({ language }: { language: Language }) => {
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
      <Text variant="large" alignSelf="stretch" mx={16} mt={10} textAlign="center" fontSize={24}>
        {t("deviceLocalization.languageInstalled", {
          language: t(`deviceLocalization.languages.${language}`),
        })}
      </Text>
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
      Result={() => <DeviceLanguageInstalled language={language} />}
      onError={onError}
    />
  );
};

export default withV3StyleProvider(React.memo(ChangeDeviceLanguageAction));

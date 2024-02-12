import React, { useMemo } from "react";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import { createAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { getEnv } from "@ledgerhq/live-env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "./DeviceAction";
import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, IconsLegacy, Text } from "@ledgerhq/react-ui";
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
      <BoxedIcon
        Icon={IconsLegacy.CheckAloneMedium}
        iconColor="success.c60"
        size={64}
        iconSize={24}
      />
      <Text variant="large" alignSelf="stretch" mt={9} textAlign="center">
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
  const request = useMemo(() => ({ language }), [language]);

  return (
    <DeviceAction
      action={action}
      request={request}
      inlineRetry={false}
      onResult={onSuccess}
      Result={() => <DeviceLanguageInstalled language={language} />}
      onError={onError}
    />
  );
};

export default withV3StyleProvider(React.memo(ChangeDeviceLanguageAction));

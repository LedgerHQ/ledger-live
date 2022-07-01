import React, { useMemo } from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import {
  FTXProviders,
  getFTXURL,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";

interface Props {
  provider: FTXProviders;
  onPress: () => void;
}

export function LoginButton({ provider, onPress }: Props) {
  const { t } = useTranslation();

  if (!provider) {
    return null;
  }

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={4}
      marginY={4}
      border={1}
      borderRadius={4}
      backgroundColor="primary.c10"
    >
      <Text color="primary.c70">
        {t("transfer.swap2.form.providers.login.required")}
      </Text>
      <Button type="main" size="small" onPress={onPress}>
        {t("transfer.swap2.form.providers.login.complete")}
      </Button>
    </Flex>
  );
}

interface WidgetProps {
  provider: FTXProviders;
}

export function LoginWidget({ provider }: WidgetProps) {
  const uri = useMemo(() => getFTXURL({ type: "login", provider }), [provider]);

  return <WebView source={{ uri }} />;
}

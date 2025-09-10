import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import SafeAreaView from "~/components/SafeAreaView";
import { Text } from "@ledgerhq/native-ui";
import storage from "LLM/storage";
import { ScreenName } from "~/const";

import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { TouchableOpacity } from "react-native";

export default function ReceiveTypeMenu({
  navigation,
  route,
}: StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveTypeMenu>) {
  const { t } = useTranslation();
  const receiveCryptoEntryPoint = route.params?.receiveCryptoEntryPoint;
  const [entryScreenInfo, setEntryScreenInfo] = React.useState<{
    screen: ScreenName;
    params?: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (!receiveCryptoEntryPoint) {
        const [entryScreen, entryParamsString] = await Promise.all([
          storage.getString("receive-entry-screen"),
          storage.getString("receive-entry-params"),
        ]);

        setEntryScreenInfo({
          screen: (entryScreen as ScreenName) || ScreenName.ReceiveSelectCrypto,
          params: entryParamsString ? JSON.parse(entryParamsString) : undefined,
        });

        return;
      }

      await Promise.all([
        storage.saveString("receive-entry-screen", receiveCryptoEntryPoint.screen),
        storage.saveString(
          "receive-entry-params",
          receiveCryptoEntryPoint.params ? JSON.stringify(receiveCryptoEntryPoint.params) : "",
        ),
      ]);

      setEntryScreenInfo(receiveCryptoEntryPoint);
    })();
  }, [receiveCryptoEntryPoint]);

  if (!entryScreenInfo) return null;

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <Text variant="h4" fontWeight="semiBold" mx={6} testID="receive-header-step1-title">
        {t("transfer.receive.title")}
      </Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(entryScreenInfo.screen, entryScreenInfo.params);
        }}
      >
        <Text>{t("transfer.receive.menu.crypto.title")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ScreenName.ReceiveProvider, { manifestId: "cl-card" });
        }}
      >
        <Text>{t("transfer.receive.menu.fiat.title")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

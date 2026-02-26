import React, { useMemo } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useTranslation } from "~/context/Locale";

import { Flex, Icon, Text } from "@ledgerhq/native-ui";

import storage from "LLM/storage";
import { useNavigation } from "@react-navigation/native";

import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { handleBackToLwEntryPoint } from "./handleBackToLwEntryPoint";

export type BackConfig = {
  screen:
    | ScreenName.ExchangeBuy
    | ScreenName.ExchangeSell
    | ScreenName.Card
    | NavigatorName.CardTab;
  btnText?: string;
};

type BackToInternalDomainProps = {
  config: BackConfig;
};

const styles = StyleSheet.create({
  headerLeft: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
  },
});

export function BackToInternalDomain({ config }: BackToInternalDomainProps) {
  const { t } = useTranslation();
  const { screen, btnText } = config;
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleBackClick = async () => {
    const manifestId = (await storage.getString("manifest-id")) ?? "";
    const [lastScreen = "", flowName = ""] = await Promise.all([
      storage.getString("last-screen"),
      storage.getString("flow-name"),
    ]);

    if (manifestId) {
      track("button_clicked", {
        button: lastScreen === "compare_providers" ? "back to quote" : "back to liveapp",
        provider: manifestId,
        flow: flowName,
      });
    }

    handleBackToLwEntryPoint(navigation, screen, {
      referrer: "isExternal",
    });
  };

  const buttonLabel = useMemo(() => {
    return btnText ? t("common.backTo", { to: btnText }) : t("common.back");
  }, [t, btnText]);

  return (
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={handleBackClick}>
        <Flex alignItems="center" flexDirection="row" height={40}>
          <Icon name="ChevronLeft" color="neutral.c100" size={30} />
          <Text fontWeight="semiBold" fontSize={16} color="neutral.c100">
            {buttonLabel}
          </Text>
        </Flex>
      </TouchableOpacity>
    </View>
  );
}

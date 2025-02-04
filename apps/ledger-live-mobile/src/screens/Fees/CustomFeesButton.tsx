import { SettingsAlt2 } from "@ledgerhq/icons-ui/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/core";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";

export function CustomFeesButton() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const nav = useNavigation();

  const goToCustomFeesPage = useCallback(
    () => nav.navigate(NavigatorName.Fees, { screen: ScreenName.FeeCustomFeePage }),
    [nav],
  );

  return (
    <TouchableOpacity onPress={goToCustomFeesPage}>
      <Flex
        flexDirection="row"
        backgroundColor={colors.opacityDefault.c05}
        borderRadius={12}
        p={16}
        justifyContent="center"
        alignContent="center"
        columnGap={8}
      >
        <SettingsAlt2 size="M" />
        <Text variant="large" textTransform="capitalize">
          {t("send.summary.customizeFees")}
        </Text>
      </Flex>
    </TouchableOpacity>
  );
}

import React from "react";
import { Flex, Icons, rgba } from "@ledgerhq/native-ui";
import { StyleSheet, View } from "react-native";
import { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import VerticalGradientBackground from "LLM/features/Accounts/components/VerticalGradientBackground";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { ScreenName } from "~/const";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";

type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.NoAssociatedAccounts>
>;
export default function NoAssociatedAccountsView({ route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { CustomNoAssociatedAccounts, onCloseNavigation } = route.params || {};

  const statusColor = colors.primary.c70;
  return (
    <SafeAreaView edges={["left", "right"]} isFlex style={{ justifyContent: "center" }}>
      <VerticalGradientBackground stopColor={statusColor} />
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: rgba(statusColor, 0.1),
            borderColor: colors.primary.c70,
            alignSelf: "center",
            marginTop: 150,
          },
        ]}
      >
        <Circle size={24}>
          <Icons.InformationFill size="L" color={statusColor} />
        </Circle>
      </View>
      <Flex
        alignItems="center"
        justifyContent={"center"}
        style={styles.famillyComponentContainer}
        flex={1}
      >
        {<CustomNoAssociatedAccounts />}
      </Flex>
      <Flex mb={insets.bottom + 2} px={6} rowGap={6}>
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={onCloseNavigation}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  famillyComponentContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
});

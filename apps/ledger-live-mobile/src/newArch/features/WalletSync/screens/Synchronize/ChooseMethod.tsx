import React from "react";
import { Icons, Text, Flex } from "@ledgerhq/native-ui";
import ActionRow from "LLM/components/ActionRow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

const ChooseSyncMethod = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const onConnectDeviceMethodPress = () => {
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
    });
  };
  const onScanMethodPress = () => {};

  return (
    <Flex justifyContent="center" alignItems="left" flexDirection="column" rowGap={24}>
      <Text variant="h4" lineHeight="32.4px">
        {t("walletSync.synchronize.chooseMethod.title")}
      </Text>
      <Flex flexDirection="column" rowGap={16} width={"100%"}>
        <ActionRow
          title={t("walletSync.synchronize.chooseMethod.connectDevice.title")}
          onPress={onConnectDeviceMethodPress}
          icon={<Icons.LedgerDevices color={"primary.c80"} />}
          testID={"walletsync-choose-sync-method-connect-device"}
        />
        <ActionRow
          title={t("walletSync.synchronize.chooseMethod.scan.title")}
          onPress={onScanMethodPress}
          icon={<Icons.QrCode color={"primary.c80"} />}
          testID={"walletsync-choose-sync-method-scan"}
        />
      </Flex>
    </Flex>
  );
};

export default ChooseSyncMethod;

import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

export function Success({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { created } = route.params;
  const title = created ? "walletSync.success.activation" : "walletSync.success.sync";
  const desc = created ? "walletSync.success.activationDesc" : "walletSync.success.syncDesc";

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="space-between">
      <Text>{t(title)}</Text>
      <Text>{t(desc)}</Text>
      <Flex>
        <Button>{t("walletSync.success.syncAnother")}</Button>
        <Button>{t("walletSync.success.close")}</Button>
      </Flex>
    </Flex>
  );
}

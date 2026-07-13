import React, { useEffect } from "react";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { useAleoPrivateSync } from "../hooks/useAleoPrivateSync";

type Props = StackNavigatorProps<
  SendFundsNavigatorStackParamList,
  ScreenName.AleoMandatoryPrivateSync
>;

export function MandatoryPrivateSyncScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount, transaction } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);

  const { isSyncing, progress, error, start } = useAleoPrivateSync({
    account: mainAccount,
    autoStart: true,
  });

  useEffect(() => {
    if (progress < 100 || isSyncing || error) return;

    const timer = setTimeout(() => {
      navigation.replace(ScreenName.SendAmountCoin, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [progress, isSyncing, error, navigation, account, parentAccount, transaction]);

  if (error) {
    return (
      <Box
        lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24", padding: "s24" }}
      >
        <WarningFill size={40} color="warning" />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("aleo.send.mandatoryPrivateSync.errorTitle")}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {t("aleo.send.mandatoryPrivateSync.errorDesc")}
        </Text>
        <Button onPress={start}>{t("common.retry")}</Button>
      </Box>
    );
  }

  return (
    <Box
      lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24", padding: "s24" }}
    >
      <Spinner size={48} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("aleo.send.mandatoryPrivateSync.title", { percentage: progress })}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {t("aleo.send.mandatoryPrivateSync.desc")}
      </Text>
    </Box>
  );
}

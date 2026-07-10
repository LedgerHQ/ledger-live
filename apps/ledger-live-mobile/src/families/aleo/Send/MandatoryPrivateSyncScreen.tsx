import React, { useEffect } from "react";
import { Box, Text, Spinner, Button, Banner } from "@ledgerhq/lumen-ui-rnative";
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

  const { progress, isSyncing, error, start } = useAleoPrivateSync({
    account: mainAccount,
    autoStart: true,
  });

  useEffect(() => {
    if (error || progress < 100 || isSyncing) return;
    const timer = setTimeout(() => {
      navigation.replace(ScreenName.SendAmountCoin, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [error, progress, isSyncing, navigation, account, parentAccount, transaction]);

  if (error) {
    return (
      <Box
        lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24", padding: "s24" }}
      >
        <Banner
          appearance="error"
          title={t("aleo.send.mandatoryPrivateSync.errorTitle")}
          description={t("aleo.send.mandatoryPrivateSync.errorDesc")}
          primaryAction={
            <Button
              appearance="transparent"
              size="sm"
              onPress={start}
              testID="private-sync-retry-button"
            >
              {t("common.retry")}
            </Button>
          }
        />
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
      <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
        {t("aleo.send.mandatoryPrivateSync.desc")}
      </Text>
    </Box>
  );
}

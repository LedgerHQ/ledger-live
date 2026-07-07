import React, { useEffect } from "react";
import { Box, Text, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

type Props = StackNavigatorProps<
  SendFundsNavigatorStackParamList,
  ScreenName.AleoMandatoryPrivateSync
>;

export function MandatoryPrivateSyncScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount, transaction } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(ScreenName.SendAmountCoin, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [account, navigation, parentAccount, transaction]);

  return (
    <Box
      lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24", padding: "s24" }}
    >
      <Spinner size={48} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("aleo.send.privateSync.mockTitle")}
      </Text>
    </Box>
  );
}

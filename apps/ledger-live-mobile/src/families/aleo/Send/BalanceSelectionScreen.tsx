import React, { useCallback } from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";
import Button from "~/components/Button";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

type Props = StackNavigatorProps<
  SendFundsNavigatorStackParamList,
  ScreenName.AleoSendBalanceSelection
>;

export function BalanceSelectionHeaderTitle() {
  const { t } = useTranslation();

  return <StepHeader title={t("aleo.send.balanceSelection.title")} />;
}

export function BalanceSelectionScreen({ navigation, route }: Props) {
  const { account, parentAccount, isSelfTransfer } = route.params;
  const { t } = useTranslation();
  const bridge = useAccountBridge<AleoTransaction>(account, parentAccount);

  const onConfirm = useCallback(
    (variant: "public" | "private") => {
      const transaction = bridge.createTransaction(account);

      if (variant === "private") {
        navigation.navigate(ScreenName.AleoMandatoryPrivateSync, {
          account,
          parentAccount,
          transaction,
        });
        return;
      }

      const targetScreen = isSelfTransfer
        ? ScreenName.SendAmountCoin
        : ScreenName.SendSelectRecipient;

      navigation.navigate(targetScreen, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
      });
    },
    [account, bridge, navigation, parentAccount, isSelfTransfer],
  );

  return (
    <Box lx={wrapperStyle}>
      <Box lx={contentStyle}>
        <Text lx={{ color: "base" }}>{t("aleo.send.balanceSelection.mockTitle")}</Text>
        <Text lx={{ color: "base" }}>
          {t("aleo.send.balanceSelection.selfTransfer", {
            value: isSelfTransfer ? t("common.yes") : t("common.no"),
          })}
        </Text>
      </Box>
      <Box lx={footerStyle}>
        <Button
          event="AleoBalanceSelectionConfirm"
          type="primary"
          title="Public"
          containerStyle={{ flexGrow: 1 }}
          onPress={() => onConfirm("public")}
        />
        <Button
          event="AleoBalanceSelectionConfirm"
          type="primary"
          title="Private"
          containerStyle={{ flexGrow: 1 }}
          onPress={() => onConfirm("private")}
        />
      </Box>
    </Box>
  );
}

const wrapperStyle: LumenViewStyle = {
  flex: 1,
  paddingHorizontal: "s16",
};

const contentStyle: LumenViewStyle = {
  flex: 1,
};

const footerStyle: LumenViewStyle = {
  justifyContent: "center",
  flexDirection: "row",
  gap: "s8",
  paddingBottom: "s24",
};

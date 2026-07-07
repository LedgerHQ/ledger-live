import React, { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { ScrollView } from "react-native";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import {
  derivePrivateTransactionMode,
  derivePublicTransactionMode,
} from "@ledgerhq/live-common/families/aleo/utils";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";
import type {
  AleoAccount,
  AleoTokenAccount,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useTranslation } from "~/context/Locale";
import { useFormatPrivateSyncDate } from "../hooks/useFormatPrivateSyncDate";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { BalanceCard } from "./BalanceCard";

type Props = StackNavigatorProps<
  SendFundsNavigatorStackParamList,
  ScreenName.AleoSendBalanceSelection
>;

type BalanceOption = "public" | "private";

export function BalanceSelectionHeaderTitle() {
  const { t } = useTranslation();

  return <StepHeader title={t("aleo.send.balanceSelection.title")} />;
}

function buildTransaction({
  bridge,
  account,
  mainAccount,
  isSelfTransfer,
  mode,
}: {
  bridge: AccountBridge<AleoTransaction>;
  account: AccountLike;
  mainAccount: AleoAccount;
  isSelfTransfer: boolean;
  mode: AleoTransaction["mode"];
}): AleoTransaction {
  const tx = bridge.createTransaction(account);

  return bridge.updateTransaction(tx, {
    mode,
    recipient: isSelfTransfer ? mainAccount.freshAddress : "",
  });
}

function getCtaLabelKey(isSelfTransfer: boolean, option: BalanceOption) {
  if (isSelfTransfer) {
    return option === "public"
      ? "aleo.send.balanceSelection.convertToPrivate"
      : "aleo.send.balanceSelection.convertToPublic";
  }

  return option === "public"
    ? "aleo.send.balanceSelection.sendPublicly"
    : "aleo.send.balanceSelection.sendPrivately";
}

export function BalanceSelectionScreen({ navigation, route }: Props) {
  const { account, parentAccount, isSelfTransfer } = route.params;
  const [selected, setSelected] = useState<BalanceOption>("public");
  const { t } = useTranslation();
  const bridge = useAccountBridge<AleoTransaction>(account, parentAccount);
  const unit = useAccountUnit(account);
  const formatPrivateSyncDate = useFormatPrivateSyncDate();

  const mainAccount = getMainAccount(account, parentAccount) as AleoAccount;
  const isToken = account.type === "TokenAccount";
  const aleoAccount = account as AleoAccount | AleoTokenAccount;
  const ctaLabelKey = getCtaLabelKey(isSelfTransfer, selected);
  const ctaLabel = t(ctaLabelKey);

  const transparentBalance =
    aleoAccount.type === "TokenAccount"
      ? aleoAccount.transparentBalance
      : (aleoAccount.aleoResources?.transparentBalance ?? new BigNumber(0));

  const privateBalance =
    aleoAccount.type === "TokenAccount"
      ? (aleoAccount.privateBalance ?? null)
      : (aleoAccount.aleoResources?.privateBalance ?? null);

  const privateSyncDate = mainAccount.aleoResources?.lastPrivateSyncDate;

  const onConfirm = useCallback(() => {
    const isPublic = selected === "public";
    const deriveMode = isPublic ? derivePublicTransactionMode : derivePrivateTransactionMode;
    const mode = deriveMode({ isTokenTx: isToken, isSelfTransfer });
    const transaction = buildTransaction({ bridge, account, mainAccount, isSelfTransfer, mode });

    if (!isPublic && isSelfTransfer) {
      navigation.navigate(ScreenName.AleoMandatoryPrivateSync, {
        account,
        parentAccount,
        transaction,
      });
      return;
    }

    const nextScreen = isSelfTransfer ? ScreenName.SendAmountCoin : ScreenName.SendSelectRecipient;

    navigation.navigate(nextScreen, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
    });
  }, [selected, isToken, isSelfTransfer, bridge, account, mainAccount, navigation, parentAccount]);

  return (
    <Box lx={wrapperStyle}>
      <ScrollView style={{ flex: 1 }}>
        <Box lx={cardsStyle}>
          <BalanceCard
            label={t("aleo.send.balanceSelector.public")}
            lastUpdateLabel={t("aleo.send.balanceSelector.lastUpdate", {
              label: t("aleo.send.balanceSelector.recently"),
            })}
            balance={<CurrencyUnitValue unit={unit} value={transparentBalance} disableRounding />}
            selected={selected === "public"}
            onPress={() => setSelected("public")}
          />
          <BalanceCard
            label={t("aleo.send.balanceSelector.private")}
            lastUpdateLabel={
              privateSyncDate
                ? t("aleo.send.balanceSelector.lastUpdate", {
                    label: formatPrivateSyncDate(privateSyncDate),
                  })
                : undefined
            }
            balance={
              privateBalance === null ? (
                PRIVATE_BALANCE_PLACEHOLDER
              ) : (
                <CurrencyUnitValue unit={unit} value={privateBalance} disableRounding />
              )
            }
            selected={selected === "private"}
            onPress={() => setSelected("private")}
          />
        </Box>
      </ScrollView>
      <Box lx={footerStyle}>
        <Button appearance="base" style={{ flexGrow: 1 }} onPress={onConfirm}>
          {ctaLabel}
        </Button>
      </Box>
    </Box>
  );
}

const wrapperStyle: LumenViewStyle = {
  flex: 1,
};

const cardsStyle: LumenViewStyle = {
  padding: "s16",
  gap: "s12",
};

const footerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
  paddingBottom: "s24",
  paddingTop: "s8",
};

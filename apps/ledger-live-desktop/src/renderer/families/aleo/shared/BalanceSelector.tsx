import React from "react";
import { BigNumber } from "bignumber.js";
import { Flex } from "@ledgerhq/react-ui";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { useTranslation } from "react-i18next";
import {
  isPublicTransaction,
  isPrivateTransaction,
  isSelfTransferTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { dayFormat, hourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { PRIVATE_BALANCE_PLACEHOLDER } from "../constants";
import { BalanceOption } from "./BalanceOption";
import BalanceOptionsSwitch from "./BalanceOptionsSwitch";

type Source = "public" | "private";

interface Props {
  transaction: Transaction;
  mainAccount: AleoAccount;
  onChange: (value: Source) => void;
}

const BalanceSelector = ({ mainAccount, transaction, onChange }: Props) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(mainAccount);
  const locale = useSelector(localeSelector);
  const formatDate = useDateFormatter(dayFormat);
  const formatTime = useDateFormatter(hourFormat);

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    locale,
  };

  const privateBalance = mainAccount?.aleoResources?.privateBalance ?? null;
  const transparentBalance = mainAccount?.aleoResources?.transparentBalance ?? new BigNumber(0);
  const formattedPrivateBalance =
    privateBalance !== null
      ? formatCurrencyUnit(unit, privateBalance, formatConfig)
      : PRIVATE_BALANCE_PLACEHOLDER;
  const formattedTransparentBalance = formatCurrencyUnit(unit, transparentBalance, formatConfig);

  const publicSyncDate = t("aleo.shared.balanceSelector.recently");
  const privateSyncDate = mainAccount.aleoResources?.lastPrivateSyncDate
    ? formatDate(mainAccount.aleoResources.lastPrivateSyncDate)
    : undefined;
  const privateSyncTime = mainAccount.aleoResources?.lastPrivateSyncDate
    ? formatTime(mainAccount.aleoResources.lastPrivateSyncDate)
    : undefined;

  const isSelfTransfer = isSelfTransferTransaction(transaction);
  const isPublicTransfer = isPublicTransaction(transaction);
  const isPrivateTransfer = isPrivateTransaction(transaction);

  if (isSelfTransfer) {
    return (
      <Flex
        flexDirection={isPublicTransfer ? "column" : "column-reverse"}
        rowGap="1.25rem"
        columnGap="1.25rem"
      >
        <BalanceOption
          isSelfTransfer={isSelfTransfer}
          label={t("aleo.shared.balanceSelector.public")}
          lastSyncDate={publicSyncDate}
          balance={formattedTransparentBalance}
          checked={isPublicTransfer}
          onClick={() => onChange("public")}
        />
        <BalanceOptionsSwitch
          onClick={() => {
            onChange(isPublicTransfer ? "private" : "public");
          }}
        />
        <BalanceOption
          isSelfTransfer={isSelfTransfer}
          label={t("aleo.shared.balanceSelector.private")}
          balance={formattedPrivateBalance}
          lastSyncDate={privateSyncDate}
          lastSyncTime={privateSyncTime}
          checked={isPrivateTransfer}
          onClick={() => onChange("private")}
        />
      </Flex>
    );
  }

  return (
    <>
      <Flex rowGap="1.25rem" columnGap="1.25rem">
        <BalanceOption
          label={t("aleo.shared.balanceSelector.public")}
          balance={formattedTransparentBalance}
          lastSyncDate={publicSyncDate}
          checked={isPublicTransfer}
          onClick={() => onChange("public")}
        />
        <BalanceOption
          label={t("aleo.shared.balanceSelector.private")}
          balance={formattedPrivateBalance}
          lastSyncDate={privateSyncDate}
          lastSyncTime={privateSyncTime}
          checked={isPrivateTransfer}
          onClick={() => onChange("private")}
        />
      </Flex>
      <div className="mt-20">
        <StepRecipientSeparator />
      </div>
    </>
  );
};

export default BalanceSelector;

import React from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import IconTransfer from "~/renderer/icons/Transfer";
import IconArrowDown from "~/renderer/icons/ArrowDown";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useSelector } from "LLD/hooks/redux";
import type {
  AleoAccount,
  Transaction,
  TransactionType,
} from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/contants";
import { localeSelector } from "~/renderer/reducers/settings";
import { BigNumber } from "bignumber.js";
import { Flex } from "@ledgerhq/react-ui";
import { StepProps } from "~/renderer/modals/Send/types";
import { TransferBtn } from "./TransferBtn";
import { formatSyncInfo } from "@ledgerhq/live-common/families/aleo/utils";

interface Props {
  transaction: Transaction;
  mainAccount: AleoAccount;
  onChangeTransaction: StepProps["onChangeTransaction"];
}

const BalanceSelector = ({ mainAccount, transaction, onChangeTransaction }: Props) => {
  const unit = useAccountUnit(mainAccount);
  const locale = useSelector(localeSelector);

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    locale,
  };

  const bridge = getAccountBridge(mainAccount);
  const { transparentBalance, privateBalance } = mainAccount?.aleoResources || {};

  const formattedPrivateBalance = privateBalance
    ? formatCurrencyUnit(unit, privateBalance, formatConfig)
    : null;
  const formattedTransparentBalance = formatCurrencyUnit(
    unit,
    transparentBalance ?? new BigNumber(0),
    formatConfig,
  );

  const publicSync = formatSyncInfo(mainAccount.lastSyncDate);
  const privateSync = formatSyncInfo(mainAccount?.aleoResources?.lastPrivateSyncDate);

  const selfTransferTypes: TransactionType[] = [
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
  ];
  const isSelfTransfer = selfTransferTypes.includes(transaction.type);
  const publicTransferTypes: TransactionType[] = [
    TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
    TRANSACTION_TYPE.TRANSFER_PUBLIC,
  ];
  const isPublic = publicTransferTypes.includes(transaction.type);
  const privateTransferTypes: TransactionType[] = [
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    TRANSACTION_TYPE.TRANSFER_PRIVATE,
  ];
  const isPrivate = privateTransferTypes.includes(transaction.type);

  const onChangeBalance = (value: "public" | "private") => {
    let newTransactionType: TransactionType;

    if (isSelfTransfer) {
      newTransactionType =
        value === "public"
          ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
          : TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
    } else {
      newTransactionType =
        value === "public" ? TRANSACTION_TYPE.TRANSFER_PUBLIC : TRANSACTION_TYPE.TRANSFER_PRIVATE;
    }

    onChangeTransaction(bridge.updateTransaction(transaction, { type: newTransactionType }));
  };

  return (
    <div>
      <Flex flexDirection={isSelfTransfer ? "column" : "row"} rowGap="1.25rem" columnGap="1.25rem">
        <TransferBtn
          isSelfTransfer={isSelfTransfer}
          balanceType="Public"
          balance={formattedTransparentBalance}
          lastSyncDate={publicSync.time}
          lastSyncTime={publicSync.date}
          checked={isPublic}
          onClick={() => onChangeBalance("public")}
        />

        {isSelfTransfer && (
          <StepRecipientSeparator
            icon={
              <div className="rotate-90">
                <IconTransfer size={16} />
              </div>
            }
          />
        )}

        <TransferBtn
          isSelfTransfer={isSelfTransfer}
          disabled={!privateBalance}
          balanceType="Private"
          balance={formattedPrivateBalance}
          lastSyncDate={privateSync.time}
          lastSyncTime={privateSync.date}
          checked={isPrivate}
          onClick={() => onChangeBalance("private")}
        />
      </Flex>

      {!isSelfTransfer && (
        <div className="mt-20">
          <StepRecipientSeparator icon={<IconArrowDown size={16} />} />
        </div>
      )}
    </div>
  );
};

export default BalanceSelector;

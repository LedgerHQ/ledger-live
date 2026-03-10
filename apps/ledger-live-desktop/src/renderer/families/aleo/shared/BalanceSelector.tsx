import React from "react";
import { BigNumber } from "bignumber.js";
import { Flex } from "@ledgerhq/react-ui";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import {
  isPublicTransaction,
  isPrivateTransaction,
  isSelfTransferTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import IconTransfer from "~/renderer/icons/Transfer";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { BalanceOption } from "./BalanceOption";

interface Props {
  transaction: Transaction;
  mainAccount: AleoAccount;
  onChange: (value: "public" | "private") => void;
}

const BalanceSelector = ({ mainAccount, transaction, onChange }: Props) => {
  const unit = useAccountUnit(mainAccount);
  const locale = useSelector(localeSelector);

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    locale,
  };

  const privateBalance = mainAccount?.aleoResources?.privateBalance ?? new BigNumber(0);
  const transparentBalance = mainAccount?.aleoResources?.transparentBalance ?? new BigNumber(0);
  const formattedPrivateBalance = formatCurrencyUnit(unit, privateBalance, formatConfig);
  const formattedTransparentBalance = formatCurrencyUnit(unit, transparentBalance, formatConfig);

  // TODO:
  // const publicSync = mainAccount.lastSyncDate.toISOString();
  // const privateSync = mainAccount.aleoResources?.lastPrivateSyncDate?.toISOString();

  const isSelfTransfer = isSelfTransferTransaction(transaction);
  const isPublicTransfer = isPublicTransaction(transaction);
  const isPrivateTransfer = isPrivateTransaction(transaction);

  return (
    <div>
      <Flex flexDirection={isSelfTransfer ? "column" : "row"} rowGap="1.25rem" columnGap="1.25rem">
        <BalanceOption
          isSelfTransfer={isSelfTransfer}
          label="Public"
          balance={formattedTransparentBalance}
          checked={isPublicTransfer}
          onClick={() => onChange("public")}
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
        <BalanceOption
          isSelfTransfer={isSelfTransfer}
          label="Private"
          balance={formattedPrivateBalance}
          lastSyncDate=""
          lastSyncTime=""
          checked={isPrivateTransfer}
          onClick={() => onChange("private")}
        />
      </Flex>
      {!isSelfTransfer && (
        <div className="mt-20">
          <StepRecipientSeparator />
        </div>
      )}
    </div>
  );
};

export default BalanceSelector;

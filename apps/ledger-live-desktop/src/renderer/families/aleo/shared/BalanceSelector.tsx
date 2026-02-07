import React from "react";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "LLD/hooks/redux";
import { cn } from "LLD/utils/cn";
import IconSwap from "~/renderer/icons/Swap";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";

interface Props {
  transaction: Transaction;
  mainAccount: AleoAccount;
  onChange: (value: "private" | "public") => void;
}

function BalanceSelector({ mainAccount, transaction, onChange }: Props) {
  const unit = useAccountUnit(mainAccount);
  const locale = useSelector(localeSelector);

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    locale,
  };

  const transparentBalance = mainAccount.aleoResources.transparentBalance;
  const privateBalance = mainAccount.aleoResources.privateBalance;
  const formattedTransparentBalance = formatCurrencyUnit(unit, transparentBalance, formatConfig);
  const formattedPrivateBalance = privateBalance
    ? formatCurrencyUnit(unit, privateBalance, formatConfig)
    : null;

  const isPublic = [
    TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
    TRANSACTION_TYPE.TRANSFER_PUBLIC,
  ].includes(transaction.type);
  const isPrivate = [
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    TRANSACTION_TYPE.TRANSFER_PRIVATE,
  ].includes(transaction.type);

  // FIXME:
  const buttonClassName = cn(
    "m-0 cursor-pointer rounded-xs border border-[#3C3C3C] p-12 text-[13px] font-[600] hover:border-white disabled:opacity-25",
  );
  const activeButtonClassName = cn("bg-accent text-black");

  return (
    <div className="flex flex-col">
      <p className="mb-8 text-[13px] font-[500] text-[#949494]">Balance from</p>
      <button
        type="button"
        className={cn(buttonClassName, isPublic && activeButtonClassName)}
        onClick={() => {
          console.log("selected public balance", transparentBalance.toString());
          onChange("public");
        }}
      >
        Public balance ({formattedTransparentBalance})
      </button>
      <div className="my-16">
        <StepRecipientSeparator icon={<IconSwap size={16} />} />
      </div>
      <button
        type="button"
        className={cn(buttonClassName, isPrivate && activeButtonClassName)}
        disabled={!privateBalance}
        onClick={() => {
          if (!privateBalance) return;
          console.log("selected private balance", privateBalance.toString());
          onChange("private");
        }}
      >
        {formattedPrivateBalance
          ? `Private balance (${formattedPrivateBalance})`
          : "Private balance is not available"}
      </button>
    </div>
  );
}

export default BalanceSelector;

import React from "react";
import type { CoinControlChangeToReturnViewModel } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";

type ChangeToReturnProps = Readonly<{
  changeToReturn: CoinControlChangeToReturnViewModel;
}>;

export const ChangeToReturn = ({ changeToReturn }: ChangeToReturnProps) => {
  return (
    <div
      className="flex w-full items-center justify-between py-8"
      data-testid="send-change-to-return-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-3">{changeToReturn.changeToReturnLabel}</span>
      </span>
      {changeToReturn.value ? (
        <span className="body-3 text-base">{changeToReturn.value}</span>
      ) : (
        <span className="body-3 text-warning">{changeToReturn.placeholder}</span>
      )}
    </div>
  );
};

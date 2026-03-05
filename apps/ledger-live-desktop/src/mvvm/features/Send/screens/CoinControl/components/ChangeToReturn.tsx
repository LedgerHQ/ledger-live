import React from "react";

type ChangeToReturnProps = Readonly<{
  value?: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
}>;

export const ChangeToReturn = ({
  value,
  changeToReturnLabel,
  enterAmountPlaceholder,
}: ChangeToReturnProps) => {
  return (
    <div
      className="flex w-full items-center justify-between py-8"
      data-testid="send-change-to-return-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-3">{changeToReturnLabel}</span>
      </span>
      {value ? (
        <span className="body-3 text-base">{value}</span>
      ) : (
        <span className="body-3 text-warning">{enterAmountPlaceholder}</span>
      )}
    </div>
  );
};

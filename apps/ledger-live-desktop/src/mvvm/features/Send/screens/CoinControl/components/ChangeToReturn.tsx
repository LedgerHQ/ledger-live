import React from "react";

type ChangeToReturnProps = Readonly<{
  value?: string;
}>;

export const ChangeToReturn = ({ value }: ChangeToReturnProps) => {
  return (
    <div
      className="flex w-full items-center justify-between py-8"
      data-testid="send-change-to-return-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-2">Change to return</span>
      </span>
      <span className="body-2 text-base">{value ? value : "Enter amount"}</span>
    </div>
  );
};

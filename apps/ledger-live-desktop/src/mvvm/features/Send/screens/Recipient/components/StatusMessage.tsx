import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";

type StatusMessageProps = Readonly<{
  text: string;
  dataTestId?: string;
}>;

export function StatusMessage({ text, dataTestId }: StatusMessageProps) {
  return (
    <div
      className="flex h-[33vh] flex-col items-center justify-center gap-16 pt-12"
      data-testid={dataTestId}
    >
      <Spot appearance="icon" icon={Search} size={72} />
      <p className="mt-6 text-center text-[20px] leading-[28px] font-[600] tracking-[-1px] text-base">
        {text}
      </p>
    </div>
  );
}

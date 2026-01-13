import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";

type StatusMessageProps = Readonly<{
  text: string;
}>;

export function StatusMessage({ text }: StatusMessageProps) {
  return (
    <div className="flex h-[33vh] flex-col items-center justify-center gap-16 pt-12">
      <Spot appearance="icon" icon={Search} size={72} />
      <p className="mt-6 text-center text-[20px] font-[600] leading-[28px] tracking-[-1px] text-base">
        {text}
      </p>
    </div>
  );
}

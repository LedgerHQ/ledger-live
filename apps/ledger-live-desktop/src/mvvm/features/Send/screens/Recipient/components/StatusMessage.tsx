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
      className="flex flex-col items-center justify-center gap-10 px-24"
      data-testid={dataTestId}
    >
      <Spot appearance="icon" icon={Search} size={56} />
      <p className="text-center mt-6 body-1-semi-bold">{text}</p>
    </div>
  );
}

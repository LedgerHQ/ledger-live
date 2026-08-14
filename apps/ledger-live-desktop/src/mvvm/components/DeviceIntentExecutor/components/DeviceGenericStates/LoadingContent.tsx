import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type LoadingContentProps = Readonly<{
  title: React.ReactNode;
  testID?: string;
  className?: string;
}>;

export function LoadingContent({ title, testID, className }: LoadingContentProps) {
  return (
    <div
      className={cn("flex w-full flex-col items-center gap-16 px-16 py-24", className)}
      data-testid={testID}
    >
      <Spinner size={32} />
      <h3 className="heading-4-semi-bold text-center text-base">{title}</h3>
    </div>
  );
}

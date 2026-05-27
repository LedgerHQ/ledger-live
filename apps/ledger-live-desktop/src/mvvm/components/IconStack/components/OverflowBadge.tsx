import React from "react";

type OverflowBadgeProps = {
  readonly count: number;
  readonly testID?: string;
};

export function OverflowBadge({ count, testID = "icon-stack-overflow" }: OverflowBadgeProps) {
  return (
    <div
      className="flex size-full items-center justify-center bg-interactive text-[10px] font-medium leading-none text-on-interactive"
      data-testid={testID}
    >
      +{count}
    </div>
  );
}

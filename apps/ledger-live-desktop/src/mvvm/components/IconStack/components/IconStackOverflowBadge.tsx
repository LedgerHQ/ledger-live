import React from "react";

type IconStackOverflowBadgeProps = {
  readonly count: number;
  readonly testID?: string;
};

export function IconStackOverflowBadge({
  count,
  testID = "icon-stack-overflow",
}: IconStackOverflowBadgeProps) {
  return (
    <div
      className="flex size-full items-center justify-center bg-muted text-[10px] font-medium leading-none text-default"
      data-testid={testID}
    >
      +{count}
    </div>
  );
}

import React from "react";
import {
  getSwapTransactionStatusVisualTokens,
  type SwapTransactionStatusDisplayStatus,
  type SwapTransactionStatusVisualIcon,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { CheckmarkCircleFill, ClockFill, DeleteCircleFill } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import { StatusLine } from "./StatusLine";

type StatusRowProps = Readonly<{
  status: SwapTransactionStatusDisplayStatus;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  isLoading: boolean;
  lineStatus?: SwapTransactionStatusDisplayStatus;
  testId?: string;
}>;

type StatusIconProps = Readonly<{
  icon: SwapTransactionStatusVisualIcon;
}>;

function StatusIcon({ icon }: StatusIconProps) {
  switch (icon) {
    case "success":
      return <CheckmarkCircleFill size={20} className="text-success" />;
    case "error":
      return <DeleteCircleFill size={20} className="text-error" />;
    case "pending":
      return <ClockFill size={20} />;
  }
}

export function StatusRow({
  status,
  title,
  subtitle,
  value,
  isLoading,
  lineStatus,
  testId,
}: StatusRowProps) {
  const titleContent = isLoading ? <Skeleton className="h-16 w-112 rounded-sm" /> : title;
  const subtitleContent = isLoading ? <Skeleton className="h-14 w-72 rounded-sm" /> : subtitle;
  const visualTokens = getSwapTransactionStatusVisualTokens(status);

  return (
    <div
      data-testid={testId ? `${testId}-row` : undefined}
      className="group/status-row grid grid-cols-[20px_minmax(0,1fr)_auto] grid-rows-2 gap-x-4 gap-y-4"
    >
      <div
        className={cn("col-start-1 row-start-1 flex text-muted", {
          "text-success": visualTokens.tone === "success",
          "text-error": visualTokens.tone === "error",
        })}
      >
        <StatusIcon icon={visualTokens.icon} />
      </div>
      <span className="col-start-2 row-start-1 body-2-semi-bold text-base">{titleContent}</span>
      <span
        data-testid={testId ? `${testId}-amount` : undefined}
        className="col-start-3 row-start-1 body-2-semi-bold text-base"
      >
        {value}
      </span>
      <div className="col-start-1 row-start-2 flex justify-center group-last/status-row:hidden">
        <StatusLine status={lineStatus ?? status} />
      </div>
      <span
        className={cn("col-start-2 row-start-2 body-3 text-muted", {
          "text-success": visualTokens.tone === "success",
          "text-error": visualTokens.tone === "error",
        })}
      >
        {subtitleContent}
      </span>
    </div>
  );
}

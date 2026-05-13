import React from "react";
import { CheckmarkCircleFill, DeleteCircleFill } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import IconClock from "~/renderer/icons/Clock";
import { StatusLine } from "./StatusLine";

type StatusRowProps = {
  status: "success" | "pending" | "error" | "unknown";
  title: string;
  subtitle: string;
  value: React.ReactNode;
};

export function StatusRow({ status, title, subtitle, value }: StatusRowProps) {
  return (
    <div className="group/status-row grid grid-cols-[20px_minmax(0,1fr)_auto] grid-rows-2 gap-x-4 gap-y-2">
      <div
        className={cn("col-start-1 row-start-1 flex text-muted", {
          "text-success": status === "success",
          "text-error": status === "error",
        })}
      >
        {status === "success" ? (
          <CheckmarkCircleFill size={20} className="text-success" />
        ) : status === "pending" || status === "unknown" ? (
          <IconClock size={20} />
        ) : (
          <DeleteCircleFill size={20} className="text-error" />
        )}
      </div>
      <span className="col-start-2 row-start-1 body-2-semi-bold text-base">{title}</span>
      <span className="col-start-3 row-start-1 body-2-semi-bold text-base">{value}</span>
      <div className="col-start-1 row-start-2 flex justify-center group-last/status-row:hidden">
        <StatusLine status={status} />
      </div>
      <span
        className={cn("col-start-2 row-start-2 body-3 text-muted", {
          "text-success": status === "success",
          "text-error": status === "error",
        })}
      >
        {subtitle}
      </span>
    </div>
  );
}

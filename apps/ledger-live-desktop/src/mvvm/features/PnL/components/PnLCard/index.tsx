import React from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardTrailing,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  ChevronRight,
  Information,
  TriangleUp,
  TriangleDown,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { PnLCardProps } from "./types";

export const PnLCard = (props: PnLCardProps) => {
  const { title, value, type, discreet } = props;
  const displayedValue = discreet ? "***" : value;

  return (
    <Card type={type} onClick={type === "interactive" ? props.onClick : undefined}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <div className="flex min-w-0 items-center gap-4 text-muted">
              <CardContentTitle>
                <span className="body-3">{title}</span>
              </CardContentTitle>
              {type === "info" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help">
                      <Information size={16} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{props.tooltipContent}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <CardContentDescription>
              <div className="flex items-center align-center gap-4">
                {type === "interactive" && (
                  <span className="text-muted body-3">
                    {props.trend === "up" ? (
                      <TriangleUp size={16} className="text-success" />
                    ) : (
                      <TriangleDown size={16} className="text-error" />
                    )}
                  </span>
                )}
                <span className="text-base body-2-semi-bold">{displayedValue}</span>
              </div>
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        {type === "interactive" && (
          <CardTrailing>
            <ChevronRight size={20} className="text-muted" />
          </CardTrailing>
        )}
      </CardHeader>
    </Card>
  );
};

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
import type { PnlTrend } from "@ledgerhq/wallet-pnl";
import type { PnLCardProps } from "./types";

const TREND_ICONS: Record<PnlTrend, { Icon: typeof TriangleUp; className: string }> = {
  up: { Icon: TriangleUp, className: "text-success" },
  down: { Icon: TriangleDown, className: "text-error" },
  neutral: { Icon: TriangleUp, className: "text-disabled" },
};

const TrendIcon = ({ trend }: { trend: PnlTrend }) => {
  const { Icon, className } = TREND_ICONS[trend];
  return (
    <span className="text-muted body-3">
      <Icon size={16} className={className} />
    </span>
  );
};

const hasTrend = (props: PnLCardProps): props is PnLCardProps & { trend: PnlTrend } =>
  props.type === "interactive" || props.type === "display";

const toCardType = (type: PnLCardProps["type"]): "interactive" | "info" =>
  type === "interactive" ? "interactive" : "info";

export const PnLCard = (props: PnLCardProps) => {
  const { title, value, type } = props;

  return (
    <Card type={toCardType(type)} onClick={type === "interactive" ? props.onClick : undefined}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <div className="flex min-w-0 items-center gap-4 text-muted">
              <CardContentTitle>
                <span className="body-3">{title}</span>
              </CardContentTitle>
              {type === "info" && (
                <Tooltip onOpenChange={props.onTooltipOpenChange}>
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
                {hasTrend(props) && <TrendIcon trend={props.trend} />}
                <span className="text-base body-2-semi-bold">{value}</span>
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

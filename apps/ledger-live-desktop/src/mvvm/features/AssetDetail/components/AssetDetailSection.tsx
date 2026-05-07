import React, { type ReactNode } from "react";
import {
  Link,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";

type AssetDetailSectionProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  tooltipContent?: string;
  children: ReactNode;
};

export function AssetDetailSection({
  title,
  actionLabel,
  actionHref = "#",
  tooltipContent,
  children,
}: Readonly<AssetDetailSectionProps>) {
  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow className="min-w-0 items-center justify-between gap-8">
          <div className="flex min-w-0 items-center gap-8">
            <SubheaderTitle>{title}</SubheaderTitle>
            {tooltipContent ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help">
                    <Information size={16} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{tooltipContent}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {actionLabel ? (
            <Link href={actionHref} underline={false} size="sm">
              {actionLabel}
            </Link>
          ) : null}
        </SubheaderRow>
      </Subheader>
      <div className="text-body">{children}</div>
    </div>
  );
}

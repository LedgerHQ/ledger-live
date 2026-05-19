import React from "react";
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

export type SectionHeaderProps = Readonly<{
  title: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionTestId?: string;
  tooltipContent?: string;
}>;

export function SectionHeader({
  title,
  actionLabel,
  onActionClick,
  actionTestId,
  tooltipContent,
}: SectionHeaderProps) {
  return (
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
        {actionLabel && (
          <span className="inline-flex cursor-pointer" data-testid={actionTestId}>
            <Link
              href="#"
              appearance="accent"
              size="sm"
              underline={false}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onActionClick?.();
              }}
            >
              {actionLabel}
            </Link>
          </span>
        )}
      </SubheaderRow>
    </Subheader>
  );
}

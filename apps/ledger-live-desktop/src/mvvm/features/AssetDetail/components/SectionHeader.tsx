import React from "react";
import {
  Link,
  Subheader,
  SubheaderCount,
  SubheaderRow,
  SubheaderShowMore,
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
  itemCount?: number;
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
  seeAllTestId?: string;
}>;

export function SectionHeader({
  title,
  actionLabel,
  onActionClick,
  actionTestId,
  tooltipContent,
  itemCount,
  showSeeAll,
  onSeeAllClick,
  seeAllTestId,
}: SectionHeaderProps) {
  return (
    <Subheader>
      <SubheaderRow className="min-w-0 items-center justify-between gap-8">
        <div
          className={`flex min-w-0 items-center gap-8${showSeeAll ? " cursor-pointer" : ""}`}
          onClick={showSeeAll ? onSeeAllClick : undefined}
          onKeyDown={
            showSeeAll
              ? e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSeeAllClick?.();
                  }
                }
              : undefined
          }
          role={showSeeAll ? "button" : undefined}
          tabIndex={showSeeAll ? 0 : undefined}
          data-testid={showSeeAll ? seeAllTestId : undefined}
        >
          <SubheaderTitle>{title}</SubheaderTitle>
          {showSeeAll && itemCount !== undefined ? <SubheaderCount value={itemCount} /> : null}
          {showSeeAll ? <SubheaderShowMore /> : null}
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

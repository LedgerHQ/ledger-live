import React from "react";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";

type Props = {
  onClearFilters?: () => void;
};

export function EmptyState({ onClearFilters }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-0 flex-1">
      <div className="flex flex-col items-center gap-32 w-[350px]">
        <div className="flex flex-col items-center gap-24">
          <Spot appearance="info" size={72} />
          <div className="flex flex-col items-center gap-8">
            <span className="heading-4-semi-bold text-base">No transactions found</span>
            <span className="body-2 text-muted">Try something different</span>
          </div>
        </div>
        {onClearFilters && (
          <Button
            appearance="transparent"
            size="sm"
            onClick={onClearFilters}
            className="mt-32"
            isFull
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

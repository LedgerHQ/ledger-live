import React from "react";
import { Link } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

export type SectionHeaderActionProps = Readonly<{
  actionLabel: string;
  onActionClick?: () => void;
  actionTestId?: string;
}>;

export function SectionHeaderAction({
  actionLabel,
  onActionClick,
  actionTestId,
}: SectionHeaderActionProps) {
  return (
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
        <span className="inline-flex items-center gap-4">
          <Plus size={16} />
          {actionLabel}
        </span>
      </Link>
    </span>
  );
}

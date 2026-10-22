import React from "react";
import { Button, IconButton } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

type ContactDetailHeaderAddAddressProps = Readonly<{
  label: string;
  onAddAddress: () => void;
  isCollapsed: boolean;
  compactOffset: string;
}>;

export function ContactDetailHeaderAddAddress({
  label,
  onAddAddress,
  isCollapsed,
  compactOffset,
}: ContactDetailHeaderAddAddressProps): React.ReactNode {
  return (
    <div
      className={`absolute motion-safe:transition-[top,right,transform] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
        isCollapsed
          ? `top-1/2 -translate-y-1/2 ${compactOffset}`
          : "left-1/2 top-[168px] -translate-x-1/2"
      }`}
    >
      <div className={isCollapsed ? "@max-[500px]:hidden" : undefined}>
        <Button
          appearance="gray"
          size="sm"
          icon={Plus}
          onClick={onAddAddress}
          data-testid="contacts-detail-add-address"
          aria-label={label}
        >
          {label}
        </Button>
      </div>
      {isCollapsed ? (
        <div className="hidden @max-[500px]:block">
          <IconButton
            appearance="transparent"
            size="sm"
            icon={Plus}
            aria-label={label}
            onClick={onAddAddress}
            data-testid="contacts-detail-add-address-icon"
          />
        </div>
      ) : null}
    </div>
  );
}

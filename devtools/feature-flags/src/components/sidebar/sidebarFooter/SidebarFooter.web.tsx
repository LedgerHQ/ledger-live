import { Button } from "@ledgerhq/lumen-ui-react";

export interface SidebarFooterProps {
  readonly onClose: () => void;
  readonly onApplyOverride: () => void;
  readonly overrideDisabled: boolean;
}

export function SidebarFooter({ onClose, onApplyOverride, overrideDisabled }: SidebarFooterProps) {
  return (
    <div className="flex justify-between items-center p-8">
      <Button appearance="no-background" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={() => onApplyOverride()} disabled={overrideDisabled}>
        Apply
      </Button>
    </div>
  );
}

import {
  Button,
  Dialog,
  DialogBody,
  DialogBodyStickyContent,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import type { CoinConfigToolProps, KeyDisplayState } from "../../types";
import { useConfigEditor } from "../../coin-config/internals/useConfigEditor";
import { ConfigJsonEditor } from "../configJsonEditor/ConfigJsonEditor";
import { Pill } from "../pill/Pill";

export interface KeyDetailsDialogProps {
  readonly display: KeyDisplayState;
  readonly setOverride: CoinConfigToolProps["setOverride"];
  readonly clearOverride: CoinConfigToolProps["clearOverride"];
  readonly onClose: () => void;
}

export function KeyDetailsDialog({
  display,
  setOverride,
  clearOverride,
  onClose,
}: KeyDetailsDialogProps) {
  const editor = useConfigEditor({ display, setOverride, clearOverride });

  return (
    <Dialog open onOpenChange={next => !next && onClose()}>
      <DialogContent className="w-[600px]">
        <DialogHeader title={display.key} description="Coin config" onClose={onClose} />
        <DialogBody className="flex flex-col gap-16">
          <DialogBodyStickyContent>
            <div className="flex items-center gap-16">
              <div className="flex w-full items-center gap-8 rounded-md bg-canvas-muted p-16">
                <Pill variant={display.isOverridden ? "active" : "muted"} size={3}>
                  {display.valueType}
                </Pill>
                <div className="flex flex-col">
                  <span className="body-2 text-base">
                    {display.isOverridden ? "Overridden locally" : "Remote or default value"}
                  </span>
                  <span className="body-4 text-muted">Local override takes priority</span>
                </div>
              </div>
              {display.isOverridden && (
                <Button appearance="gray" className="body-2 py-8" onClick={editor.restore}>
                  Restore
                </Button>
              )}
            </div>
          </DialogBodyStickyContent>
          <ConfigJsonEditor {...editor} />
        </DialogBody>
        <DialogFooter className="flex items-center justify-between bg-canvas-sheet">
          <Button appearance="no-background" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={editor.apply} disabled={editor.applyDisabled}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

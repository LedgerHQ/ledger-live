import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogBodyStickyContent,
  DialogFooter,
  Switch,
  Button,
} from "@ledgerhq/lumen-ui-react";
import type { FeatureId, Features } from "@shared/feature-flags";
import { FlagDisplayState } from "../..";
import { FlagJsonEditor } from "../flagJsonEditor/flagJsonEditor";
import { useJsonEditor } from "../../hooks";

export interface FlagDetailsDialogProps {
  readonly setOverride: <T extends FeatureId>(key: T, value: Features[T] | undefined) => void;
  readonly display: FlagDisplayState;
  readonly onClose: () => void;
  readonly clearOverride: (key: FeatureId) => void;
}

export function FlagDetailsDialog({
  setOverride,
  display,
  onClose,
  clearOverride,
}: FlagDetailsDialogProps) {
  const {
    overrideWithJson,
    currentJsonFlag,
    setCurrentJsonFlag,
    isJsonValid,
    applyDisabled,
    diffJson,
    diffBaseline,
    setDiffBaseline,
    resetJson,
    toggleFeatureFlag,
  } = useJsonEditor({
    id: display.id,
    resolved: display.resolved,
    setOverride,
  });

  const handleRestore = () => {
    clearOverride(display.id);
    resetJson();
  };

  return (
    <Dialog open onOpenChange={next => !next && onClose()}>
      <DialogContent className="w-[600px]">
        <DialogHeader title={display.id} description="Feature Flags" onClose={onClose} />
        <DialogBody className="flex flex-col gap-16">
          <DialogBodyStickyContent>
            <div className="flex items-center gap-16">
              <div className="flex gap-8 items-center w-full bg-canvas-muted p-16 rounded-md">
                <Switch selected={display.resolved.enabled} onChange={toggleFeatureFlag} />
                <div className="flex flex-col">
                  <span className="body-2 text-base">
                    {display.resolved.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="body-4 text-muted">Local Override takes priority</span>
                </div>
              </div>
              {display.isOverridden && (
                <Button appearance="gray" className="body-2 py-8" onClick={handleRestore}>
                  Restore
                </Button>
              )}
            </div>
          </DialogBodyStickyContent>
          <FlagJsonEditor
            value={currentJsonFlag}
            onChange={setCurrentJsonFlag}
            isValidJson={isJsonValid}
            diffJson={diffJson}
            diffBaseline={diffBaseline}
            setDiffBaseline={setDiffBaseline}
          />
        </DialogBody>
        <DialogFooter className="flex justify-between items-center bg-canvas-sheet">
          <Button appearance="no-background" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => overrideWithJson()} disabled={applyDisabled}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

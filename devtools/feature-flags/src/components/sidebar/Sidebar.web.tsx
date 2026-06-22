import { DarkenScreen } from "./DarkenScreen";
import type { FeatureId, Features } from "@shared/feature-flags";
import { FlagDisplayState } from "../..";
import { SidebarTop } from "./sidebarTop/SidebarTop";
import { Divider } from "@ledgerhq/lumen-ui-react";
import { FlagJsonEditor } from "../flagJsonEditor/flagJsonEditor";
import { SidebarFooter } from "./sidebarFooter/SidebarFooter.web";
import { useJsonEditor } from "../../hooks";

export interface SidebarProps {
  readonly setOverride: <T extends FeatureId>(key: T, value: Features[T] | undefined) => void;
  readonly display: FlagDisplayState;
  readonly onClose: () => void;
  readonly clearOverride: (key: FeatureId) => void;
}

export function Sidebar({ setOverride, display, onClose, clearOverride }: SidebarProps) {
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
    <div data-testid="feature-flags-sidebar">
      <DarkenScreen onClick={onClose} />
      <div className="w-[45vw] h-full flex-col flex bg-canvas absolute right-0 top-0 border-l border-muted-subtle-transparent z-51">
        <SidebarTop
          display={display}
          onClose={onClose}
          clearOverride={handleRestore}
          toggleFeatureFlag={toggleFeatureFlag}
        />
        <Divider />
        <div className="flex-1 overflow-auto">
          <div className="p-16">
            <FlagJsonEditor
              value={currentJsonFlag}
              onChange={setCurrentJsonFlag}
              isValidJson={isJsonValid}
              diffJson={diffJson}
              diffBaseline={diffBaseline}
              setDiffBaseline={setDiffBaseline}
            />
          </div>
        </div>
        <div className="mt-auto bg-muted">
          <Divider />
          <SidebarFooter
            onClose={onClose}
            onApplyOverride={overrideWithJson}
            overrideDisabled={applyDisabled}
          />
        </div>
      </div>
    </div>
  );
}

import { TypedSegmentedControl } from "../../../shared/components/TypedSegmentedControl";
import type { TraderMode } from "../model/types";

const MODES: readonly TraderMode[] = ["single", "multi"] as const;
const LABELS: Record<TraderMode, string> = {
  single: "Single asset",
  multi: "Multi-asset",
};

type TraderModeTabsProps = Readonly<{
  selectedMode: TraderMode;
  onSelectedModeChange: (mode: TraderMode) => void;
}>;

export function TraderModeTabs({ selectedMode, onSelectedModeChange }: TraderModeTabsProps) {
  return (
    <TypedSegmentedControl
      values={MODES}
      selected={selectedMode}
      onSelect={onSelectedModeChange}
      renderLabel={mode => LABELS[mode]}
      ariaLabel="Trader mode"
    />
  );
}

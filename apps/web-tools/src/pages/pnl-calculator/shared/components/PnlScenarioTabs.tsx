import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import { SCENARIO_IDS, SCENARIO_LABELS, type ScenarioId } from "../../scenarios";

type PnlScenarioTabsProps = Readonly<{
  selectedScenario: ScenarioId;
  onSelectedScenarioChange: (id: ScenarioId) => void;
}>;

export function PnlScenarioTabs({
  selectedScenario,
  onSelectedScenarioChange,
}: PnlScenarioTabsProps) {
  return (
    <SegmentedControl
      selectedValue={selectedScenario}
      onSelectedChange={v => onSelectedScenarioChange(v as ScenarioId)}
      tabLayout="fit"
      className="w-full"
      aria-label="PnL scenario"
    >
      {SCENARIO_IDS.map(id => (
        <SegmentedControlButton key={id} value={id}>
          {SCENARIO_LABELS[id]}
        </SegmentedControlButton>
      ))}
    </SegmentedControl>
  );
}

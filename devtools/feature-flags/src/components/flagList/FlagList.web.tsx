import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps } from "../../types";
import { FlagRow } from "../flagRow/FlagRow.web";
import { ALL_FLAG_IDS } from "../../constants";
import { FlagListHeader } from "../flagListHeader/FlagListHeader";
import { useFeatureFlagsState } from "../../hooks/useFeatureFlagsState";
import { Divider } from "@ledgerhq/lumen-ui-react";

export const FlagList = (props: FeatureFlagsToolProps) => {
  const { overrides, setOverride } = props;
  const { getFlagDisplayState } = useFeatureFlagsState(props);
  const featureIds: FeatureId[] = ALL_FLAG_IDS;
  return (
    <>
      <FlagListHeader
        overrideCount={Object.keys(overrides).length}
        numberOfFlags={featureIds.length}
        numberOfFilteredFlags={featureIds.length} // no filter implemented yet
      />
      <Divider className="bg-canvas-muted" />
      <div>
        {featureIds.map(featureId => (
          <div key={featureId}>
            <FlagRow
              key={featureId}
              display={getFlagDisplayState(featureId)}
              setOverride={setOverride}
            />
            <Divider key={`${featureId}-divider`} className="bg-canvas-muted" />
          </div>
        ))}
      </div>
    </>
  );
};

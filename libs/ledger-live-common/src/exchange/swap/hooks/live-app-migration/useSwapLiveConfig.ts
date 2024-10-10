import { Feature_PtxSwapCoreExperiment } from "@ledgerhq/types-live";
import { useFeature } from "../../../../featureFlags";

// check if the variant is valid for core rollout experiment
export type CoreExperimentParams = NonNullable<Feature_PtxSwapCoreExperiment["params"]>;
export type ValidVariant = CoreExperimentParams["variant"];

// used to enable the Swap Live App globally
export function useSwapLiveConfig() {
  const demoThree = useFeature("ptxSwapLiveAppDemoThree");
  const demoOne = useFeature("ptxSwapLiveAppDemoOne");
  const demoZero = useFeature("ptxSwapLiveAppDemoZero");
  const coreExperiment = useFeature("ptxSwapCoreExperiment");

  if (demoZero?.enabled) {
    return demoZero;
  }

  if (demoThree?.enabled) {
    return demoThree;
  }

  if (coreExperiment?.enabled) {
    const variant = coreExperiment?.params?.variant;
    if (!variant || !(variant satisfies ValidVariant)) {
      return null;
    }
    return coreExperiment;
  }

  if (demoOne?.enabled) {
    return demoOne;
  }

  return null;
}

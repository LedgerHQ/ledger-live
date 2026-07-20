import type { FeatureFlagsToolProps } from "../types";
import { FeatureFlagsToolProvider, FlagSelectionProvider } from "../context";
import { FlagList } from "../components";
import { BottomSheetModalProvider } from "@ledgerhq/lumen-ui-rnative";

export function FeatureFlags(props: Readonly<FeatureFlagsToolProps>) {
  return (
    <BottomSheetModalProvider>
      <FeatureFlagsToolProvider {...props}>
        <FlagSelectionProvider>
          <FlagList {...props} />
        </FlagSelectionProvider>
      </FeatureFlagsToolProvider>
    </BottomSheetModalProvider>
  );
}

export default FeatureFlags;

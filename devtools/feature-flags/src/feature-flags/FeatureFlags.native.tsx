import type { FeatureFlagsToolProps } from "../types";
import { FeatureFlagsToolProvider } from "../context/FeatureFlagsToolContext";
import { FlagSelectionProvider } from "../context/FlagSelectionContext";
import { FlagList } from "../components/flagList/FlagList";
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

import type { FeatureFlagsToolProps } from "../types";
import { FeatureFlagsToolProvider } from "../context/FeatureFlagsToolContext.native";
import { FlagSelectionProvider } from "../context/FlagSelectionContext.native";
import { FlagList } from "../components/flagList/FlagList.native";
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

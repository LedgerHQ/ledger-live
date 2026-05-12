import { FEATURE_FLAGS_ID } from "@devtools/shell";
import type { FeatureFlagsToolProps } from "./types";

declare module "@devtools/shell" {
  interface DevToolsPropsRegistry {
    [FEATURE_FLAGS_ID]?: FeatureFlagsToolProps;
  }
}

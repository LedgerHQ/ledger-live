import React from "react";
import { InfiniteLoader as BaseInfiniteLoader } from "@ledgerhq/native-ui";
import Config from "react-native-config";

export type InfiniteLoaderProps = React.ComponentProps<typeof BaseInfiniteLoader>;

/**
 * App-level InfiniteLoader that defaults mock to true in Detox (E2E) so the
 * animation is disabled and tests don't rely on animation timing.
 * Pass mock={false} to override when you need the real animation.
 */
function InfiniteLoader(props: InfiniteLoaderProps) {
  return <BaseInfiniteLoader {...props} mock={props.mock ?? !!Config.DETOX} />;
}

export default InfiniteLoader;

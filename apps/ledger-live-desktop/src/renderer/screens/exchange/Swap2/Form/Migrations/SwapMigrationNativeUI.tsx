import React from "react";
import { SwapDemo0NativeUI, SwapDemo0NativeUIProps } from "./SwapDemo0NativeUI";
import { SwapDemo1NativeUI, SwapDemo1NativeUIProps } from "./SwapDemo1NativeUI";
import { SwapWebManifestIDs } from "../SwapWebView";

type SwapMigrationNativeUIProps = SwapDemo0NativeUIProps &
  SwapDemo1NativeUIProps & {
    manifestID: string;
  };

export const SwapMigrationNativeUI = (props: SwapMigrationNativeUIProps) => {
  const { manifestID } = props;
  switch (manifestID) {
    case SwapWebManifestIDs.Demo1:
      return <SwapDemo1NativeUI {...props} />;
    case SwapWebManifestIDs.Demo0:
    default:
      return <SwapDemo0NativeUI {...props} />;
  }
};

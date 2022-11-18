import React, { useCallback, useState } from "react";
import { Alert, Switch, Text } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";

/**
 * Component to debug code that will be injected in a webview.
 * The `injectedCode` prop is a string of that code and we want to detect &
 * notify the dev in case the stringification has produced an unusable result.
 * see https://github.com/facebook/hermes/issues/612.
 */
export function InjectedCodeDebugger({
  injectedCode,
  debug,
  filename = "imageProcessing.ts",
}: {
  injectedCode: string;
  debug?: boolean;
  filename?: string;
}) {
  const [sourceVisible, setSourceVisible] = useState(false);
  const toggleShowSource = useCallback(() => {
    setSourceVisible(!sourceVisible);
  }, [setSourceVisible, sourceVisible]);

  // see https://github.com/facebook/hermes/issues/612
  const warningVisible = injectedCode?.trim() === "[bytecode]";

  if (!__DEV__) return null;
  return (
    <>
      {debug && (
        <Switch
          checked={sourceVisible}
          onChange={toggleShowSource}
          label="Show injected code"
        />
      )}
      {sourceVisible && (
        <ScrollView horizontal>
          <Text>{injectedCode}</Text>
        </ScrollView>
      )}
      {warningVisible && (
        <Alert
          type="error"
          title={`Injected code not properly stringified.\n\nSave the injected code file to trigger a hot reload and it will work:\n\n\t(...)/injectedCode/${filename}`}
        />
      )}
    </>
  );
}

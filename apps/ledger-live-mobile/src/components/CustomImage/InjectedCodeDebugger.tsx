import React, { useCallback, useState } from "react";
import { Alert, Flex, IconsLegacy, Switch, Text } from "@ledgerhq/native-ui";
import { Linking, ScrollView } from "react-native";
import Link from "../wrappedUi/Link";

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
  const codeNotStringified = injectedCode?.trim() === "[bytecode]";

  if (!__DEV__) return null;
  return (
    <>
      {debug && (
        <Switch checked={sourceVisible} onChange={toggleShowSource} label="Show injected code" />
      )}
      {sourceVisible && (
        <ScrollView horizontal>
          <Text>{injectedCode}</Text>
        </ScrollView>
      )}
      {codeNotStringified && <CodeNotStringifiedWarning filename={filename} />}
    </>
  );
}

const issueURL = "https://github.com/facebook/hermes/issues/612";
function getStringificationErrorMessage(filename: string) {
  return `\
DEV ERROR ONLY / EXPECTED / DON'T PANIC

TL;DR:
You have to hot reload the following file to make the picture processing work:

(...)/injectedCode/${filename}
(open the file in your editor, add a newline and save)


Explanation:
- Some code has to be stringified in order to be injected in a webview.
- Hermes currently has an issue that breaks this stringification in development mode.
- The only way to make it work is to hot reload the file containing the code to stringify.
- It does not affect production builds.
`;
}

const CodeNotStringifiedWarning: React.FC<{ filename: string }> = ({ filename }) => (
  <Alert type="warning">
    <Flex flexDirection="column" flex={1} alignItems={"flex-start"}>
      <Text variant="bodyLineHeight" fontWeight="semiBold">
        {getStringificationErrorMessage(filename)}
      </Text>
      <Link onPress={() => Linking.openURL(issueURL)} Icon={IconsLegacy.ExternalLinkMedium}>
        {"cf. issue on Hermes github repo"}
      </Link>
    </Flex>
  </Alert>
);

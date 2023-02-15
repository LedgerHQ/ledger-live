import React, { useCallback } from "react";
import { Icons } from "@ledgerhq/native-ui";
import { Buffer } from "buffer";
import { useNavigation } from "@react-navigation/native";
import Clipboard from "@react-native-community/clipboard";
import { NavigatorName, ScreenName } from "../../../../const";
import SettingsRow from "../../../../components/SettingsRow";

type Props = {
  title: string;
  dataStr: string;
};
export default function ImportBridgeStreamData({ title, dataStr }: Props) {
  const navigation = useNavigation();

  const importString = useCallback(
    (dataStr: string) => {
      try {
        const utf8Str = Buffer.from(dataStr, "base64").toString("utf8");
        const data = JSON.parse(utf8Str);

        navigation.navigate(NavigatorName.ImportAccounts, {
          screen: ScreenName.ScanAccounts,
          params: {
            data,
          },
        });
      } catch (e) {
        console.error(e);
      }
    },
    [navigation],
  );

  const importFromClipboard = useCallback(() => {
    Clipboard.getString().then(str => {
      importString(
        str.startsWith("BRIDGESTREAM_DATA=")
          ? str.replace("BRIDGESTREAM_DATA=", "")
          : str,
      );
    });
  }, [importString]);

  const handlePress = useCallback(() => {
    if (!dataStr) importFromClipboard();
    importString(dataStr);
  }, [dataStr, importFromClipboard, importString]);

  return (
    <SettingsRow
      title={title}
      desc={
        dataStr
          ? "Import string detected. Press to import it. Long press to import the string from the clipboard."
          : "No import string detected. Press to import the string from the clipboard."
      }
      iconLeft={<Icons.ImportMedium size={24} color="black" />}
      onPress={handlePress}
      onLongPress={importFromClipboard}
    />
  );
}

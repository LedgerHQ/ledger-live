import React, { useCallback, useState } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import { useSelector } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import { userIdSelector } from "@ledgerhq/client-ids/store";

const EquipmentIdRow = () => {
  const userId = useSelector(userIdSelector);
  const segmentId = userId.exportUserIdForDebugDisplay();
  const [copied, setCopied] = useState(false);

  const copyEquipmentIdToClipboard = useCallback(() => {
    Clipboard.setString(segmentId);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [segmentId]);

  return (
    <SettingsRow
      title="Equipment Id"
      desc={copied ? "Copied !" : segmentId}
      onPress={copyEquipmentIdToClipboard}
    />
  );
};

export default EquipmentIdRow;

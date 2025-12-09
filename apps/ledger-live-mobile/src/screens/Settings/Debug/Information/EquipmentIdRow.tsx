import React, { useCallback, useEffect, useState } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import { useSelector } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import { userIdSelector } from "~/reducers/identities";

const EquipmentIdRow = () => {
  const userId = useSelector(userIdSelector);
  const [segmentId, setSegmentID] = useState("loading...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      setSegmentID(userId.exportUserIdForDisplay());
  }, [userId]);

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

import React, { useCallback, useEffect, useState } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import SettingsRow from "~/components/SettingsRow";
import getOrCreateUser from "../../../../user";

const EquipmentIdRow = () => {
  const [segmentId, setSegmentID] = useState("loading...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOrCreateUser().then(({ user }) => {
      setSegmentID(user.id);
    });
  });

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

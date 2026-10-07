import React, { useCallback, useState } from "react";
import { copyToClipboard } from "@shared/clipboard";
import SettingsRow from "~/components/SettingsRow";
import { useSelector } from "~/context/hooks";
import { userIdSelector } from "@domain/entity-client-identity";

const EquipmentIdRow = () => {
  const userId = useSelector(userIdSelector);
  const segmentId = userId.exportUserIdForUserLogs();
  const [copied, setCopied] = useState(false);

  const copyEquipmentIdToClipboard = useCallback(async () => {
    if (!(await copyToClipboard(segmentId))) return;
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

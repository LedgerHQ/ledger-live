import React, { useEffect, useState } from "react";
import SettingsRow from "../../../components/SettingsRow";
import getOrCreateUser from "../../../user";

const EquipmentIdRow = () => {
  const [segmentId, setSegmentID] = useState("loading...");

  useEffect(() => {
    getOrCreateUser().then(({ user }) => {
      setSegmentID(user.id);
    });
  });

  return (
    <SettingsRow title="Equipment Id" desc={segmentId} onPress={undefined} />
  );
};

export default EquipmentIdRow;

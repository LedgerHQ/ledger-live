import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { unsafe_setKnownDeviceModelIds } from "~/actions/settings";
import { knownDeviceModelIdsSelector } from "~/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";

const HasStaxRow = () => {
  const dispatch = useDispatch();
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasStax = knownDeviceModelIds.stax;

  const onChange = useCallback(
    (enabled: boolean) => {
      dispatch(unsafe_setKnownDeviceModelIds({ [DeviceModelId.stax]: enabled }));
    },
    [dispatch],
  );

  return (
    <>
      <SettingsRow
        title="Has connected once to a Ledger Stax"
        desc="Some features (such as Stax NFT metadata) are only available if LL has been connected once to a Ledger Stax. Activate this to simulate that state."
      >
        <Switch checked={hasStax} onChange={onChange} />
      </SettingsRow>
    </>
  );
};

export default HasStaxRow;

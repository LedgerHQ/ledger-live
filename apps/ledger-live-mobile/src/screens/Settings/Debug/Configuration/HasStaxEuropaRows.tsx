import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { unsafe_setKnownDeviceModelIds } from "~/actions/settings";
import { knownDeviceModelIdsSelector } from "~/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";

const HasStaxEuropaRows = () => {
  const dispatch = useDispatch();
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasStax = knownDeviceModelIds.stax;
  const hasEuropa = knownDeviceModelIds.europa;

  const onChangeStax = useCallback(
    (enabled: boolean) => {
      dispatch(unsafe_setKnownDeviceModelIds({ [DeviceModelId.stax]: enabled }));
    },
    [dispatch],
  );

  const onChangeEuropa = useCallback(
    (enabled: boolean) => {
      dispatch(unsafe_setKnownDeviceModelIds({ [DeviceModelId.europa]: enabled }));
    },
    [dispatch],
  );

  return (
    <>
      <SettingsRow
        title="Has connected once to a Ledger Stax"
        desc="Some features (custom lock screen, stax NFT metadata) are only available if LL has been connected once to a Ledger Stax. Activate this to emulate that state."
      >
        <Switch checked={hasStax} onChange={onChangeStax} />
      </SettingsRow>
      <SettingsRow
        title="Has connected once to a Ledger Europa"
        desc="Some features (custom lock screen) are only available if LL has been connected once to a Ledger Europa. Activate this to emulate that state."
      >
        <Switch checked={hasEuropa} onChange={onChangeEuropa} />
      </SettingsRow>
    </>
  );
};

export default HasStaxEuropaRows;

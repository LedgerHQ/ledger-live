import React, { useCallback, useEffect, useState } from "react";
import { Flex, Alert, Switch } from "@ledgerhq/native-ui";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import RequiresBLE from "../../../../components/RequiresBLE";
import { useDebouncedRequireBluetooth } from "../../../../components/RequiresBLE/hooks/useRequireBluetooth";
import RequiresBluetoothDrawer from "../../../../components/RequiresBLE/RequiresBluetoothDrawer";

/**
 * Debugging screen to test:
 * - permission of the bluetooth service
 * - reaction on enabling/disabling the bluetooth service
 * - for Android: permission of the location service
 * - for Android: reaction on enabling/disabling the location services
 *
 * 2 types of requirements enforcement strategy are available:
 * - use the RequiresBLE component
 * - use the useRequireBluetooth hook with the RequiresBluetoothDrawer component
 */
export default function DebugBluetoothAndLocationServices() {
  const [openSettings, setOpenSettings] = useState(false);
  const [useCustomizedRequirements, setUseCustomizedRequirements] =
    useState(true);
  const [isBleRequired, setIsBleRequired] = useState(false);
  const [doesBleNeedScanning, setDoesBleNeedScanning] = useState(false);

  const isRequireCustomizedBluetoothEnabled =
    useCustomizedRequirements && isBleRequired;

  // Makes sure we are not using the custom requirements hook and the RequiresBLE component
  useEffect(() => {
    if (!useCustomizedRequirements) {
      setIsBleRequired(false);
    }
  }, [useCustomizedRequirements, isBleRequired]);

  const onUserClose = useCallback(() => {
    setIsBleRequired(false);
  }, []);

  const {
    bluetoothRequirementsState,
    retryRequestOnIssue,
    cannotRetryRequest,
  } = useDebouncedRequireBluetooth({
    requiredFor: doesBleNeedScanning ? "scanning" : "connecting",
    isHookEnabled: isRequireCustomizedBluetoothEnabled,
  });

  return (
    <NavigationScrollView>
      <Flex p="4">
        <Flex mb="2">
          <Switch
            checked={useCustomizedRequirements}
            onChange={val => setUseCustomizedRequirements(val)}
            label={
              "Use customizable bluetooth requirements - a drawer is used to display issues"
            }
          />
        </Flex>
        <Flex mb="2">
          <Switch
            checked={openSettings}
            onChange={val => setOpenSettings(val)}
            label={
              "Open settings: on a permission denied or service disabled, go to settings and does not prompt the user"
            }
          />
        </Flex>
        {useCustomizedRequirements ? (
          <>
            <Flex mb="4">
              <Switch
                checked={isBleRequired}
                onChange={val => setIsBleRequired(val)}
                label={`Need bluetooth ${isBleRequired ? "🔵" : "🔴"}`}
              />
            </Flex>

            <Flex mb="2">
              <Switch
                checked={doesBleNeedScanning}
                onChange={val => setDoesBleNeedScanning(val)}
                label={`Need bluetooth for scanning ? ${
                  doesBleNeedScanning ? "📡" : "🗣"
                }`}
              />
            </Flex>
            <Flex mt={5}>
              <RequiresBluetoothDrawer
                isOpenedOnIssue={isRequireCustomizedBluetoothEnabled}
                onUserClose={onUserClose}
                bluetoothRequirementsState={bluetoothRequirementsState}
                retryRequestOnIssue={retryRequestOnIssue}
                cannotRetryRequest={cannotRetryRequest}
              />

              {bluetoothRequirementsState === "all_respected" ? (
                <Alert
                  type="info"
                  title="We have all the permissions for the services and they are enabled ✅"
                />
              ) : bluetoothRequirementsState === "unknown" ? (
                <Alert
                  type="info"
                  title="Unknwon state on permissions/services 🤷"
                />
              ) : (
                <Alert
                  type="error"
                  title="Missing some permissions/services ..."
                />
              )}
            </Flex>
          </>
        ) : (
          <Flex mt={5}>
            <RequiresBLE forceOpenSettingsOnErrorButton={openSettings}>
              <Alert
                type="info"
                title="We have all the permissions for the services and they are enabled ✅"
              />
            </RequiresBLE>
          </Flex>
        )}
      </Flex>
    </NavigationScrollView>
  );
}

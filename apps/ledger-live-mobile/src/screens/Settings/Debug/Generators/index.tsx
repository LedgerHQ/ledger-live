import React, { useCallback } from "react";
import config from "react-native-config";
import { getEnv } from "@ledgerhq/live-env";
import { Alert as Confirmation } from "react-native";
import { Alert, Flex, Icons, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import GenerateMockAccounts from "./GenerateMockAccounts";
import ImportBridgeStreamData from "./ImportBridgeStreamData";
import GenerateMockAccount from "./GenerateMockAccountsSelect";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import ToggleServiceStatusIncident from "./ToggleServiceStatus";
import SettingsRow from "~/components/SettingsRow";
import { dangerouslyOverrideState, resetNftStatus } from "~/actions/settings";
import { useReboot } from "~/context/Reboot";

import { INITIAL_STATE as INITIAL_SETTINGS_STATE } from "~/reducers/settings";
import { INITIAL_STATE as INITIAL_ACCOUNTS_STATE } from "~/reducers/accounts";
import { INITIAL_STATE as INITIAL_BLE_STATE } from "~/reducers/ble";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";

export default function Generators() {
  const dispatch = useDispatch();
  const reboot = useReboot();

  const onCallbackWithConfirmation = (callback: () => void) => {
    Confirmation.alert(
      "Destructive operation",
      "There is no coming back from this.",
      [
        {
          text: "Destroy",
          onPress: callback,
        },
        {
          text: "Cancel",
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onPress: () => {},
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  const onWipeSettings = useCallback(() => {
    onCallbackWithConfirmation(() => {
      dispatch(
        dangerouslyOverrideState({
          settings: INITIAL_SETTINGS_STATE,
        }),
      );
    });
  }, [dispatch]);

  const onWipeUsers = useCallback(() => {
    onCallbackWithConfirmation(() => {
      dispatch(
        dangerouslyOverrideState({
          accounts: INITIAL_ACCOUNTS_STATE,
        }),
      );
    });
  }, [dispatch]);

  const onWipeBLE = useCallback(() => {
    onCallbackWithConfirmation(() => {
      dispatch(
        dangerouslyOverrideState({
          ble: INITIAL_BLE_STATE,
        }),
      );
    });
  }, [dispatch]);

  const onForceRefresh = useCallback(() => {
    reboot();
  }, [reboot]);

  const onWipeAntiSpam = useCallback(() => {
    dispatch(resetNftStatus());
  }, [dispatch]);

  return (
    <SettingsNavigationScrollView>
      <GenerateMockAccount
        title="Accounts by currency"
        desc="Select for which currencies you want to generate accounts"
        iconLeft={<IconsLegacy.ClipboardListCheckMedium size={24} color="black" />}
      />
      <GenerateMockAccounts
        title="Accounts"
        desc="Replace existing accounts with 10 mock accounts from random currencies."
        count={10}
      />
      <FeatureToggle featureId="llNftSupport">
        <GenerateMockAccount
          title="Accounts with NFTs"
          desc="Select for which currencies you want to generate accounts and NFTs"
          iconLeft={<Icons.Nft size="M" color="black" />}
          withNft
        />
      </FeatureToggle>

      {getEnv("MOCK") ? <ToggleServiceStatusIncident /> : null}
      <ImportBridgeStreamData
        title="Import .env BRIDGESTREAM_DATA"
        dataStr={config.BRIDGESTREAM_DATA as string}
      />
      <Flex p={6}>
        <Alert
          type="error"
          title="The rows below perform destructive operations and should only be used if you know exactly what you're doing."
        />
      </Flex>
      <SettingsRow
        hasBorderTop
        title="Refresh?"
        desc="You may want to reload the app after wiping data"
        iconLeft={<IconsLegacy.RefreshMedium size={24} color="black" />}
        onPress={onForceRefresh}
      />
      <SettingsRow
        title="Settings"
        desc="Restores all settings to their default values"
        iconLeft={<IconsLegacy.SettingsMedium size={24} color="black" />}
        onPress={onWipeSettings}
      />
      <SettingsRow
        title="Accounts"
        desc="Get rid of all the accounts"
        iconLeft={<IconsLegacy.UserMedium size={24} color="black" />}
        onPress={onWipeUsers}
      />
      <SettingsRow
        title="BLE devices"
        desc="Forget all seed devices"
        iconLeft={<IconsLegacy.NanoMedium size={24} color="black" />}
        onPress={onWipeBLE}
      />
      <FeatureToggle featureId="llNftSupport">
        <SettingsRow
          title="Reset HiddenCollections NFTs"
          desc="Remove all NFTs from the HiddenCollection list"
          iconLeft={<Icons.Nft size="M" color="black" />}
          onPress={onWipeAntiSpam}
        />
      </FeatureToggle>
    </SettingsNavigationScrollView>
  );
}

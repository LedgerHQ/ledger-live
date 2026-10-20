import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import invariant from "invariant";
import { useIsFocused } from "@react-navigation/native";
import { Button, InfiniteLoader } from "@ledgerhq/native-ui";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isStacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import SafeAreaView from "~/components/SafeAreaView";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";
import SelectDeviceScreen from "~/screens/SelectDevice";
import { useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { stacksFlowStyles as styles } from "../shared/styles";
import { useRetry } from "../shared/useRetry";
import type { StacksStakingFlowParamList } from "./types";
import { useStartBurnHtRefresh } from "./useStartBurnHtRefresh";

type Props = BaseComposite<
  StackNavigatorProps<StacksStakingFlowParamList, ScreenName.StacksStakingSelectDevice>
>;

/**
 * The shared SelectDevice screen forwards its own route params to ConnectDevice, which signs them
 * as-is. So `startBurnHt` is refreshed here until a device is picked (the point at which LLD's
 * StakeFlowModal stops refreshing), and each refreshed transaction goes back through the bridge:
 * only a transaction/status pair that was revalidated together reaches the params, so a change on
 * chain while the user waits here (the pox-5 prepare phase opening) blocks device selection
 * instead of reaching ConnectDevice behind a stale, error-free status.
 */
export default function StakingSelectDevice(props: Props) {
  const { navigation, route } = props;
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(account?.type === "Account" && isStacksAccount(account), "stacks account required");

  const bridge = useAccountBridge<StacksTransaction>(account, parentAccount);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(bridge, () => ({ account, transaction: route.params.transaction }));

  // Set once the first refresh on this screen lands: until then, the params still carry Amount's
  // snapshot, which device auto-selection must not be allowed to sign.
  const [refreshed, setRefreshed] = useState(false);
  const onStartBurnHtResolved = useCallback(
    (startBurnHt: number) => {
      setRefreshed(true);
      updateTransaction(prev =>
        bridge.updateTransaction(prev, {
          familySpecificData: { ...prev.familySpecificData, startBurnHt },
        }),
      );
    },
    [bridge, updateTransaction],
  );

  const { poxError, retry: refreshStartBurnHt } = useStartBurnHtRefresh(
    isFocused,
    onStartBurnHtResolved,
  );

  const statusError = bridgePending ? null : getFirstStatusError(status, "errors");
  const isValidated = refreshed && !bridgePending && !bridgeError && !statusError;

  // `bridgeError` is a settled failure even though `bridgePending` stays true with it (the bridge
  // retries a failed preparation on its own), so it isn't gated on `bridgePending`.
  const error = poxError || bridgeError || statusError;
  // Refreshing the height also hands the bridge a new transaction, so it retries every error kind.
  const { retrying, retry } = useRetry(error, refreshStartBurnHt);

  // The list stays mounted through later refreshes once shown: until the next pair is revalidated,
  // the params keep the previous validated one, so a tap meanwhile still signs a consistent pair.
  // An error drops that pair, so the list only comes back after a retry has revalidated.
  const [hasValidatedPair, setHasValidatedPair] = useState(false);
  const paramsInSync = route.params.transaction === transaction && route.params.status === status;

  useEffect(() => {
    if (!isValidated || !transaction || paramsInSync) return;
    navigation.setParams({ transaction, status });
  }, [isValidated, navigation, paramsInSync, status, transaction]);

  // Adjusted during render (not in an effect): `paramsInSync` already reads the live route params.
  // Back from ConnectDevice, the params still hold the pair validated before leaving, possibly long
  // ago, and the shared selector could auto-select a device on it right away: so the list waits for
  // a fresh refresh and revalidation again. Reset on regaining focus rather than on blur, so the
  // outgoing screen doesn't swap to the loader mid-transition.
  const [wasFocused, setWasFocused] = useState(isFocused);
  if (isFocused !== wasFocused) {
    setWasFocused(isFocused);
    if (isFocused) {
      setRefreshed(false);
      setHasValidatedPair(false);
    }
  }

  let nextHasValidatedPair = hasValidatedPair;
  if (error) nextHasValidatedPair = false;
  else if (isValidated && paramsInSync) nextHasValidatedPair = true;
  if (nextHasValidatedPair !== hasValidatedPair) setHasValidatedPair(nextHasValidatedPair);

  if (error) {
    return (
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={styles.content} testID="stacks-stake-select-device-error">
          <Alert type="error">
            <TranslatedError error={error} />
          </Alert>
          <Button
            mt={4}
            outline
            type="main"
            size="large"
            onPress={retry}
            pending={retrying}
            disabled={retrying}
            testID="stacks-stake-select-device-retry"
          >
            {t("common.retry")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasValidatedPair) {
    return (
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={styles.content} testID="stacks-stake-select-device-preparing">
          <InfiniteLoader />
        </View>
      </SafeAreaView>
    );
  }

  // The shared screen is typed for no navigator in particular (`{ [key: string]: object }`) and
  // forwards whatever params it receives to the matching ConnectDevice route. Mounted as a navigator
  // `component` (as the Unstake flow does), that loose type is never compared with the route's;
  // rendered from this typed wrapper, it is, so the props are narrowed to it.
  return <SelectDeviceScreen {...(props as React.ComponentProps<typeof SelectDeviceScreen>)} />;
}

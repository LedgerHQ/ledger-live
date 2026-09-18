import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type {
  ICPAccount,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { SignedOperation } from "@ledgerhq/types-live";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import invariant from "invariant";
import React, { useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import DeviceAction from "~/components/DeviceAction";
import { renderLoading } from "~/components/DeviceAction/rendering";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import { broadcastLogger } from "~/datadog";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";
import logger from "~/logger";
import { mevProtectionSelector } from "~/reducers/settings";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { applyNeuronOperation } from "../common";
import type { InternetComputerNeuronManageFlowParamList } from "../NeuronManageFlow/types";
import type { InternetComputerStakingFlowParamList } from "../StakingFlow/types";

type Props = (
  | StackNavigatorProps<
      InternetComputerNeuronManageFlowParamList,
      ScreenName.InternetComputerNeuronConnectDevice
    >
  | StackNavigatorProps<
      InternetComputerStakingFlowParamList,
      ScreenName.InternetComputerStakingConnectDevice
    >
) & {
  /** Analytics category; the two ICP flows report separately. */
  category: string;
};

/**
 * What the broadcast throws for a stake whose ICP may have left the account with no neuron to show
 * for it: the transfer went out without a certified answer, or settled and the claim then failed —
 * refused, or with its outcome unknown. The coin module folds every such failure into these two
 * names (broadcast.ts), so anything else here means the transfer itself was refused, by the node
 * or by the ledger. A governance call raises the same "unconfirmed" with nothing transferred, and
 * is typed NONE, which the fold skips.
 */
const STAKE_UNRESOLVED = new Set(["ICPCallUnconfirmed", "ICPStakeNotRefreshed"]);

/**
 * ICP's own signing screen, in place of the shared `~/screens/ConnectDevice`.
 *
 * The shared one folds a broadcast operation in with `addPendingOperation` only. That is enough for
 * every other family, but a signed `list_neurons` carries the account's neuron snapshot in
 * `extra.neurons`, and it is the only thing that can refresh it — background sync cannot. Without
 * this fold the list would keep showing the pre-sync neurons until the next account sync.
 */
export default function ICPConnectDevice({ navigation, route, category }: Props) {
  const action = useTransactionDeviceAction();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mevProtected = useSelector(mevProtectionSelector);
  const { account, parentAccount } = useAccountScreen(route);
  invariant(account, "account is required");

  const { appName, transaction, status, analyticsPropertyFlow, device } = route.params;
  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const stepNavigation = navigation as unknown as NativeStackNavigationProp<
    Record<string, object | undefined>
  >;

  const broadcast = useBroadcast({
    account,
    parentAccount,
    transaction,
    broadcastConfig: {
      mevProtected,
      source: { type: "coin-module", name: "ledger-live-mobile" },
    },
    logger: broadcastLogger,
  });

  // `renderOnResult` runs on every render while the signed result is shown, so the broadcast has to
  // be fired once per mount or the same signed transaction goes out repeatedly.
  const hasBroadcast = useRef(false);

  const handleTx = useCallback(
    (payload: { signedOperation: SignedOperation; transactionSignError?: Error }) => {
      if (!hasBroadcast.current) {
        hasBroadcast.current = true;
        (async () => {
          try {
            if (payload.transactionSignError) throw payload.transactionSignError;
            const operation = (await broadcast(
              payload.signedOperation,
            )) as InternetComputerOperation;
            applyNeuronOperation(dispatch, mainAccount, operation, transaction);
            stepNavigation.replace(route.name.replace("ConnectDevice", "ValidationSuccess"), {
              ...route.params,
              // The snapshot is already on the account, and route params are persisted state: the
              // neurons are full of bigints, which cannot be serialized.
              result: { ...operation, extra: { ...operation.extra, neurons: undefined } },
            });
          } catch (caught) {
            // Normalised here because this is where a throw becomes a screen: TranslatedError
            // keys off `name`, and logger.critical expects an Error.
            const error = caught instanceof Error ? caught : new Error(String(caught));
            // Filing the operation stops the account reading as though nothing was sent — without it
            // a stake that lands here leaves an empty snapshot, and the account page offers to stake
            // again. Deliberately without the transaction, which would replay onto the snapshot a
            // command the canister refused, or may never have run.
            if (STAKE_UNRESOLVED.has(error.name)) {
              applyNeuronOperation(
                dispatch,
                mainAccount,
                payload.signedOperation.operation as InternetComputerOperation,
              );
            }
            if (
              error.name !== "UserRefusedOnDevice" &&
              error.name !== "TransactionRefusedOnDevice"
            ) {
              logger.critical(error);
            }
            stepNavigation.replace(route.name.replace("ConnectDevice", "ValidationError"), {
              ...route.params,
              error,
              // A refusal on device sent nothing; anything the broadcast threw did. Whether the
              // command may already have executed is what decides if a retry is offered.
              signed: !payload.transactionSignError,
            });
          }
        })();
      }
      return renderLoading({ t });
    },
    [broadcast, dispatch, mainAccount, route.name, route.params, stepNavigation, t, transaction],
  );

  const onSelectDeviceLink = useCallback(
    () =>
      stepNavigation.navigate(route.name.replace("ConnectDevice", "SelectDevice"), {
        ...route.params,
        forceSelectDevice: true,
      }),
    [route.name, route.params, stepNavigation],
  );

  if (!transaction) return null;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background.main }]}>
      <TrackScreen
        category={category}
        name="ConnectDevice"
        flow="stake"
        action={transaction.type}
        currency={mainAccount.currency.id}
      />
      <DeviceAction
        // @ts-expect-error the action is typed against the generated union of every family's
        // transaction, which does not track the narrowing to ICP.
        action={action}
        request={{ account, parentAccount, appName, transaction, status }}
        device={device}
        onSelectDeviceLink={onSelectDeviceLink}
        renderOnResult={handleTx}
        analyticsPropertyFlow={analyticsPropertyFlow}
      />
    </SafeAreaView>
  );
}

const edges = ["bottom"] as Edge[];

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

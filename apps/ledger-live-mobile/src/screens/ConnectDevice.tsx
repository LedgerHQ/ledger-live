import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useTheme } from "styled-components/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { accountScreenSelector } from "~/reducers/accounts";
import DeviceAction from "~/components/DeviceAction";
import { renderLoading } from "~/components/DeviceAction/rendering";
import { useSignedTxHandler } from "~/logic/screenTransactionHooks";
import { TrackScreen } from "~/analytics";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ClaimRewardsNavigatorParamList } from "~/components/RootNavigator/types/ClaimRewardsNavigator";
import type { FreezeNavigatorParamList } from "~/components/RootNavigator/types/FreezeNavigator";
import type { UnfreezeNavigatorParamList } from "~/components/RootNavigator/types/UnfreezeNavigator";
import type { PolkadotSimpleOperationFlowParamList } from "~/families/polkadot/SimpleOperationFlow/types";
import type { PolkadotNominateFlowParamList } from "~/families/polkadot/NominateFlow/types";
import type { PolkadotUnbondFlowParamList } from "~/families/polkadot/UnbondFlow/type";
import type { PolkadotRebondFlowParamList } from "~/families/polkadot/RebondFlow/type";
import type { PolkadotBondFlowParamList } from "~/families/polkadot/BondFlow/types";
import type { AlgorandClaimRewardsFlowParamList } from "~/families/algorand/Rewards/ClaimRewardsFlow/type";
import type { AlgorandOptInFlowParamList } from "~/families/algorand/OptInFlow/types";
import type { CardanoDelegationFlowParamList } from "~/families/cardano/DelegationFlow/types";
import type { CardanoUndelegationFlowParamList } from "~/families/cardano/UndelegationFlow/types";
import type { CeloWithdrawFlowParamList } from "~/families/celo/WithdrawFlow/types";
import type { CeloRevokeFlowFlowParamList } from "~/families/celo/RevokeFlow/types";
import type { CeloActivateFlowParamList } from "~/families/celo/ActivateFlow/types";
import type { CeloVoteFlowParamList } from "~/families/celo/VoteFlow/types";
import type { CeloUnlockFlowParamList } from "~/families/celo/UnlockFlow/types";
import type { CeloLockFlowParamList } from "~/families/celo/LockFlow/types";
import type { CeloRegistrationFlowParamList } from "~/families/celo/RegistrationFlow/types";
import type { CosmosDelegationFlowParamList } from "~/families/cosmos/DelegationFlow/types";
import type { CosmosRedelegationFlowParamList } from "~/families/cosmos/RedelegationFlow/types";
import type { CosmosUndelegationFlowParamList } from "~/families/cosmos/UndelegationFlow/types";
import type { CosmosClaimRewardsFlowParamList } from "~/families/cosmos/ClaimRewardsFlow/types";
import type { MultiversXDelegationFlowParamList } from "~/families/multiversx/components/Flows/Delegate/types";
import type { MultiversXUndelegationFlowParamList } from "~/families/multiversx/components/Flows/Undelegate/types";
import type { MultiversXClaimRewardsFlowParamList } from "~/families/multiversx/components/Flows/Claim/types";
import type { MultiversXWithdrawFlowParamList } from "~/families/multiversx/components/Flows/Withdraw/types";
import type { NearStakingFlowParamList } from "~/families/near/StakingFlow/types";
import type { NearUnstakingFlowParamList } from "~/families/near/UnstakingFlow/types";
import type { NearWithdrawingFlowParamList } from "~/families/near/WithdrawingFlow/types";
import type { AptosStakingFlowParamList } from "~/families/aptos/StakingFlow/types";
import type { AptosRestakingFlowParamList } from "~/families/aptos/RestakingFlow/types";
import type { AptosUnstakingFlowParamList } from "~/families/aptos/UnstakingFlow/types";
import type { AptosWithdrawingFlowParamList } from "~/families/aptos/WithdrawingFlow/types";
import { SolanaDelegationFlowParamList } from "~/families/solana/DelegationFlow/types";
import { StellarAddAssetFlowParamList } from "~/families/stellar/AddAssetFlow/types";
import { TezosDelegationFlowParamList } from "~/families/tezos/DelegationFlow/types";
import { TronVoteFlowParamList } from "~/families/tron/VoteFlow/types";
import { useTransactionDeviceAction } from "~/hooks/deviceActions";
import { SignedOperation } from "@ledgerhq/types-live";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";

type Props =
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendConnectDevice>
  | StackNavigatorProps<ClaimRewardsNavigatorParamList, ScreenName.ClaimRewardsConnectDevice>
  | StackNavigatorProps<FreezeNavigatorParamList, ScreenName.FreezeConnectDevice>
  | StackNavigatorProps<UnfreezeNavigatorParamList, ScreenName.UnfreezeConnectDevice>
  | StackNavigatorProps<
      PolkadotSimpleOperationFlowParamList,
      ScreenName.PolkadotSimpleOperationConnectDevice
    >
  | StackNavigatorProps<PolkadotNominateFlowParamList, ScreenName.PolkadotNominateConnectDevice>
  | StackNavigatorProps<PolkadotUnbondFlowParamList, ScreenName.PolkadotUnbondConnectDevice>
  | StackNavigatorProps<PolkadotRebondFlowParamList, ScreenName.PolkadotRebondConnectDevice>
  | StackNavigatorProps<PolkadotBondFlowParamList, ScreenName.PolkadotBondConnectDevice>
  | StackNavigatorProps<
      AlgorandClaimRewardsFlowParamList,
      ScreenName.AlgorandClaimRewardsConnectDevice
    >
  | StackNavigatorProps<CardanoDelegationFlowParamList, ScreenName.CardanoDelegationConnectDevice>
  | StackNavigatorProps<
      CardanoUndelegationFlowParamList,
      ScreenName.CardanoUndelegationConnectDevice
    >
  | StackNavigatorProps<AlgorandOptInFlowParamList, ScreenName.AlgorandOptInConnectDevice>
  | StackNavigatorProps<CeloWithdrawFlowParamList, ScreenName.CeloWithdrawConnectDevice>
  | StackNavigatorProps<CeloRevokeFlowFlowParamList, ScreenName.CeloRevokeConnectDevice>
  | StackNavigatorProps<CeloActivateFlowParamList, ScreenName.CeloActivateConnectDevice>
  | StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteConnectDevice>
  | StackNavigatorProps<CeloUnlockFlowParamList, ScreenName.CeloUnlockConnectDevice>
  | StackNavigatorProps<CeloLockFlowParamList, ScreenName.CeloLockConnectDevice>
  | StackNavigatorProps<CeloRegistrationFlowParamList, ScreenName.CeloRegistrationConnectDevice>
  | StackNavigatorProps<CosmosDelegationFlowParamList, ScreenName.CosmosDelegationConnectDevice>
  | StackNavigatorProps<CosmosRedelegationFlowParamList, ScreenName.CosmosRedelegationConnectDevice>
  | StackNavigatorProps<CosmosUndelegationFlowParamList, ScreenName.CosmosUndelegationConnectDevice>
  | StackNavigatorProps<CosmosClaimRewardsFlowParamList, ScreenName.CosmosClaimRewardsConnectDevice>
  | StackNavigatorProps<
      MultiversXDelegationFlowParamList,
      ScreenName.MultiversXDelegationConnectDevice
    >
  | StackNavigatorProps<
      MultiversXUndelegationFlowParamList,
      ScreenName.MultiversXUndelegationConnectDevice
    >
  | StackNavigatorProps<
      MultiversXClaimRewardsFlowParamList,
      ScreenName.MultiversXClaimRewardsConnectDevice
    >
  | StackNavigatorProps<MultiversXWithdrawFlowParamList, ScreenName.MultiversXWithdrawConnectDevice>
  | StackNavigatorProps<NearStakingFlowParamList, ScreenName.NearStakingConnectDevice>
  | StackNavigatorProps<NearUnstakingFlowParamList, ScreenName.NearUnstakingConnectDevice>
  | StackNavigatorProps<NearWithdrawingFlowParamList, ScreenName.NearWithdrawingConnectDevice>
  | StackNavigatorProps<AptosStakingFlowParamList, ScreenName.AptosStakingConnectDevice>
  | StackNavigatorProps<AptosRestakingFlowParamList, ScreenName.AptosRestakingConnectDevice>
  | StackNavigatorProps<AptosUnstakingFlowParamList, ScreenName.AptosUnstakingConnectDevice>
  | StackNavigatorProps<AptosWithdrawingFlowParamList, ScreenName.AptosWithdrawingConnectDevice>
  | StackNavigatorProps<SolanaDelegationFlowParamList, ScreenName.DelegationConnectDevice>
  | StackNavigatorProps<StellarAddAssetFlowParamList, ScreenName.StellarAddAssetConnectDevice>
  | StackNavigatorProps<TezosDelegationFlowParamList, ScreenName.DelegationConnectDevice>
  | StackNavigatorProps<TronVoteFlowParamList, ScreenName.VoteConnectDevice>;

export const navigateToSelectDevice = (navigation: Props["navigation"], route: Props["route"]) =>
  // Assumes that it will always navigate to a "SelectDevice"
  // type of component accepting mostly the same params as this one.
  (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(
    route.name.replace("ConnectDevice", "SelectDevice"),
    {
      ...route.params,
      forceSelectDevice: true,
    },
  );
export default function ConnectDevice({ route, navigation }: Props) {
  const action = useTransactionDeviceAction();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const { appName, onSuccess, onError, analyticsPropertyFlow } = route.params;
  const mainAccount = getMainAccount(account, parentAccount);
  const { transaction, status } = useBridgeTransaction(() => ({
    account: mainAccount,
    transaction: route.params.transaction,
  }));
  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;
  const handleTx = useSignedTxHandler({
    account,
    parentAccount,
  });
  const onResult = useCallback(
    (payload: { signedOperation: SignedOperation; transactionSignError?: Error }) => {
      handleTx(payload);
      return renderLoading({
        t,
      });
    },
    [handleTx, t],
  );
  const extraProps = onSuccess
    ? {
        onResult: onSuccess,
        onError,
      }
    : {
        renderOnResult: onResult,
      };
  return useMemo(
    () =>
      transaction ? (
        <SafeAreaView
          edges={edges}
          style={[
            styles.root,
            {
              backgroundColor: colors.background.main,
            },
          ]}
        >
          <TrackScreen category={route.name.replace("ConnectDevice", "")} name="ConnectDevice" />
          <DeviceAction
            // @ts-expect-error what is going on with this
            action={action}
            request={{
              account,
              parentAccount,
              appName,
              transaction,
              status,
              tokenCurrency,
            }}
            device={route.params.device}
            onSelectDeviceLink={() => navigateToSelectDevice(navigation, route)}
            {...extraProps}
            analyticsPropertyFlow={analyticsPropertyFlow}
            location={
              analyticsPropertyFlow === "send" ? HOOKS_TRACKING_LOCATIONS.sendFlow : undefined
            }
          />
        </SafeAreaView>
      ) : null, // prevent rerendering caused by optimistic update (i.e. exclude account related deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, transaction, tokenCurrency, route.params.device],
  );
}

const edges = ["bottom"] as Edge[];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

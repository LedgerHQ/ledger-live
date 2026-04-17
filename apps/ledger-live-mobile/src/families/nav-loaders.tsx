import React from "react";

type ScreenModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  options?: object;
};

type ScreenProps = {
  navigation: { setOptions: (o: object) => void };
  [key: string]: unknown;
};

/**
 * Lazily loads a family navigation screen that exports { component, options }.
 *
 * Adapts the { component, options } module format to the { default } format
 * expected by React.lazy(). Screen options are applied via navigation.setOptions()
 * in a useLayoutEffect once the module is loaded.
 *
 * React Navigation 7 handles Suspense correctly for nested navigators — the
 * navigation state is preserved across the suspension boundary so inner routes
 * are restored when the lazy component mounts.
 */
function createLazyScreen(
  loader: () => Promise<ScreenModule>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.ComponentType<any> {
  const Lazy = React.lazy(async () => {
    const { component: Component, options } = await loader();
    function Screen(props: ScreenProps) {
      React.useLayoutEffect(() => {
        if (options) props.navigation.setOptions(options);
      }, [props.navigation]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.createElement(Component, props as any);
    }
    return { default: Screen };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function LazyScreen(props: ScreenProps): React.ReactElement<any> {
    return (
      <React.Suspense fallback={null}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Lazy {...(props as any)} />
      </React.Suspense>
    );
  };
}

/**
 * Lazily loads a navigator component that uses a default export
 * (used for EditTransactionNavigators whose options are set directly in BaseNavigator).
 */
function createLazyNavigator(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loader: () => Promise<{ default: React.ComponentType<any> }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.ComponentType<any> {
  const Lazy = React.lazy(loader);

  return function LazyNavigator(props: object) {
    return (
      <React.Suspense fallback={null}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Lazy {...(props as any)} />
      </React.Suspense>
    );
  };
}

/**
 * All 47 family navigation screens — none are loaded at app boot.
 * Each module imports only when the user first navigates to that screen.
 *
 * Hand-maintained: add/remove entries here when a family screen is added or removed.
 */
export const familyNavigatorScreens = {
  // algorand (3)
  AlgorandEditMemo: createLazyScreen(() => import("./algorand/ScreenEditMemoValue")),
  AlgorandClaimRewardsFlow: createLazyScreen(() => import("./algorand/Rewards/ClaimRewardsFlow")),
  AlgorandOptInFlow: createLazyScreen(() => import("./algorand/OptInFlow")),
  // bitcoin (1)
  BitcoinEditCustomFees: createLazyScreen(() => import("./bitcoin/ScreenEditCustomFees")),
  // canton (2)
  CantonOnboard: createLazyScreen(() => import("./canton/Onboard/Onboard")),
  CantonEditMemo: createLazyScreen(() => import("./canton/ScreenEditMemo")),
  // cardano (3)
  CardanoEditMemo: createLazyScreen(() => import("./cardano/EditMemo")),
  CardanoDelegationFlow: createLazyScreen(() => import("./cardano/DelegationFlow")),
  CardanoUndelegationFlow: createLazyScreen(() => import("./cardano/UndelegationFlow")),
  // casper (1)
  CasperEditTransferId: createLazyScreen(() => import("./casper/ScreenEditTransferId")),
  // celo (8)
  CeloManageAssetsNavigator: createLazyScreen(() => import("./celo/ManageAssetsNavigator")),
  CeloRegistrationFlow: createLazyScreen(() => import("./celo/RegistrationFlow")),
  CeloLockFlow: createLazyScreen(() => import("./celo/LockFlow")),
  CeloUnlockFlow: createLazyScreen(() => import("./celo/UnlockFlow")),
  CeloVoteFlow: createLazyScreen(() => import("./celo/VoteFlow")),
  CeloActivateFlow: createLazyScreen(() => import("./celo/ActivateFlow")),
  CeloRevokeFlow: createLazyScreen(() => import("./celo/RevokeFlow")),
  CeloWithdrawFlow: createLazyScreen(() => import("./celo/WithdrawFlow")),
  // concordium (1)
  ConcordiumOnboard: createLazyScreen(() => import("./concordium/Onboard/Onboard")),
  // cosmos (5)
  CosmosDelegationFlow: createLazyScreen(() => import("./cosmos/DelegationFlow")),
  CosmosRedelegationFlow: createLazyScreen(() => import("./cosmos/RedelegationFlow")),
  CosmosUndelegationFlow: createLazyScreen(() => import("./cosmos/UndelegationFlow")),
  CosmosClaimRewardsFlow: createLazyScreen(() => import("./cosmos/ClaimRewardsFlow")),
  CosmosFamilyEditMemo: createLazyScreen(() => import("./cosmos/EditMemo")),
  // evm (2)
  EvmEditGasLimit: createLazyScreen(() => import("./evm/ScreenEditGasLimit")),
  EvmCustomFees: createLazyScreen(() => import("./evm/EvmCustomFees")),
  // hedera (6)
  HederaEditMemo: createLazyScreen(() => import("./hedera/EditMemo")),
  HederaAssociateTokenFlow: createLazyScreen(() => import("./hedera/AssociateTokenFlow")),
  HederaDelegationFlow: createLazyScreen(() => import("./hedera/DelegationFlow")),
  HederaUndelegationFlow: createLazyScreen(() => import("./hedera/UndelegationFlow")),
  HederaRedelegationFlow: createLazyScreen(() => import("./hedera/RedelegationFlow")),
  HederaClaimRewardsFlow: createLazyScreen(() => import("./hedera/ClaimRewardsFlow")),
  // internet_computer (1)
  InternetComputerEditMemo: createLazyScreen(() => import("./internet_computer/ScreenEditMemo")),
  // kaspa (1)
  KaspaEditCustomFees: createLazyScreen(() => import("./kaspa/ScreenEditCustomFees")),
  // mina (1)
  MinaEditMemo: createLazyScreen(() => import("./mina/ScreenEditMemo")),
  // multiversx (4)
  MultiversXClaimRewardsFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Claim"),
  ),
  MultiversXDelegationFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Delegate"),
  ),
  MultiversXUndelegationFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Undelegate"),
  ),
  MultiversXWithdrawFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Withdraw"),
  ),
  // near (3)
  NearStakingFlow: createLazyScreen(() => import("./near/StakingFlow")),
  NearUnstakingFlow: createLazyScreen(() => import("./near/UnstakingFlow")),
  NearWithdrawingFlow: createLazyScreen(() => import("./near/WithdrawingFlow")),
  // polkadot (5)
  PolkadotBondFlow: createLazyScreen(() => import("./polkadot/BondFlow")),
  PolkadotRebondFlow: createLazyScreen(() => import("./polkadot/RebondFlow")),
  PolkadotUnbondFlow: createLazyScreen(() => import("./polkadot/UnbondFlow")),
  PolkadotNominateFlow: createLazyScreen(() => import("./polkadot/NominateFlow")),
  PolkadotSimpleOperationFlow: createLazyScreen(() => import("./polkadot/SimpleOperationFlow")),
  // solana (2)
  SolanaEditMemo: createLazyScreen(() => import("./solana/ScreenEditMemo")),
  SolanaDelegationFlow: createLazyScreen(() => import("./solana/DelegationFlow")),
  // stacks (1)
  StacksEditMemo: createLazyScreen(() => import("./stacks/ScreenEditMemo")),
  // stellar (4)
  StellarEditMemoValue: createLazyScreen(() => import("./stellar/ScreenEditMemoValue")),
  StellarEditMemoType: createLazyScreen(() => import("./stellar/ScreenEditMemoType")),
  StellarEditCustomFees: createLazyScreen(() => import("./stellar/ScreenEditCustomFees")),
  StellarAddAssetFlow: createLazyScreen(() => import("./stellar/AddAssetFlow")),
  // sui (2)
  SuiDelegationFlow: createLazyScreen(() => import("./sui/StakingFlow")),
  SuiUndelegateFlow: createLazyScreen(() => import("./sui/UnstakingFlow")),
  // tezos (1)
  TezosDelegationFlow: createLazyScreen(() => import("./tezos/DelegationFlow")),
  // ton (1)
  TonEditComment: createLazyScreen(() => import("./ton/ScreenEditComment")),
  // tron (1)
  TronVoteFlow: createLazyScreen(() => import("./tron/VoteFlow")),
  // xrp (1)
  XrpEditTag: createLazyScreen(() => import("./xrp/ScreenEditTag")),
};

/**
 * EVM and Bitcoin EditTransaction navigators — registered with explicit
 * options={{ headerShown: false }} in BaseNavigator, so no options wrapper needed.
 */
export const EvmEditTransactionNavigator = createLazyNavigator(
  () => import("./evm/EditTransactionFlow/EditTransactionNavigator"),
);
export const BitcoinEditTransactionNavigator = createLazyNavigator(
  () => import("./bitcoin/EditTransactionFlow/EditTransactionNavigator"),
);

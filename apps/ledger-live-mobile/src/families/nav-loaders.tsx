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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyScreen = React.ComponentType<any> & {
  navigationOptions?: object;
  /** Warms the chunk so React.lazy resolves synchronously (used by tests to avoid loading inside a timed render). */
  preload: () => Promise<ScreenModule>;
};

// staticOptions are forwarded by BaseNavigator to <Stack.Screen> so the chrome
// (e.g. headerShown) is correct before the chunk resolves; the module's full
// options are then applied via setOptions() once loaded.
function createLazyScreen(loader: () => Promise<ScreenModule>, staticOptions?: object): LazyScreen {
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
  const LazyScreen = function (props: ScreenProps): React.ReactElement<any> {
    return (
      <React.Suspense fallback={null}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Lazy {...(props as any)} />
      </React.Suspense>
    );
  } as LazyScreen;
  LazyScreen.navigationOptions = staticOptions;
  LazyScreen.preload = loader;
  return LazyScreen;
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
 * All family navigation screens — none are loaded at app boot.
 * Each module imports only when the user first navigates to that screen.
 *
 * Hand-maintained: add/remove entries here when a family screen is added or removed.
 */
const noHeader = { headerShown: false };

export const familyNavigatorScreens = {
  // algorand (3)
  AlgorandEditMemo: createLazyScreen(() => import("./algorand/ScreenEditMemoValue")),
  AlgorandClaimRewardsFlow: createLazyScreen(
    () => import("./algorand/Rewards/ClaimRewardsFlow"),
    noHeader,
  ),
  AlgorandOptInFlow: createLazyScreen(() => import("./algorand/OptInFlow"), noHeader),
  // bitcoin (1)
  BitcoinEditCustomFees: createLazyScreen(() => import("./bitcoin/ScreenEditCustomFees")),
  // canton (2)
  CantonOnboard: createLazyScreen(() => import("./canton/Onboard/Onboard"), noHeader),
  CantonEditMemo: createLazyScreen(() => import("./canton/ScreenEditMemo")),
  // cardano (3)
  CardanoEditMemo: createLazyScreen(() => import("./cardano/EditMemo")),
  CardanoDelegationFlow: createLazyScreen(() => import("./cardano/DelegationFlow"), noHeader),
  CardanoUndelegationFlow: createLazyScreen(() => import("./cardano/UndelegationFlow"), noHeader),
  // casper (1)
  CasperEditTransferId: createLazyScreen(() => import("./casper/ScreenEditTransferId")),
  // celo (8)
  CeloManageAssetsNavigator: createLazyScreen(() => import("./celo/ManageAssetsNavigator")),
  CeloRegistrationFlow: createLazyScreen(() => import("./celo/RegistrationFlow"), noHeader),
  CeloLockFlow: createLazyScreen(() => import("./celo/LockFlow"), noHeader),
  CeloUnlockFlow: createLazyScreen(() => import("./celo/UnlockFlow"), noHeader),
  CeloVoteFlow: createLazyScreen(() => import("./celo/VoteFlow"), noHeader),
  CeloActivateFlow: createLazyScreen(() => import("./celo/ActivateFlow"), noHeader),
  CeloRevokeFlow: createLazyScreen(() => import("./celo/RevokeFlow"), noHeader),
  CeloWithdrawFlow: createLazyScreen(() => import("./celo/WithdrawFlow"), noHeader),
  // concordium (1)
  ConcordiumOnboard: createLazyScreen(() => import("./concordium/Onboard/Onboard"), noHeader),
  // cosmos (5)
  CosmosDelegationFlow: createLazyScreen(() => import("./cosmos/DelegationFlow"), noHeader),
  CosmosRedelegationFlow: createLazyScreen(() => import("./cosmos/RedelegationFlow"), noHeader),
  CosmosUndelegationFlow: createLazyScreen(() => import("./cosmos/UndelegationFlow"), noHeader),
  CosmosClaimRewardsFlow: createLazyScreen(() => import("./cosmos/ClaimRewardsFlow"), noHeader),
  CosmosFamilyEditMemo: createLazyScreen(() => import("./cosmos/EditMemo")),
  // evm (4)
  EvmEditGasLimit: createLazyScreen(() => import("./evm/ScreenEditGasLimit")),
  EvmCustomFees: createLazyScreen(() => import("./evm/EvmCustomFees")),
  EvmDelegationFlow: createLazyScreen(() => import("./evm/DelegationFlow"), noHeader),
  EvmUndelegationFlow: createLazyScreen(() => import("./evm/UndelegationFlow"), noHeader),
  // hedera (6)
  HederaEditMemo: createLazyScreen(() => import("./hedera/EditMemo")),
  HederaAssociateTokenFlow: createLazyScreen(() => import("./hedera/AssociateTokenFlow"), noHeader),
  HederaDelegationFlow: createLazyScreen(() => import("./hedera/DelegationFlow"), noHeader),
  HederaUndelegationFlow: createLazyScreen(() => import("./hedera/UndelegationFlow"), noHeader),
  HederaRedelegationFlow: createLazyScreen(() => import("./hedera/RedelegationFlow"), noHeader),
  HederaClaimRewardsFlow: createLazyScreen(() => import("./hedera/ClaimRewardsFlow"), noHeader),
  // internet_computer (1)
  InternetComputerEditMemo: createLazyScreen(() => import("./internet_computer/ScreenEditMemo")),
  // kaspa (1)
  KaspaEditCustomFees: createLazyScreen(() => import("./kaspa/ScreenEditCustomFees")),
  // mina (1)
  MinaEditMemo: createLazyScreen(() => import("./mina/ScreenEditMemo")),
  // multiversx (4)
  MultiversXClaimRewardsFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Claim"),
    noHeader,
  ),
  MultiversXDelegationFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Delegate"),
    noHeader,
  ),
  MultiversXUndelegationFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Undelegate"),
    noHeader,
  ),
  MultiversXWithdrawFlow: createLazyScreen(
    () => import("./multiversx/components/Flows/Withdraw"),
    noHeader,
  ),
  // near (3)
  NearStakingFlow: createLazyScreen(() => import("./near/StakingFlow"), noHeader),
  NearUnstakingFlow: createLazyScreen(() => import("./near/UnstakingFlow"), noHeader),
  NearWithdrawingFlow: createLazyScreen(() => import("./near/WithdrawingFlow"), noHeader),
  // polkadot (5)
  PolkadotBondFlow: createLazyScreen(() => import("./polkadot/BondFlow"), noHeader),
  PolkadotRebondFlow: createLazyScreen(() => import("./polkadot/RebondFlow"), noHeader),
  PolkadotUnbondFlow: createLazyScreen(() => import("./polkadot/UnbondFlow"), noHeader),
  PolkadotNominateFlow: createLazyScreen(() => import("./polkadot/NominateFlow"), noHeader),
  PolkadotSimpleOperationFlow: createLazyScreen(
    () => import("./polkadot/SimpleOperationFlow"),
    noHeader,
  ),
  // solana (2)
  SolanaEditMemo: createLazyScreen(() => import("./solana/ScreenEditMemo")),
  SolanaDelegationFlow: createLazyScreen(() => import("./solana/DelegationFlow"), noHeader),
  // stacks (1)
  StacksEditMemo: createLazyScreen(() => import("./stacks/ScreenEditMemo")),
  // stellar (4)
  StellarEditMemoValue: createLazyScreen(() => import("./stellar/ScreenEditMemoValue")),
  StellarEditMemoType: createLazyScreen(() => import("./stellar/ScreenEditMemoType")),
  StellarEditCustomFees: createLazyScreen(() => import("./stellar/ScreenEditCustomFees")),
  StellarAddAssetFlow: createLazyScreen(() => import("./stellar/AddAssetFlow"), noHeader),
  // sui (2)
  SuiDelegationFlow: createLazyScreen(() => import("./sui/StakingFlow"), noHeader),
  SuiUndelegateFlow: createLazyScreen(() => import("./sui/UnstakingFlow"), noHeader),
  // tezos (1)
  TezosDelegationFlow: createLazyScreen(() => import("./tezos/DelegationFlow"), noHeader),
  // ton (1)
  TonEditComment: createLazyScreen(() => import("./ton/ScreenEditComment")),
  // tron (1)
  TronVoteFlow: createLazyScreen(() => import("./tron/VoteFlow"), noHeader),
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

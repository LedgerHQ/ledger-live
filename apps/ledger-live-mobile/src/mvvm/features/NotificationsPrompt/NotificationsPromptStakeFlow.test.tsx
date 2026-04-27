import React from "react";
import type { ComponentType } from "react";
import { View } from "react-native";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import * as TezosReact from "@ledgerhq/live-common/families/tezos/react";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  act,
  renderWithReactQuery as render,
  screen,
  waitFor,
  withFlagOverrides,
} from "@tests/test-renderer";
import storage from "LLM/storage";
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";
import * as MobileFamilies from "~/families";
import GlobalDrawers from "~/GlobalDrawers";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { createNotificationsPromptFeatureFlags } from "./testUtils";

const featureFlagsForStakePrompt = createNotificationsPromptFeatureFlags();

type AccountKey =
  | "algorand"
  | "cardano"
  | "celo"
  | "cosmos"
  | "ethereum"
  | "hedera"
  | "multiversx"
  | "near"
  | "polkadot"
  | "solana"
  | "sui"
  | "tezos";

type StakePromptBucket =
  | "delegation/staking"
  | "redelegation/rebond"
  | "undelegation/unstaking"
  | "withdrawing/withdraw"
  | "revoke/claim/lifecycle";

type MobileFamilyFlowExport = keyof typeof MobileFamilies;

type MobileFamilyFlow = {
  component: ComponentType;
};

type StakePromptCase = {
  label: string;
  bucket: StakePromptBucket;
  flowName: NavigatorName;
  familyExportKey: MobileFamilyFlowExport;
  successScreenName: ScreenName;
  errorScreenName?: ScreenName;
  accountKey: AccountKey;
  operationType: string;
  transaction: Record<string, unknown>;
  params?: Record<string, unknown>;
};

const hasComponent = (familyExport: unknown): familyExport is MobileFamilyFlow => {
  const component = (familyExport as { component?: unknown } | null)?.component;
  return component !== null && (typeof component === "function" || typeof component === "object");
};

const getMobileFamilyFlow = (familyExportKey: MobileFamilyFlowExport): MobileFamilyFlow => {
  const familyExport = MobileFamilies[familyExportKey];
  if (!hasComponent(familyExport)) {
    throw new Error(`${familyExportKey} is not a registered mobile family flow`);
  }
  return familyExport;
};

const stakePromptFlowNamePattern =
  /(Activate|Bond|ClaimRewards|Delegation|Lock|Nominate|Rebond|Redelegation|Registration|Revoke|SimpleOperation|Staking|Unbond|Undelegation|Undelegate|Unlock|Unstaking|Vote|Withdraw|Withdrawing)Flow$/;

const nonStakePromptFlowExports = new Set<MobileFamilyFlowExport>(["TronVoteFlow"]);

const findRegisteredStakePromptFlowExports = () =>
  Object.entries(MobileFamilies)
    .filter(
      ([familyExportKey, familyExport]) =>
        stakePromptFlowNamePattern.test(familyExportKey) &&
        !nonStakePromptFlowExports.has(familyExportKey as MobileFamilyFlowExport) &&
        hasComponent(familyExport),
    )
    .map(([familyExportKey]) => familyExportKey)
    .sort();

const accountsByKey = {
  algorand: genAccount("notifications-prompt-algorand", {
    currency: getCryptoCurrencyById("algorand"),
  }),
  cardano: genAccount("notifications-prompt-cardano", {
    currency: getCryptoCurrencyById("cardano"),
  }),
  celo: genAccount("notifications-prompt-celo", {
    currency: getCryptoCurrencyById("celo"),
  }),
  cosmos: genAccount("notifications-prompt-cosmos", {
    currency: getCryptoCurrencyById("cosmos"),
  }),
  ethereum: genAccount("notifications-prompt-ethereum", {
    currency: getCryptoCurrencyById("ethereum"),
  }),
  hedera: genAccount("notifications-prompt-hedera", {
    currency: getCryptoCurrencyById("hedera"),
  }),
  multiversx: genAccount("notifications-prompt-multiversx", {
    currency: getCryptoCurrencyById("elrond"),
  }),
  near: genAccount("notifications-prompt-near", {
    currency: getCryptoCurrencyById("near"),
  }),
  polkadot: {
    ...genAccount("notifications-prompt-polkadot", {
      currency: getCryptoCurrencyById("polkadot"),
    }),
    polkadotResources: {
      controller: "notifications-prompt-polkadot-controller",
    },
  },
  solana: genAccount("notifications-prompt-solana", {
    currency: getCryptoCurrencyById("solana"),
  }),
  sui: genAccount("notifications-prompt-sui", {
    currency: getCryptoCurrencyById("sui"),
  }),
  tezos: genAccount("notifications-prompt-tezos", {
    currency: getCryptoCurrencyById("tezos"),
  }),
};

const createOperation = (accountId: string, type: string) => ({
  id: `${accountId}-${type.toLowerCase()}-operation`,
  hash: `${type.toLowerCase()}-operation-hash`,
  type,
  accountId,
});

const stakePromptSource = { name: "NotificationsPromptStakeFlow" };

function HomeScreen() {
  return <View />;
}

const stakePromptCases: StakePromptCase[] = [
  {
    label: "Algorand claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.AlgorandClaimRewardsFlow,
    familyExportKey: "AlgorandClaimRewardsFlow",
    successScreenName: ScreenName.AlgorandClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.AlgorandClaimRewardsValidationError,
    accountKey: "algorand",
    operationType: "REWARD",
    transaction: { family: "algorand", mode: "claimRewards" },
  },
  {
    label: "Cardano delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.CardanoDelegationFlow,
    familyExportKey: "CardanoDelegationFlow",
    successScreenName: ScreenName.CardanoDelegationValidationSuccess,
    errorScreenName: ScreenName.CardanoDelegationValidationError,
    accountKey: "cardano",
    operationType: "DELEGATE",
    transaction: { family: "cardano", mode: "delegate" },
  },
  {
    label: "Cardano undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.CardanoUndelegationFlow,
    familyExportKey: "CardanoUndelegationFlow",
    successScreenName: ScreenName.CardanoUndelegationValidationSuccess,
    errorScreenName: ScreenName.CardanoUndelegationValidationError,
    accountKey: "cardano",
    operationType: "UNDELEGATE",
    transaction: { family: "cardano", mode: "undelegate" },
  },
  {
    label: "Celo activate",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CeloActivateFlow,
    familyExportKey: "CeloActivateFlow",
    successScreenName: ScreenName.CeloActivateValidationSuccess,
    errorScreenName: ScreenName.CeloActivateValidationError,
    accountKey: "celo",
    operationType: "ACTIVATE",
    transaction: { family: "celo", mode: "activate" },
  },
  {
    label: "Celo lock",
    bucket: "delegation/staking",
    flowName: NavigatorName.CeloLockFlow,
    familyExportKey: "CeloLockFlow",
    successScreenName: ScreenName.CeloLockValidationSuccess,
    errorScreenName: ScreenName.CeloLockValidationError,
    accountKey: "celo",
    operationType: "LOCK",
    transaction: { family: "celo", mode: "lock" },
  },
  {
    label: "Celo registration",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CeloRegistrationFlow,
    familyExportKey: "CeloRegistrationFlow",
    successScreenName: ScreenName.CeloRegistrationValidationSuccess,
    errorScreenName: ScreenName.CeloRegistrationValidationError,
    accountKey: "celo",
    operationType: "REGISTER",
    transaction: { family: "celo", mode: "register" },
  },
  {
    label: "Celo revoke",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CeloRevokeFlow,
    familyExportKey: "CeloRevokeFlow",
    successScreenName: ScreenName.CeloRevokeValidationSuccess,
    errorScreenName: ScreenName.CeloRevokeValidationError,
    accountKey: "celo",
    operationType: "REVOKE",
    transaction: { family: "celo", mode: "revoke" },
  },
  {
    label: "Celo unlock",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.CeloUnlockFlow,
    familyExportKey: "CeloUnlockFlow",
    successScreenName: ScreenName.CeloUnlockValidationSuccess,
    errorScreenName: ScreenName.CeloUnlockValidationError,
    accountKey: "celo",
    operationType: "UNLOCK",
    transaction: { family: "celo", mode: "unlock" },
  },
  {
    label: "Celo vote",
    bucket: "delegation/staking",
    flowName: NavigatorName.CeloVoteFlow,
    familyExportKey: "CeloVoteFlow",
    successScreenName: ScreenName.CeloVoteValidationSuccess,
    errorScreenName: ScreenName.CeloVoteValidationError,
    accountKey: "celo",
    operationType: "VOTE",
    transaction: { family: "celo", mode: "vote" },
  },
  {
    label: "Celo withdraw",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.CeloWithdrawFlow,
    familyExportKey: "CeloWithdrawFlow",
    successScreenName: ScreenName.CeloWithdrawValidationSuccess,
    errorScreenName: ScreenName.CeloWithdrawValidationError,
    accountKey: "celo",
    operationType: "WITHDRAW",
    transaction: { family: "celo", mode: "withdraw" },
  },
  {
    label: "Cosmos claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.CosmosClaimRewardsFlow,
    familyExportKey: "CosmosClaimRewardsFlow",
    successScreenName: ScreenName.CosmosClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.CosmosClaimRewardsValidationError,
    accountKey: "cosmos",
    operationType: "REWARD",
    transaction: { family: "cosmos", mode: "claimReward" },
  },
  {
    label: "Cosmos delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.CosmosDelegationFlow,
    familyExportKey: "CosmosDelegationFlow",
    successScreenName: ScreenName.CosmosDelegationValidationSuccess,
    errorScreenName: ScreenName.CosmosDelegationValidationError,
    accountKey: "cosmos",
    operationType: "DELEGATE",
    transaction: { family: "cosmos", mode: "delegate" },
    params: { validatorName: "cosmos-validator", source: stakePromptSource },
  },
  {
    label: "Cosmos redelegation",
    bucket: "redelegation/rebond",
    flowName: NavigatorName.CosmosRedelegationFlow,
    familyExportKey: "CosmosRedelegationFlow",
    successScreenName: ScreenName.CosmosRedelegationValidationSuccess,
    errorScreenName: ScreenName.CosmosRedelegationValidationError,
    accountKey: "cosmos",
    operationType: "REDELEGATE",
    transaction: { family: "cosmos", mode: "redelegate" },
    params: { validatorName: "cosmos-validator", source: stakePromptSource },
  },
  {
    label: "Cosmos undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.CosmosUndelegationFlow,
    familyExportKey: "CosmosUndelegationFlow",
    successScreenName: ScreenName.CosmosUndelegationValidationSuccess,
    errorScreenName: ScreenName.CosmosUndelegationValidationError,
    accountKey: "cosmos",
    operationType: "UNDELEGATE",
    transaction: { family: "cosmos", mode: "undelegate" },
  },
  {
    label: "EVM delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.EvmDelegationFlow,
    familyExportKey: "EvmDelegationFlow",
    successScreenName: ScreenName.EvmDelegationValidationSuccess,
    errorScreenName: ScreenName.EvmDelegationValidationError,
    accountKey: "ethereum",
    operationType: "DELEGATE",
    transaction: { family: "evm", mode: "delegate" },
    params: { validatorName: "evm-validator", source: stakePromptSource },
  },
  {
    label: "EVM undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.EvmUndelegationFlow,
    familyExportKey: "EvmUndelegationFlow",
    successScreenName: ScreenName.EvmUndelegationValidationSuccess,
    errorScreenName: ScreenName.EvmUndelegationValidationError,
    accountKey: "ethereum",
    operationType: "UNDELEGATE",
    transaction: { family: "evm", mode: "undelegate" },
  },
  {
    label: "Hedera claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.HederaClaimRewardsFlow,
    familyExportKey: "HederaClaimRewardsFlow",
    successScreenName: ScreenName.HederaClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.HederaClaimRewardsValidationError,
    accountKey: "hedera",
    operationType: "REWARD",
    transaction: { family: "hedera", mode: HEDERA_TRANSACTION_MODES.ClaimRewards },
    params: { source: stakePromptSource },
  },
  {
    label: "Hedera delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.HederaDelegationFlow,
    familyExportKey: "HederaDelegationFlow",
    successScreenName: ScreenName.HederaDelegationValidationSuccess,
    errorScreenName: ScreenName.HederaDelegationValidationError,
    accountKey: "hedera",
    operationType: "DELEGATE",
    transaction: {
      family: "hedera",
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 1 },
    },
    params: { source: stakePromptSource },
  },
  {
    label: "Hedera redelegation",
    bucket: "redelegation/rebond",
    flowName: NavigatorName.HederaRedelegationFlow,
    familyExportKey: "HederaRedelegationFlow",
    successScreenName: ScreenName.HederaRedelegationValidationSuccess,
    errorScreenName: ScreenName.HederaRedelegationValidationError,
    accountKey: "hedera",
    operationType: "REDELEGATE",
    transaction: {
      family: "hedera",
      mode: HEDERA_TRANSACTION_MODES.Redelegate,
      properties: { stakingNodeId: 2 },
    },
    params: { source: stakePromptSource },
  },
  {
    label: "Hedera undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.HederaUndelegationFlow,
    familyExportKey: "HederaUndelegationFlow",
    successScreenName: ScreenName.HederaUndelegationValidationSuccess,
    errorScreenName: ScreenName.HederaUndelegationValidationError,
    accountKey: "hedera",
    operationType: "UNDELEGATE",
    transaction: {
      family: "hedera",
      mode: HEDERA_TRANSACTION_MODES.Undelegate,
      properties: { stakingNodeId: 1 },
    },
    params: { source: stakePromptSource },
  },
  {
    label: "MultiversX claim rewards",
    bucket: "revoke/claim/lifecycle",
    flowName: NavigatorName.MultiversXClaimRewardsFlow,
    familyExportKey: "MultiversXClaimRewardsFlow",
    successScreenName: ScreenName.MultiversXClaimRewardsValidationSuccess,
    errorScreenName: ScreenName.MultiversXClaimRewardsValidationError,
    accountKey: "multiversx",
    operationType: "REWARD",
    transaction: { family: "elrond", mode: "claimRewards" },
  },
  {
    label: "MultiversX delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.MultiversXDelegationFlow,
    familyExportKey: "MultiversXDelegationFlow",
    successScreenName: ScreenName.MultiversXDelegationValidationSuccess,
    errorScreenName: ScreenName.MultiversXDelegationValidationError,
    accountKey: "multiversx",
    operationType: "DELEGATE",
    transaction: { family: "elrond", mode: "delegate", recipient: "erd-validator" },
    params: {
      validators: [{ contract: "erd-validator", identity: { name: "MultiversX validator" } }],
      source: stakePromptSource,
    },
  },
  {
    label: "MultiversX undelegation",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.MultiversXUndelegationFlow,
    familyExportKey: "MultiversXUndelegationFlow",
    successScreenName: ScreenName.MultiversXUndelegationValidationSuccess,
    errorScreenName: ScreenName.MultiversXUndelegationValidationError,
    accountKey: "multiversx",
    operationType: "UNDELEGATE",
    transaction: { family: "elrond", mode: "undelegate" },
  },
  {
    label: "MultiversX withdraw",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.MultiversXWithdrawFlow,
    familyExportKey: "MultiversXWithdrawFlow",
    successScreenName: ScreenName.MultiversXWithdrawValidationSuccess,
    errorScreenName: ScreenName.MultiversXWithdrawValidationError,
    accountKey: "multiversx",
    operationType: "WITHDRAW",
    transaction: { family: "elrond", mode: "withdraw" },
  },
  {
    label: "Near staking",
    bucket: "delegation/staking",
    flowName: NavigatorName.NearStakingFlow,
    familyExportKey: "NearStakingFlow",
    successScreenName: ScreenName.NearStakingValidationSuccess,
    errorScreenName: ScreenName.NearStakingValidationError,
    accountKey: "near",
    operationType: "DELEGATE",
    transaction: { family: "near", mode: "stake", recipient: "near-validator" },
  },
  {
    label: "Near unstaking",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.NearUnstakingFlow,
    familyExportKey: "NearUnstakingFlow",
    successScreenName: ScreenName.NearUnstakingValidationSuccess,
    errorScreenName: ScreenName.NearUnstakingValidationError,
    accountKey: "near",
    operationType: "UNDELEGATE",
    transaction: { family: "near", mode: "unstake" },
  },
  {
    label: "Near withdrawing",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.NearWithdrawingFlow,
    familyExportKey: "NearWithdrawingFlow",
    successScreenName: ScreenName.NearWithdrawingValidationSuccess,
    errorScreenName: ScreenName.NearWithdrawingValidationError,
    accountKey: "near",
    operationType: "WITHDRAW",
    transaction: { family: "near", mode: "withdraw" },
  },
  {
    label: "Polkadot bond",
    bucket: "delegation/staking",
    flowName: NavigatorName.PolkadotBondFlow,
    familyExportKey: "PolkadotBondFlow",
    successScreenName: ScreenName.PolkadotBondValidationSuccess,
    errorScreenName: ScreenName.PolkadotBondValidationError,
    accountKey: "polkadot",
    operationType: "BOND",
    transaction: { family: "polkadot", mode: "bond" },
  },
  {
    label: "Polkadot nominate",
    bucket: "delegation/staking",
    flowName: NavigatorName.PolkadotNominateFlow,
    familyExportKey: "PolkadotNominateFlow",
    successScreenName: ScreenName.PolkadotNominateValidationSuccess,
    errorScreenName: ScreenName.PolkadotNominateValidationError,
    accountKey: "polkadot",
    operationType: "NOMINATE",
    transaction: { family: "polkadot", mode: "nominate" },
  },
  {
    label: "Polkadot rebond",
    bucket: "redelegation/rebond",
    flowName: NavigatorName.PolkadotRebondFlow,
    familyExportKey: "PolkadotRebondFlow",
    successScreenName: ScreenName.PolkadotRebondValidationSuccess,
    errorScreenName: ScreenName.PolkadotRebondValidationError,
    accountKey: "polkadot",
    operationType: "REBOND",
    transaction: { family: "polkadot", mode: "rebond" },
  },
  {
    label: "Polkadot simple withdraw unbonded",
    bucket: "withdrawing/withdraw",
    flowName: NavigatorName.PolkadotSimpleOperationFlow,
    familyExportKey: "PolkadotSimpleOperationFlow",
    successScreenName: ScreenName.PolkadotSimpleOperationValidationSuccess,
    errorScreenName: ScreenName.PolkadotSimpleOperationValidationError,
    accountKey: "polkadot",
    operationType: "WITHDRAW_UNBONDED",
    transaction: { family: "polkadot", mode: "withdrawUnbonded" },
    params: { mode: "withdrawUnbonded" },
  },
  {
    label: "Polkadot unbond",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.PolkadotUnbondFlow,
    familyExportKey: "PolkadotUnbondFlow",
    successScreenName: ScreenName.PolkadotUnbondValidationSuccess,
    errorScreenName: ScreenName.PolkadotUnbondValidationError,
    accountKey: "polkadot",
    operationType: "UNBOND",
    transaction: { family: "polkadot", mode: "unbond" },
  },
  {
    label: "Solana delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.SolanaDelegationFlow,
    familyExportKey: "SolanaDelegationFlow",
    successScreenName: ScreenName.DelegationValidationSuccess,
    errorScreenName: ScreenName.DelegationValidationError,
    accountKey: "solana",
    operationType: "DELEGATE",
    transaction: { family: "solana", mode: "delegate" },
    params: { validatorName: "solana-validator", source: stakePromptSource },
  },
  {
    label: "Sui staking",
    bucket: "delegation/staking",
    flowName: NavigatorName.SuiDelegateFlow,
    familyExportKey: "SuiDelegationFlow",
    successScreenName: ScreenName.SuiStakingValidationSuccess,
    errorScreenName: ScreenName.SuiStakingValidationError,
    accountKey: "sui",
    operationType: "DELEGATE",
    transaction: { family: "sui", mode: "stake", recipient: "sui-validator" },
    params: { source: stakePromptSource },
  },
  {
    label: "Sui unstaking",
    bucket: "undelegation/unstaking",
    flowName: NavigatorName.SuiUndelegateFlow,
    familyExportKey: "SuiUndelegateFlow",
    successScreenName: ScreenName.SuiUnstakingValidationSuccess,
    errorScreenName: ScreenName.SuiUnstakingValidationError,
    accountKey: "sui",
    operationType: "UNDELEGATE",
    transaction: { family: "sui", mode: "unstake" },
  },
  {
    label: "Tezos delegation",
    bucket: "delegation/staking",
    flowName: NavigatorName.TezosDelegationFlow,
    familyExportKey: "TezosDelegationFlow",
    successScreenName: ScreenName.DelegationValidationSuccess,
    errorScreenName: ScreenName.DelegationValidationError,
    accountKey: "tezos",
    operationType: "DELEGATE",
    transaction: { family: "tezos", mode: "delegate", recipient: "tz1-validator" },
    params: { source: stakePromptSource },
  },
];

const stakePromptCasesByBucket = stakePromptCases.reduce(
  (acc, stakePromptCase) => {
    acc[stakePromptCase.bucket] = [...(acc[stakePromptCase.bucket] ?? []), stakePromptCase];
    return acc;
  },
  {} as Record<StakePromptBucket, StakePromptCase[]>,
);

const stakePromptErrorCasesByBucket = stakePromptCases.reduce(
  (acc, stakePromptCase) => {
    if (!stakePromptCase.errorScreenName) return acc;
    acc[stakePromptCase.bucket] = [...(acc[stakePromptCase.bucket] ?? []), stakePromptCase];
    return acc;
  },
  {} as Record<StakePromptBucket, StakePromptCase[]>,
);

let useTezosBakerSpy: jest.SpiedFunction<typeof TezosReact.useBaker>;

describe("NotificationsPrompt stake flow", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    useTezosBakerSpy = jest.spyOn(TezosReact, "useBaker").mockReturnValue({
      address: "tz1-validator",
      name: "Tezos validator",
      logoURL: "",
      nominalYield: "0 %",
      capacityStatus: "normal",
    });
  });

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    await storage.deleteAll();
  });

  afterAll(() => {
    jest.useRealTimers();
    useTezosBakerSpy.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const Stack = createNativeStackNavigator();
  const HOME_SCREEN = "Home";
  const accountsState = {
    ...MockedAccounts,
    active: [...MockedAccounts.active, ...Object.values(accountsByKey)],
  };
  const flowRoutes = Array.from(
    new Map(
      stakePromptCases.map(stakePromptCase => [
        stakePromptCase.flowName,
        {
          flowName: stakePromptCase.flowName,
          component: getMobileFamilyFlow(stakePromptCase.familyExportKey).component,
        },
      ]),
    ).values(),
  );

  const createParams = (stakePromptCase: StakePromptCase) => {
    const account = accountsByKey[stakePromptCase.accountKey];

    return {
      accountId: account.id,
      deviceId: "device-id",
      error: {
        name: "Error",
        message: `${stakePromptCase.label} validation failed`,
      } as Error,
      result: createOperation(account.id, stakePromptCase.operationType),
      transaction: stakePromptCase.transaction,
      ...stakePromptCase.params,
    };
  };

  const createFlowNavigationState = (
    stakePromptCase: StakePromptCase,
    screenName: ScreenName = stakePromptCase.successScreenName,
  ) => ({
    index: 1,
    routes: [
      {
        name: HOME_SCREEN,
      },
      {
        name: stakePromptCase.flowName,
        state: {
          index: 0,
          routes: [
            {
              name: screenName,
              params: createParams(stakePromptCase),
            },
          ],
        },
      },
    ],
  });

  function StakeFlowTestApp() {
    return (
      <GlobalDrawers>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
          {flowRoutes.map(({ flowName, component }) => (
            <Stack.Screen key={flowName} name={flowName} component={component} />
          ))}
        </Stack.Navigator>
      </GlobalDrawers>
    );
  }

  const renderStakeFlow = (
    stakePromptCase: StakePromptCase,
    screenName: ScreenName = stakePromptCase.successScreenName,
  ) =>
    render(<StakeFlowTestApp />, {
      navigationInitialState: createFlowNavigationState(stakePromptCase, screenName),
      overrideInitialState: withFlagOverrides(featureFlagsForStakePrompt, state => ({
        ...state,
        accounts: accountsState,
        notifications: {
          ...state.notifications,
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        },
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          notifications: {
            ...state.settings.notifications,
            areNotificationsAllowed: true,
          },
        },
      })),
    });

  describe("coverage guards", () => {
    it("covers every registered mobile family stake prompt flow", () => {
      const flowExportsCoveredByTheseTests = stakePromptCases
        .map(stakePromptCase => stakePromptCase.familyExportKey)
        .sort();
      const registeredStakePromptFlowExports = findRegisteredStakePromptFlowExports();

      expect(flowExportsCoveredByTheseTests).toEqual(registeredStakePromptFlowExports);
    });

    it("uses ValidationSuccess screens for every stake prompt flow", () => {
      const casesWithUnexpectedSuccessScreen = stakePromptCases
        .filter(
          stakePromptCase =>
            !String(stakePromptCase.successScreenName).endsWith("ValidationSuccess"),
        )
        .map(stakePromptCase => stakePromptCase.label);

      expect(casesWithUnexpectedSuccessScreen).toEqual([]);
    });

    it("uses ValidationError screens for every stake prompt flow", () => {
      const casesMissingErrorScreen = stakePromptCases
        .filter(stakePromptCase => !stakePromptCase.errorScreenName)
        .map(stakePromptCase => stakePromptCase.label);
      const casesWithUnexpectedErrorScreen = stakePromptCases
        .filter(
          stakePromptCase => !String(stakePromptCase.errorScreenName).endsWith("ValidationError"),
        )
        .map(stakePromptCase => stakePromptCase.label);

      expect(casesMissingErrorScreen).toEqual([]);
      expect(casesWithUnexpectedErrorScreen).toEqual([]);
    });
  });

  describe.each(Object.entries(stakePromptCasesByBucket))("%s flows", (bucket, bucketCases) => {
    it.each(bucketCases)(
      "should prompt the notifications drawer when closing $label validation success",
      async stakePromptCase => {
        const { user } = renderStakeFlow(stakePromptCase);

        expect(track).not.toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          expect.any(Object),
        );

        await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible());
        await user.press(screen.getByTestId("enabled-success-close-button"));
        await act(async () => {
          await jest.runOnlyPendingTimersAsync();
        });

        await waitFor(() => expect(screen.getByText(/allow notifications/i)).toBeVisible());
        expect(track).toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          {
            action: "stake",
            shouldPrompt: true,
            variant: ABTestingVariants.variantB,
            repromptDelay: null,
            dismissedCount: 0,
            skipReason: undefined,
          },
        );

        const allowNotificationsButton = screen.getByText(/allow notifications/i);
        await user.press(allowNotificationsButton);
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "allow notifications",
          page: "Drawer push notification opt-in",
          source: "stake",
          repromptDelay: null,
          dismissedCount: 0,
          variant: ABTestingVariants.variantB,
        });
      },
    );

    it.each(stakePromptErrorCasesByBucket[bucket as StakePromptBucket] ?? [])(
      "should not prompt the notifications drawer when closing $label validation error",
      async stakePromptCase => {
        const { errorScreenName } = stakePromptCase;
        if (!errorScreenName) return;

        const { user } = renderStakeFlow(stakePromptCase, errorScreenName);

        expect(track).not.toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          expect.any(Object),
        );

        await waitFor(() => expect(screen.getByTestId("SendErrorClose")).toBeVisible());
        await user.press(screen.getByTestId("SendErrorClose"));
        await act(async () => {
          await jest.runOnlyPendingTimersAsync();
        });

        expect(track).not.toHaveBeenCalledWith(
          "attempt_to_trigger_push_notification_drawer_after_action",
          expect.any(Object),
        );
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
      },
    );
  });
});

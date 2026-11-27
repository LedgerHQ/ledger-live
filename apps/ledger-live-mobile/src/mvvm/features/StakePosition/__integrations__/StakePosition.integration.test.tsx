import React, { useEffect, useSyncExternalStore } from "react";
import { BackHandler, Text, View } from "react-native";
import BigNumber from "bignumber.js";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  BridgeSyncContext,
  BridgeSyncStateContext,
} from "@ledgerhq/live-common/bridge/react/context";
import type { BridgeSyncState } from "@ledgerhq/live-common/bridge/react/types";
import type { SolanaAccount, Transaction } from "@ledgerhq/live-common/families/solana/types";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type {
  Account,
  AccountLike,
  Operation,
  SignedOperation,
  StakingDelegation,
  StakingUnbonding,
} from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { importCountervalues, pairId } from "@domain/entity-market-countervalues";
import { track, trackPage } from "@shared/analytics";
import { setOverride } from "@shared/feature-flags";
import type { ExecutorState } from "@features/platform-device-intent";
import {
  abandonStakePosition,
  STAKE_POSITION_SYNC_WAIT_MS,
  useShownStakePosition,
  useStakePositionOpener,
  type StakePositionOpenResult,
} from "@features/flow-stake-position";
import {
  act,
  countervaluesTestUserSettings,
  render,
  renderHook,
  screen,
  waitFor,
  withFlagOverrides,
  within,
} from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import { deleteAccount, updateAccountWithUpdater } from "~/actions/accounts";
import { NavigatorName, ScreenName } from "~/const";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import logger from "~/logger";
import type { State } from "~/reducers/types";
import Modals from "~/screens/Modals";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useStakePositionHandlers } from "LLM/features/StakePosition";

// The region of the user decides the appearance of the rate.
jest.mock("~/helpers/getStakeLabelLocaleBased", () => {
  const actual = jest.requireActual("~/helpers/getStakeLabelLocaleBased");
  return { ...actual, getCountryLocale: jest.fn(actual.getCountryLocale) };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  ...jest.requireActual("@shared/ui-queued-bottom-sheet/testing/module-mock"),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
    BottomSheetScrollView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetHeader: ({ title }: { title?: string }) => (
      <RN.Text accessibilityRole="header">{title}</RN.Text>
    ),
  };
});

// A sibling of the sheet in the app-level modals, off by default, whose webview cannot load here.
jest.mock("~/screens/RatingsModal", () => ({ __esModule: true, default: () => null }));

// The stake flow of a wallet screen navigates to the Base stack, which this test does not mount.
const mockOpenStakingDrawer = jest.fn();
jest.mock("~/components/Stake/useStakingDrawer", () => ({
  useStakingDrawer: () => mockOpenStakingDrawer,
}));

type MockExecutorProps = Readonly<{
  intent: Readonly<{
    input: Readonly<{ account: AccountLike; transaction: Transaction }>;
    onResult?: (signedOperation: SignedOperation) => void;
  }>;
  isRequestingToBeOpened?: boolean;
  onExecutorStateChanged?: (executorState: ExecutorState) => void;
  onIntentJobStateChanged?: (jobState: SignTransactionIntentWithResultJobState) => void;
  onIntentJobComplete?: () => void;
  onUserCancel: () => void;
  onDeviceSheetDismissed?: () => void;
}>;

const mockSignedTransactions: Transaction[] = [];
let mockDeviceError: Error = new Error("The device disconnected");
const mockDisconnectedState = {
  type: "deviceDisconnected",
  device: {},
} as unknown as ExecutorState;

const mockSignedOperation = (account: AccountLike): SignedOperation => ({
  signature: "stake-position-signature",
  operation: {
    id: `${account.id}-stake-position-op`,
    hash: "",
    type: "UNDELEGATE",
    value: new BigNumber(0),
    fee: new BigNumber(5000),
    senders: [],
    recipients: [],
    blockHash: null,
    blockHeight: null,
    accountId: account.id,
    date: new Date(),
    extra: {},
  },
});

function mockRetry() {}

// The device intent executor drives a real device in its own sheet: it is replaced by its outcomes,
// by the link to another screen a device step can offer, and by the way a lost device asks to
// reconnect, then to sign again. The controls of the device only show while its sheet is open; the
// two test hooks (a lost device, a sheet that finished hiding) work whatever the sheet shows.
jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const { useState } = jest.requireActual<typeof import("react")>("react");
  const { useNavigation } = jest.requireActual<typeof import("@react-navigation/native")>(
    "@react-navigation/native",
  );
  return {
    buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Solana" })),
    DeviceIntentExecutor: function MockDeviceIntentExecutor({
      intent,
      isRequestingToBeOpened,
      onExecutorStateChanged,
      onIntentJobStateChanged,
      onIntentJobComplete,
      onUserCancel,
      onDeviceSheetDismissed,
    }: MockExecutorProps) {
      const navigation = useNavigation<NavigationProp<ParamListBase>>();
      const [isDeviceLost, setIsDeviceLost] = useState(false);
      mockSignedTransactions.push(intent.input.transaction);
      const isOpen = isRequestingToBeOpened === true;
      return (
        <RN.View testID="device-step" accessibilityState={{ expanded: isOpen }}>
          {isOpen && isDeviceLost ? (
            <RN.Pressable accessibilityRole="button" onPress={() => setIsDeviceLost(false)}>
              <RN.Text>Reconnect the device</RN.Text>
            </RN.Pressable>
          ) : null}
          {isOpen && !isDeviceLost ? (
            <>
              <RN.Pressable
                accessibilityRole="button"
                onPress={() => {
                  intent.onResult?.(mockSignedOperation(intent.input.account));
                  onIntentJobComplete?.();
                }}
              >
                <RN.Text>Sign on device</RN.Text>
              </RN.Pressable>
              <RN.Pressable
                accessibilityRole="button"
                onPress={() => onIntentJobStateChanged?.({ type: "cancelled", retry: mockRetry })}
              >
                <RN.Text>Refuse on device</RN.Text>
              </RN.Pressable>
              <RN.Pressable
                accessibilityRole="button"
                onPress={() =>
                  onIntentJobStateChanged?.({
                    type: "error",
                    error: mockDeviceError,
                    retry: mockRetry,
                  })
                }
              >
                <RN.Text>Fail on device</RN.Text>
              </RN.Pressable>
              <RN.Pressable accessibilityRole="button" onPress={onUserCancel}>
                <RN.Text>Leave the device step</RN.Text>
              </RN.Pressable>
              <RN.Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("MyLedger")}
              >
                <RN.Text>Open My Ledger</RN.Text>
              </RN.Pressable>
            </>
          ) : null}
          <RN.Pressable
            testID="device-step-disconnect"
            onPress={() => {
              setIsDeviceLost(true);
              onExecutorStateChanged?.(mockDisconnectedState);
            }}
          />
          <RN.Pressable testID="device-step-hidden" onPress={onDeviceSheetDismissed} />
        </RN.View>
      );
    },
  };
});

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();

// The broadcast reaches the network: it answers the optimistic operation of the signature.
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));

const solana = getCryptoCurrencyById("solana");
const usd = getFiatCurrencyByTicker("USD");
const SOL = 1_000_000_000;
const VALIDATOR = "FakeVote1111111111111111111111111111111111";
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";
const STAKES_URL = "https://earn.api.live.ledger.com/v3/stakes";
// The endpoint of the validator rate, which the sheet no longer reads.
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";
const FIGMENT_LOGO = "https://validators.example/figment.png";
const SHEET = "stake-position-sheet";
const UPDATING_NOTICE = "This position is updating. Some details may be out of date.";
const MISSING_AUTHORITY_NOTICE =
  "You can't change this position from this account. Another wallet may control it, or a lockup may apply.";
const BROADCAST_WARNING =
  "Your transaction may have failed. Please wait a moment then check the transaction history before trying again.";

type StakesRequestItem = Readonly<{ network: string; address: string; fresh?: boolean }>;

const endpoints = {
  stakes: jest.fn<Response | Promise<Response>, [{ request: Request }]>(),
};
const stakesRequests: StakesRequestItem[][] = [];

type StakeRowOptions = Readonly<{
  status?: string;
  stakedBalance?: number;
  rewards?: number;
  deposited?: number;
  protocolName?: string;
  /** `null` sends no rate. */
  interest?: Readonly<{ type: string; value: string }> | null;
}>;

/** A `/v3/stakes` row of the requested wallet, shaped like the Earn backend's. */
function stakeRow(
  address: string,
  {
    status = "activated",
    stakedBalance = 10 * SOL,
    rewards = SOL,
    deposited = 9.75 * SOL,
    protocolName = "Ledger by Figment",
    interest = { type: "APY", value: "0.0712" },
  }: StakeRowOptions = {},
) {
  return {
    type: "BatchStakeViewV1",
    id: { network: "solana", address },
    stake: {
      provider: "prv_ledger_by_figment",
      protocol_name: protocolName,
      currency: "solana",
      interest: interest === null ? undefined : { ...interest, currency: "solana" },
      logo: FIGMENT_LOGO,
      staked_balance: String(stakedBalance),
      status,
      commission: "Net",
      rewards: [
        { currency: "solana", total: String(rewards), last24H: "0", last7D: "0", last30D: "0" },
      ],
      details: {
        type: "SolanaDetailsView",
        stake_account: STAKE_ACCOUNT,
        withdraw_pubkey: address,
        balance: stakedBalance,
        activated_epoch: 812,
        activated_at: "2026-01-12T09:30:00Z",
        net_apy: 0.0689,
        validator_address: VALIDATOR,
        updated_at: "2026-11-18T11:58:00Z",
        deposited_balance: String(deposited),
      },
    },
  };
}

let stakeRows: (address: string) => unknown[] = address => [stakeRow(address)];

const serveStakes = (rows: (address: string) => unknown[]) => {
  stakeRows = rows;
};

const failStakes = (status = 400) =>
  endpoints.stakes.mockImplementation(() =>
    HttpResponse.json({ message: "Earn is down" }, { status }),
  );

const activePosition = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: STAKE_ACCOUNT,
  validatorAddress: VALIDATOR,
  amount: new BigNumber(12 * SOL),
  activeAmount: new BigNumber(12 * SOL),
  inactiveAmount: new BigNumber(0),
  withdrawableAmount: new BigNumber(0),
  canStake: true,
  canWithdraw: true,
  pendingRewards: new BigNumber(0),
  status: "bonded",
  ...overrides,
});

const deactivatedPosition = (overrides: Partial<StakingUnbonding> = {}): StakingUnbonding => ({
  positionId: STAKE_ACCOUNT,
  validatorAddress: VALIDATOR,
  amount: new BigNumber(0),
  withdrawableAmount: new BigNumber(1.5 * SOL),
  canStake: true,
  canWithdraw: true,
  completionDate: new Date(0),
  status: "withdrawable",
  ...overrides,
});

const stakingResourcesOf = (
  delegations: StakingDelegation[],
  unbondings: StakingUnbonding[] = [],
) => ({
  delegations,
  redelegations: [],
  unbondings,
  delegatedBalance: new BigNumber(0),
  pendingRewardsBalance: new BigNumber(0),
  unbondingBalance: new BigNumber(0),
});

const syncedSecondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000);

// Each test signs from its own wallet: the user's own transaction on a position changes how the
// next opens of that position read the backend.
let accountSeed = 0;

function solanaAccount({
  delegations = [activePosition()],
  unbondings = [],
  balance = 5 * SOL,
  lastSyncDate = syncedSecondsAgo(10),
}: {
  delegations?: StakingDelegation[];
  unbondings?: StakingUnbonding[];
  balance?: number;
  lastSyncDate?: Date;
} = {}): Account {
  accountSeed += 1;
  const account: SolanaAccount = {
    ...genAccount(`stake-position-solana-${accountSeed}`, { currency: solana, operationsSize: 0 }),
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    lastSyncDate,
    stakingResources: stakingResourcesOf(delegations, unbondings),
  };
  return account;
}

const ethAccount = genAccount("stake-position-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
const bitcoinAccount = genAccount("stake-position-bitcoin", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const mockSync = jest.fn();
let syncState: BridgeSyncState = {};
const syncListeners = new Set<() => void>();
const subscribeToSyncState = (listener: () => void) => {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
};
function setSyncState(next: BridgeSyncState) {
  act(() => {
    syncState = next;
    syncListeners.forEach(listener => listener());
  });
}

const mockBaseParams = jest.fn();
function BaseScreen({ route }: NativeStackScreenProps<ParamListBase>) {
  useEffect(() => mockBaseParams(route.params), [route.params]);
  return <View />;
}

const Stack = createNativeStackNavigator();
const EarnDashboard = () => <Text>Earn dashboard</Text>;
const MyLedger = () => <Text>My Ledger</Text>;

/** The app around the sheet: a screen, the app-level modals, and the bridge sync of the account. */
function Harness() {
  const state = useSyncExternalStore(subscribeToSyncState, () => syncState);
  return (
    <BridgeSyncContext.Provider value={mockSync}>
      <BridgeSyncStateContext.Provider value={state}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="EarnDashboard" component={EarnDashboard} />
          <Stack.Screen name="MyLedger" component={MyLedger} />
          <Stack.Screen name={NavigatorName.Base} component={BaseScreen} />
        </Stack.Navigator>
        <Modals />
      </BridgeSyncStateContext.Provider>
    </BridgeSyncContext.Provider>
  );
}

type OpenHandler = (request: { params: unknown }) => Promise<StakePositionOpenResult>;

type SetupOptions = {
  account?: Account;
  liveAppAccounts?: AccountLike[];
  hasSolRate?: boolean;
  discreet?: boolean;
  isNativeStakePositionEnabled?: boolean;
  /** Earn is mounted as a tab and as a Base screen at once. */
  isEarnMountedTwice?: boolean;
};

function setup({
  account = solanaAccount(),
  liveAppAccounts = [account, ethAccount, usdcAccount, bitcoinAccount],
  hasSolRate = true,
  discreet = false,
  isNativeStakePositionEnabled = true,
  isEarnMountedTwice = false,
}: SetupOptions = {}) {
  liveAppAccounts.forEach(({ id }) => setWalletApiIdForAccountId(id));
  // Rendered first: a later render replaces what `screen` queries.
  const [earnPlayer, ...otherEarnPlayers] = Array.from({ length: isEarnMountedTwice ? 2 : 1 }, () =>
    renderHook(() => useStakePositionHandlers(liveAppAccounts), {
      overrideInitialState: withFlagOverrides({
        earnNativeStakePosition: { enabled: isNativeStakePositionEnabled },
      }),
    }),
  );
  const accountScreen = renderHook(() => useStakePositionOpener("account"));
  // Reads the request of the sheet from before it opens, as a surface does: it keeps it as closed
  // while the sheet animates out, until the sheet is hidden.
  const shown = renderHook(() => useShownStakePosition());
  const view = render(<Harness />, {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: [account, ethAccount, bitcoinAccount] },
      settings: { ...state.settings, discreetMode: discreet },
      countervalues: hasSolRate
        ? {
            ...state.countervalues,
            rates: importCountervalues(
              { status: {}, [pairId({ from: solana, to: usd })]: { latest: 150 } },
              countervaluesTestUserSettings,
            ),
          }
        : state.countervalues,
    }),
  });

  const openWith = (player: typeof earnPlayer, params: Record<string, unknown> = {}) => {
    const handler = player.result.current["custom.stake.position.open"] as unknown as OpenHandler;
    let answer: Promise<StakePositionOpenResult> = Promise.resolve({ action: null });
    act(() => {
      answer = handler({
        params: {
          accountId: getWalletApiIdFromAccountId(account.id),
          positionId: STAKE_ACCOUNT,
          ...params,
        },
      });
    });
    return answer;
  };
  const open = (params?: Record<string, unknown>) => openWith(earnPlayer, params);
  const openFromAccount = () =>
    act(() => {
      accountScreen.result.current({ accountId: account.id, positionId: STAKE_ACCOUNT });
    });
  // Awaited: once the exit transaction reads the bridge with `use()`, a sync act leaves its
  // effects unrun.
  const updateAccount = (update: (current: SolanaAccount) => SolanaAccount) =>
    act(async () => {
      view.store.dispatch(
        updateAccountWithUpdater({
          accountId: account.id,
          updater: current => update(current as SolanaAccount),
        }),
      );
    });

  return {
    ...view,
    account,
    earnPlayer,
    otherEarnPlayers,
    shown,
    open,
    openWith,
    openFromAccount,
    updateAccount,
  };
}

const isSheetOpen = () => screen.queryByTestId(SHEET)?.props.accessibilityState?.expanded === true;
const isDeviceStepOpen = () =>
  screen.queryByTestId("device-step")?.props.accessibilityState?.expanded === true;
const findDetails = () => screen.findByTestId("stake-position-details");
const lastStakesRequest = () => stakesRequests.at(-1);

const isPending = async (answer: Promise<unknown>) => {
  let isSettled = false;
  void answer.then(() => {
    isSettled = true;
  });
  await act(async () => {
    await Promise.resolve();
  });
  return !isSettled;
};

/** The priority under which the bridge skips syncs, as the sheet last asked for it. */
const syncSkipPriority = () =>
  mockSync.mock.calls
    .map(([action]) => action as { type: string; priority?: number })
    .filter(({ type }) => type === "SET_SKIP_UNDER_PRIORITY")
    .at(-1)?.priority;

/** Lets every request the sheet started answer, for a test that proves one was never made. */
const settleRequests = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(1_000);
  });

/** The answer, once the backend reads it waits for are over, retries included. */
async function settledAnswer(answer: Promise<StakePositionOpenResult>) {
  let result: StakePositionOpenResult | undefined;
  void answer.then(value => {
    result = value;
  });
  await waitFor(() => expect(result).toBeDefined(), { timeout: 10_000 });
  return result;
}

type User = ReturnType<typeof setup>["user"];

// The details name the exit like the confirmation names its button, so the confirmation is found
// through its title: the details button is gone by then.
const CONFIRMATIONS = {
  Deactivate: { title: "Deactivate your SOL", cta: "Deactivate" },
  Withdraw: { title: "Withdraw your SOL", cta: "Withdraw all" },
} as const;

async function goToConfirmation(user: User, exit: keyof typeof CONFIRMATIONS) {
  await user.press(await screen.findByRole("button", { name: exit }));
  const { title, cta } = CONFIRMATIONS[exit];
  expect(await screen.findByText(title)).toBeVisible();
  await waitFor(() => expect(screen.getByRole("button", { name: cta })).toBeEnabled());
  return screen.getByRole("button", { name: cta });
}

async function signOnDevice(user: User) {
  await user.press(await goToConfirmation(user, "Deactivate"));
  await user.press(await screen.findByRole("button", { name: "Sign on device" }));
}

const pressSheetControl = (user: User, control: "header-close" | "backdrop") =>
  user.press(screen.getByTestId(`${SHEET}-${control}`));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

const suiteSpies: Array<Pick<jest.SpyInstance, "mockRestore">> = [];
function spyOnBackPressHandlers() {
  const handlers: Array<() => boolean | null | undefined> = [];
  suiteSpies.push(
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((event, handler) => {
      if (event === "hardwareBackPress") handlers.push(handler);
      return {
        remove: () => handlers.splice(handlers.indexOf(handler), 1),
      } as unknown as ReturnType<typeof BackHandler.addEventListener>;
    }),
  );
  return handlers;
}

describe("StakePosition", () => {
  beforeAll(async () => {
    await getAccountBridge(solanaAccount());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    syncState = {};
    mockSignedTransactions.length = 0;
    stakesRequests.length = 0;
    mockDeviceError = new Error("The device disconnected");
    jest.mocked(getCountryLocale).mockReturnValue("US");
    mockBroadcast.mockReset().mockImplementation(signed => Promise.resolve(signed.operation));
    serveStakes(address => [stakeRow(address)]);
    endpoints.stakes.mockReset().mockImplementation(async ({ request }) => {
      const body = (await request.json()) as StakesRequestItem[];
      stakesRequests.push(body);
      return HttpResponse.json({
        data: body.flatMap(({ address }) => stakeRows(address)),
        meta: { is_stale: false, responded_at: "2026-11-18T12:00:01Z" },
      });
    });
    server.use(http.post(STAKES_URL, endpoints.stakes));
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const id = result.current.request?.id;
    if (id !== undefined) act(() => abandonStakePosition(id));
    unmount();
    for (const spy of suiteSpies.splice(0)) spy.mockRestore();
  });

  describe("custom.stake.position.open", () => {
    it("should reject an account id the wallet doesn't know, without a sheet", async () => {
      const { open } = setup();

      await expect(open({ accountId: "unknown-wallet-api-id" })).rejects.toMatchObject({
        name: "StakePositionAccountNotFound",
      });
      expect(isSheetOpen()).toBe(false);
    });

    it.each([
      ["a token account", usdcAccount.id],
      ["an account whose family has no position sheet", bitcoinAccount.id],
    ])("should reject %s as unsupported", async (_case, accountId) => {
      const { open } = setup();

      await expect(
        open({ accountId: getWalletApiIdFromAccountId(accountId) }),
      ).rejects.toMatchObject({ name: "StakePositionUnsupported" });
      expect(isSheetOpen()).toBe(false);
    });

    it("should answer null when the Earn player unmounts with the sheet open", async () => {
      const { open, earnPlayer } = setup();
      const answer = open();
      await findDetails();

      act(() => earnPlayer.unmount());

      await expect(answer).resolves.toEqual({ action: null });
      expect(isSheetOpen()).toBe(false);
    });
  });

  describe("the earnNativeStakePosition flag", () => {
    const METHOD = "custom.stake.position.open";

    it("should register the method while the flag is on", () => {
      const { earnPlayer } = setup();

      expect(earnPlayer.result.current).toEqual({ [METHOD]: expect.any(Function) });
    });

    it("should leave the method unknown while the flag is off, so no sheet opens and nothing is read", () => {
      const { earnPlayer } = setup({ isNativeStakePositionEnabled: false });

      expect(Object.keys(earnPlayer.result.current)).toEqual([]);
      expect(isSheetOpen()).toBe(false);
      expect(endpoints.stakes).not.toHaveBeenCalled();
    });

    it("should follow the flag when it changes while the player is mounted", () => {
      const { earnPlayer } = setup();
      const setFlag = (enabled: boolean) =>
        act(() => {
          earnPlayer.store.dispatch(
            setOverride({ key: "earnNativeStakePosition", value: { enabled } }),
          );
        });

      setFlag(false);
      expect(Object.keys(earnPlayer.result.current)).toEqual([]);

      setFlag(true);
      expect(Object.keys(earnPlayer.result.current)).toEqual([METHOD]);
    });
  });

  describe("the app-level sheet", () => {
    it("should show the position in the one sheet of the app, over the current screen", async () => {
      const { open } = setup();

      void open();

      await findDetails();
      expect(isSheetOpen()).toBe(true);
      expect(screen.getByText("Earn dashboard")).toBeVisible();
      expect(screen.getAllByTestId(SHEET)).toHaveLength(1);
    });

    it("should show one sheet when Earn is mounted twice, and let the latest request take it", async () => {
      const { earnPlayer, otherEarnPlayers, openWith } = setup({ isEarnMountedTwice: true });

      const firstAnswer = openWith(earnPlayer);
      await findDetails();
      expect(screen.getAllByTestId(SHEET)).toHaveLength(1);
      void openWith(otherEarnPlayers[0]);

      await expect(firstAnswer).resolves.toEqual({ action: null });
      await findDetails();
      expect(screen.getAllByTestId(SHEET)).toHaveLength(1);
      expect(isSheetOpen()).toBe(true);
    });
  });

  describe("details", () => {
    it("should show the figures the Earn backend reports for the wallet address", async () => {
      const { account, open } = setup();

      void open();

      await findDetails();
      expect(stakesRequests[0]).toEqual([{ network: "solana", address: account.freshAddress }]);
      expect(screen.getByRole("header", { name: "Earning Solana" })).toBeVisible();
      expect(screen.getByText("Total rewards")).toBeVisible();
      // The headline amount names itself with a space after the currency symbol.
      expect(screen.getByLabelText("$ 150.00")).toBeVisible();
      expect(screen.getByText("1\u00a0SOL")).toBeVisible();
      expect(screen.getByText("10\u00a0SOL")).toBeVisible();
      expect(screen.getByText("Current balance")).toBeVisible();
      expect(screen.getByText("Active")).toBeVisible();
      expect(screen.getByText("Ledger by Figment")).toBeVisible();
      expect(screen.getByText("7.12% APY")).toBeVisible();
      expect(screen.getByText(`Solana ${account.index + 1}`)).toBeVisible();
      expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
    });

    it("should show no initial deposit, like the mobile design, even when the backend sends it", async () => {
      const { open } = setup();

      void open();

      await findDetails();
      expect(screen.queryByText("Initial deposit")).toBeNull();
      expect(screen.queryByText("9.75\u00a0SOL")).toBeNull();
    });

    it("should open the position by its identity only, whatever else Earn still sends", async () => {
      const { open } = setup();

      void open({ rewards: String(999 * SOL), validatorAddress: "AnotherVote1111111111111111" });

      await findDetails();
      expect(screen.getByText("1\u00a0SOL")).toBeVisible();
      expect(screen.queryByText("999\u00a0SOL")).toBeNull();
    });

    it("should show the rate of the position with two decimals and its type", async () => {
      serveStakes(address => [stakeRow(address, { interest: { type: "APR", value: "0.065" } })]);
      const { open } = setup();

      void open();

      await findDetails();
      expect(screen.getByText("Current APY")).toBeVisible();
      expect(screen.getByText("6.50% APR")).toBeVisible();
      expect(screen.queryByText("6.50% APY")).toBeNull();
      expect(screen.queryByText("7.12% APY")).toBeNull();
    });

    it("should show the rate of the position, never the rate of its validator", async () => {
      const validatorRate = jest.fn(() =>
        HttpResponse.json([
          { address: VALIDATOR, delegator_apy: 0.078107, name: "Ledger by Figment" },
        ]),
      );
      server.use(http.get(VALIDATORS_SUMMARY_URL, validatorRate));
      const { open } = setup();

      void open();

      await findDetails();
      await settleRequests();
      expect(screen.getByText("7.12% APY")).toBeVisible();
      expect(screen.queryByText("7.81% APY")).toBeNull();
      expect(screen.queryByText("6.89% APY")).toBeNull();
      expect(validatorRate).not.toHaveBeenCalled();
    });

    it.each([
      ["sends no rate", { interest: null }],
      ["sends a zero rate", { interest: { type: "APY", value: "0" } }],
    ])("should hide the APY row when the backend %s", async (_case, options) => {
      serveStakes(address => [stakeRow(address, options)]);
      const { open } = setup();

      void open();

      await findDetails();
      expect(screen.queryByText("Current APY")).toBeNull();
      expect(screen.queryByText(/APY$/)).toBeNull();
    });

    it.each([
      ["in green", "US", "success"],
      ["in green for another region", "FR", "success"],
      ["in gray where green rates are not allowed", "GB", "muted"],
    ] as const)("should show the rate %s", async (_case, region, tone) => {
      jest.mocked(getCountryLocale).mockReturnValue(region);
      const { open } = setup();

      void open();

      await findDetails();
      expect(screen.getByText("7.12% APY")).toHaveStyle({
        color: ledgerLiveThemes.dark.colors.text[tone],
      });
    });

    it("should name a validator the backend does not name by its shortened vote account", async () => {
      serveStakes(address => [stakeRow(address, { protocolName: "" })]);
      const { open } = setup();

      void open();

      await findDetails();
      expect(screen.getByText("FakeVo…111111")).toBeVisible();
    });

    it("should lead with the rewards in SOL when SOL has no rate", async () => {
      const { open } = setup({ hasSolRate: false });

      void open();

      await findDetails();
      expect(screen.getByText("Total rewards")).toBeVisible();
      expect(screen.getByText("1\u00a0SOL")).toBeVisible();
      expect(screen.queryByLabelText("$ 150.00")).toBeNull();
    });

    it("should mask every amount in discreet mode", async () => {
      const { open } = setup({ discreet: true });

      void open();

      await findDetails();
      expect(screen.queryByText("1\u00a0SOL")).toBeNull();
      expect(screen.queryByText("10\u00a0SOL")).toBeNull();
      expect(screen.queryByLabelText("$ 150.00")).toBeNull();
      expect(screen.getAllByText(/\*\*\*/).length).toBeGreaterThanOrEqual(2);
    });

    it("should offer Withdraw, and no Earn more, on a deactivated position", async () => {
      serveStakes(address => [
        stakeRow(address, { status: "deactivated", stakedBalance: 1.5 * SOL }),
      ]);
      const { open } = setup({
        account: solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] }),
      });

      void open();

      await findDetails();
      expect(screen.getByText("Deactivated")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Earn more" })).toBeNull();
    });

    it("should say the position is updating while the backend and the chain disagree", async () => {
      const { open } = setup({
        account: solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] }),
      });

      void open();

      await findDetails();
      expect(screen.getByText("Active")).toBeVisible();
      expect(screen.getByText(UPDATING_NOTICE)).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
    });

    it("should track the details page without the position's address, amounts or validator", async () => {
      const { open } = setup();

      void open();

      await findDetails();
      expect(trackPage).toHaveBeenCalledWith({
        category: "Stake position",
        name: "Details",
        props: { flow: "stake", currency: "SOL", source: "earn", position_status: "active" },
      });
      expect(
        JSON.stringify([jest.mocked(trackPage).mock.calls, jest.mocked(track).mock.calls]),
      ).not.toMatch(new RegExp(`${STAKE_ACCOUNT}|${VALIDATOR}|${10 * SOL}`));
    });

    it.each(["header-close", "backdrop"] as const)(
      "should answer null when the user closes the sheet from the %s",
      async control => {
        const { open, user } = setup();
        const answer = open();
        await findDetails();

        await pressSheetControl(user, control);

        await expect(answer).resolves.toEqual({ action: null });
        expect(isSheetOpen()).toBe(false);
      },
    );

    it("should answer null when the user presses the Android back on the details", async () => {
      const backPressHandlers = spyOnBackPressHandlers();
      const { open } = setup();
      const answer = open();
      await findDetails();

      act(() => {
        backPressHandlers.at(-1)?.();
      });

      await expect(answer).resolves.toEqual({ action: null });
    });
  });

  describe("one source per figure", () => {
    it("should show the backend balance in the details and the chain amount on the confirmation", async () => {
      const { open, user } = setup();

      void open();

      await findDetails();
      expect(screen.getByText("10\u00a0SOL")).toBeVisible();
      expect(screen.queryByText("12\u00a0SOL")).toBeNull();
      await goToConfirmation(user, "Deactivate");
      expect(
        screen.getByText(
          "Your 12\u00a0SOL in Ledger by Figment will be deactivated. Once deactivated, you will be able to withdraw your funds. It may take a few days to complete deactivation.",
        ),
      ).toBeVisible();
    });
  });

  describe("when the Earn backend cannot show the position to Earn", () => {
    it.each([
      ["the read fails", () => failStakes(400)],
      ["the backend is down", () => failStakes(503)],
      ["the wallet has no such row", () => serveStakes(() => [])],
      [
        "the row is closed",
        () => serveStakes(address => [stakeRow(address, { status: "archived" })]),
      ],
      [
        "a provider failed for the wallet",
        () =>
          serveStakes(address => [
            {
              type: "BatchedErrorView",
              id: { network: "solana", address },
              error: { code: 503, reason: "Provider unavailable" },
            },
          ]),
      ],
    ])("should let Earn fall back to its menu when %s", async (_case, arrange) => {
      arrange();
      const { open } = setup();

      const answer = open();

      expect(await settledAnswer(answer)).toEqual({ action: null, reason: "unavailable" });
      expect(isSheetOpen()).toBe(false);
      expect(trackPage).not.toHaveBeenCalled();
    });

    it("should let Earn fall back when the synced account no longer holds the position", async () => {
      const { open } = setup({ account: solanaAccount({ delegations: [] }) });

      const answer = open();

      expect(await settledAnswer(answer)).toEqual({ action: null, reason: "unavailable" });
      expect(isSheetOpen()).toBe(false);
    });
  });

  describe("when a wallet screen asks for a position", () => {
    it("should show the figures of the Earn backend, tracked with its origin", async () => {
      const { openFromAccount } = setup();

      openFromAccount();

      await findDetails();
      expect(screen.getByText("10\u00a0SOL")).toBeVisible();
      expect(trackPage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Details",
          props: expect.objectContaining({ source: "account" }),
        }),
      );
    });

    it("should say the position could not be loaded, and read it again on Try again", async () => {
      failStakes(400);
      const { openFromAccount, user } = setup();

      openFromAccount();

      expect(await screen.findByText("We couldn't load this position")).toBeVisible();
      endpoints.stakes.mockImplementation(async ({ request }) => {
        const body = (await request.json()) as StakesRequestItem[];
        return HttpResponse.json({
          data: body.flatMap(({ address }) => stakeRows(address)),
          meta: { is_stale: false },
        });
      });
      await user.press(screen.getByRole("button", { name: "Try again" }));

      expect(await screen.findByText("10\u00a0SOL")).toBeVisible();
    });

    it("should say the position is not available when the backend has no row for it", async () => {
      serveStakes(() => []);
      const { openFromAccount, user } = setup();

      openFromAccount();

      expect(await screen.findByText("Position not available")).toBeVisible();
      expect(screen.queryByRole("button", { name: "Deactivate" })).toBeNull();
      await user.press(screen.getByRole("button", { name: "Close" }));
      expect(isSheetOpen()).toBe(false);
    });

    it("should say the position is not available when the synced account no longer holds it", async () => {
      const { openFromAccount } = setup({ account: solanaAccount({ delegations: [] }) });

      openFromAccount();

      expect(await screen.findByText("Position not available")).toBeVisible();
    });
  });

  describe("Earn more", () => {
    it("should answer earnMore to Earn and close, leaving Earn to open its deposit flow", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();

      await user.press(screen.getByRole("button", { name: "Earn more" }));

      await expect(answer).resolves.toEqual({ action: "earnMore" });
      expect(isSheetOpen()).toBe(false);
      expect(mockOpenStakingDrawer).not.toHaveBeenCalled();
    });

    it("should open the stake flow of the account itself for a wallet screen", async () => {
      const { account, openFromAccount, user } = setup();
      openFromAccount();
      await findDetails();

      await user.press(screen.getByRole("button", { name: "Earn more" }));

      expect(isSheetOpen()).toBe(false);
      expect(mockOpenStakingDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id }),
        undefined,
        "solana",
      );
    });
  });

  describe("account sync", () => {
    it("should sync data older than a minute once, and hold the exit until it is synced", async () => {
      const account = solanaAccount({ lastSyncDate: syncedSecondsAgo(120) });
      const { open, updateAccount } = setup({ account });

      void open();
      await findDetails();

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(mockSync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        accountId: account.id,
        priority: 10,
        reason: "stake-position-open",
      });
      expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();

      await updateAccount(current => ({ ...current, lastSyncDate: new Date() }));

      expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("should not sync data synced moments ago", async () => {
      const { open } = setup();

      void open();
      await findDetails();

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should disable the exit, but not Earn more, while the account syncs", async () => {
      const account = solanaAccount();
      syncState = { [account.id]: { pending: true, error: null } };
      const { open } = setup({ account });

      void open();
      await findDetails();

      expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
    });

    it("should hold the confirmation while a sync of the account runs, then sign the synced exit", async () => {
      const { account, open, user } = setup();
      const answer = open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");

      setSyncState({ [account.id]: { pending: true, error: null } });

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled(),
      );
      await user.press(screen.getByRole("button", { name: "Deactivate" }));
      expect(screen.queryByTestId("device-step")).toBeNull();
      expect(await isPending(answer)).toBe(true);

      setSyncState({ [account.id]: { pending: false, error: null } });
      await waitFor(() => expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled());
      await user.press(screen.getByRole("button", { name: "Deactivate" }));
      expect(await screen.findByRole("button", { name: "Sign on device" })).toBeVisible();
      expect(isDeviceStepOpen()).toBe(true);
    });

    it("should release the exit when the sync fails", async () => {
      const account = solanaAccount({ lastSyncDate: syncedSecondsAgo(120) });
      const { open } = setup({ account });
      void open();
      await findDetails();

      setSyncState({ [account.id]: { pending: false, error: new Error("offline") } });

      expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
    });

    it("should stop waiting for a sync the bridge never runs", async () => {
      const account = solanaAccount({ lastSyncDate: syncedSecondsAgo(120) });
      const { open } = setup({ account });
      void open();
      await findDetails();

      act(() => jest.advanceTimersByTime(STAKE_POSITION_SYNC_WAIT_MS));

      expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
    });

    it("should wait for the sync before letting Earn fall back for a position the chain does not hold", async () => {
      const account = solanaAccount({ delegations: [] });
      syncState = { [account.id]: { pending: true, error: null } };
      const { open } = setup({ account });

      const answer = open();
      expect(await screen.findByText("Loading your position...")).toBeVisible();
      expect(await isPending(answer)).toBe(true);

      setSyncState({ [account.id]: { pending: false, error: null } });

      await expect(answer).resolves.toEqual({ action: null, reason: "unavailable" });
      expect(isSheetOpen()).toBe(false);
    });
  });

  describe("exit transaction", () => {
    it("should deactivate the stake account read from the account, in the device step, without answering yet", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();

      await user.press(await goToConfirmation(user, "Deactivate"));

      expect(await screen.findByRole("button", { name: "Sign on device" })).toBeVisible();
      expect(isDeviceStepOpen()).toBe(true);
      expect(isSheetOpen()).toBe(false);
      expect(mockSignedTransactions.at(-1)).toMatchObject({
        mode: "undelegate",
        recipient: STAKE_ACCOUNT,
      });
      expect(await isPending(answer)).toBe(true);
    });

    it("should withdraw the whole withdrawable amount the account holds", async () => {
      serveStakes(address => [
        stakeRow(address, { status: "deactivated", stakedBalance: 1.5 * SOL }),
      ]);
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open, user } = setup({ account });
      void open();
      await findDetails();

      const confirmation = await goToConfirmation(user, "Withdraw");
      expect(
        screen.getByText(
          `Your 1.5\u00a0SOL in Ledger by Figment will be withdrawn to your Solana ${account.index + 1} account. This may take a few minutes.`,
        ),
      ).toBeVisible();
      await user.press(confirmation);

      await screen.findByRole("button", { name: "Sign on device" });
      const transaction = mockSignedTransactions.at(-1);
      expect(transaction).toMatchObject({ mode: "unstake", recipient: STAKE_ACCOUNT });
      expect(transaction?.amount).toEqual(new BigNumber(1.5 * SOL));
    });

    it("should block the confirmation while the prepared transaction has an error", async () => {
      serveStakes(address => [stakeRow(address, { status: "deactivated" })]);
      const { open, user } = setup({
        account: solanaAccount({
          delegations: [],
          unbondings: [deactivatedPosition()],
          balance: 0.5 * SOL,
        }),
      });
      void open();
      await findDetails();

      await user.press(screen.getByRole("button", { name: "Withdraw" }));

      expect(await screen.findByText("Sorry, insufficient funds")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw all" })).toBeDisabled();
    });

    it("should leave the flow from the close button of the confirmation, which has no way back", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");

      expect(screen.queryByTestId(`${SHEET}-back`)).toBeNull();
      await pressSheetControl(user, "header-close");

      await expect(answer).resolves.toEqual({ action: null });
      expect(isSheetOpen()).toBe(false);
    });

    it("should leave the flow when the user leaves the device step before signing", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));

      await user.press(await screen.findByRole("button", { name: "Leave the device step" }));

      await expect(answer).resolves.toEqual({ action: null });
      expect(isDeviceStepOpen()).toBe(false);
      expect(isSheetOpen()).toBe(false);
      expect(mockBroadcast).not.toHaveBeenCalled();
    });

    it("should leave nothing shown once the sheets of the request the user left have hidden", async () => {
      const { open, shown, user } = setup();
      void open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      // The sheet of the position hid when it stepped aside for the device.
      await user.press(screen.getByTestId(`${SHEET}-hidden`));
      await user.press(await screen.findByRole("button", { name: "Leave the device step" }));
      expect(shown.result.current).toMatchObject({
        phase: "closed",
        request: { id: expect.any(Number) },
      });
      expect(screen.getByTestId(SHEET)).toBeOnTheScreen();

      await user.press(screen.getByTestId("device-step-hidden"));

      expect(shown.result.current).toEqual({ request: null, phase: "closed" });
      expect(screen.queryByTestId(SHEET)).toBeNull();
    });

    it("should refuse a new request while the device shows the exit, and keep its executor", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await screen.findByRole("button", { name: "Sign on device" });

      await expect(open()).rejects.toMatchObject({ name: "StakePositionBusy" });

      expect(await isPending(answer)).toBe(true);
      expect(isDeviceStepOpen()).toBe(true);
      expect(screen.getByRole("button", { name: "Sign on device" })).toBeVisible();
    });

    it.each([
      ["refusing on the device", "Refuse on device"],
      ["a device error", "Fail on device"],
    ])(
      "should keep the device step after %s, for its retry, and the request locked, without logging it",
      async (_case, outcome) => {
        const critical = jest.spyOn(logger, "critical");
        suiteSpies.push(critical);
        const { open, user } = setup();
        const answer = open();
        await findDetails();
        await user.press(await goToConfirmation(user, "Deactivate"));

        await user.press(await screen.findByRole("button", { name: outcome }));

        expect(isDeviceStepOpen()).toBe(true);
        expect(isSheetOpen()).toBe(false);
        expect(screen.queryByTestId("stake-position-failure")).toBeNull();
        expect(critical).not.toHaveBeenCalled();
        await expect(open()).rejects.toMatchObject({ name: "StakePositionBusy" });
        expect(await isPending(answer)).toBe(true);
        await user.press(screen.getByRole("button", { name: "Sign on device" }));

        await expect(answer).resolves.toEqual({ action: "deactivate" });
      },
    );

    it("should answer null when the user leaves the device step after a device error", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await user.press(await screen.findByRole("button", { name: "Fail on device" }));

      await user.press(screen.getByRole("button", { name: "Leave the device step" }));

      await expect(answer).resolves.toEqual({ action: null });
      expect(isDeviceStepOpen()).toBe(false);
      expect(isSheetOpen()).toBe(false);
      expect(mockBroadcast).not.toHaveBeenCalled();
    });

    it("should answer null and take the device step down when the Earn player unmounts during it", async () => {
      const { earnPlayer, open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await screen.findByRole("button", { name: "Sign on device" });

      act(() => earnPlayer.unmount());

      await expect(answer).resolves.toEqual({ action: null });
      expect(isDeviceStepOpen()).toBe(false);
      expect(isSheetOpen()).toBe(false);
      expect(mockBroadcast).not.toHaveBeenCalled();
    });

    it("should offer to reconnect, then to sign, when the device disconnects before the signature", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await screen.findByRole("button", { name: "Sign on device" });

      await user.press(screen.getByTestId("device-step-disconnect"));

      expect(isDeviceStepOpen()).toBe(true);
      expect(screen.queryByRole("button", { name: "Sign on device" })).toBeNull();
      await user.press(screen.getByRole("button", { name: "Reconnect the device" }));
      await user.press(await screen.findByRole("button", { name: "Sign on device" }));
      await expect(answer).resolves.toEqual({ action: "deactivate" });
    });

    it("should show the processing in the sheet, and keep the request locked, while the signed transaction is broadcast", async () => {
      const broadcast = createDeferred<Operation>();
      mockBroadcast.mockReturnValueOnce(broadcast.promise);
      const { open, user } = setup();
      const answer = open();
      await findDetails();

      await signOnDevice(user);

      expect(isDeviceStepOpen()).toBe(false);
      expect(isSheetOpen()).toBe(true);
      const processing = screen.getByTestId("stake-position-broadcasting");
      expect(within(processing).getByText("Deactivate transaction in progress")).toBeVisible();
      expect(within(processing).getByText("This can take a few minutes.")).toBeVisible();
      expect(screen.queryByTestId(`${SHEET}-header-close`)).toBeNull();
      expect(screen.queryByTestId(`${SHEET}-backdrop`)).toBeNull();
      expect(await isPending(answer)).toBe(true);
      await expect(open()).rejects.toMatchObject({ name: "StakePositionBusy" });
      expect(syncSkipPriority()).toBe(100);

      broadcast.resolve(mockBroadcast.mock.calls[0][0].operation);

      await expect(answer).resolves.toEqual({ action: "deactivate" });
      await screen.findByTestId("stake-position-success");
      expect(syncSkipPriority()).toBe(-1);
    });

    it("should not offer to sign again when the device disconnects once the signature is handed over", async () => {
      const broadcast = createDeferred<Operation>();
      mockBroadcast.mockReturnValueOnce(broadcast.promise);
      const { open, user } = setup();
      void open();
      await findDetails();
      await signOnDevice(user);

      await user.press(screen.getByTestId("device-step-disconnect"));

      expect(isDeviceStepOpen()).toBe(false);
      expect(screen.queryByRole("button", { name: "Reconnect the device" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Sign on device" })).toBeNull();
      expect(screen.getByText("Deactivate transaction in progress")).toBeVisible();
      expect(mockBroadcast).toHaveBeenCalledTimes(1);
    });

    it("should name the withdrawal in the processing of a withdrawal", async () => {
      const broadcast = createDeferred<Operation>();
      mockBroadcast.mockReturnValueOnce(broadcast.promise);
      serveStakes(address => [
        stakeRow(address, { status: "deactivated", stakedBalance: 1.5 * SOL }),
      ]);
      const { open, user } = setup({
        account: solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] }),
      });
      void open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Withdraw"));

      await user.press(await screen.findByRole("button", { name: "Sign on device" }));

      expect(await screen.findByText("Withdraw transaction in progress")).toBeVisible();
      expect(screen.queryByText("Deactivate transaction in progress")).toBeNull();
      expect(isSheetOpen()).toBe(true);
      expect(isDeviceStepOpen()).toBe(false);
    });

    it("should answer the action once broadcast, with the pending operation in the account, and show the result in the sheet", async () => {
      const { account, open, store, user } = setup();
      const answer = open();
      await findDetails();
      const readsBeforeSigning = stakesRequests.length;

      await signOnDevice(user);

      await expect(answer).resolves.toEqual({ action: "deactivate" });
      const result = await screen.findByTestId("stake-position-success");
      expect(result).toBeVisible();
      expect(screen.getByText("Transaction signed")).toBeVisible();
      expect(
        screen.getByText(
          "Deactivation can take a few days. You can withdraw your SOL once it is complete.",
        ),
      ).toBeVisible();
      expect(isSheetOpen()).toBe(true);
      expect(isDeviceStepOpen()).toBe(false);
      expect(mockBroadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: "stake-position-signature",
          operation: expect.objectContaining({ id: `${account.id}-stake-position-op` }),
        }),
      );
      const storedAccount = store
        .getState()
        .accounts.active.find(({ id }: Account) => id === account.id);
      expect(storedAccount?.pendingOperations.map(({ id }: Operation) => id)).toEqual([
        `${account.id}-stake-position-op`,
      ]);
      await waitFor(() => expect(stakesRequests.length).toBeGreaterThan(readsBeforeSigning));
    });

    it("should take the device step down once its sheet has animated out", async () => {
      const { open, user } = setup();
      void open();
      await findDetails();
      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");

      await user.press(screen.getByTestId("device-step-hidden"));

      expect(screen.queryByTestId("device-step")).toBeNull();
      expect(screen.getByTestId("stake-position-success")).toBeVisible();
    });

    it("should keep the device step while the exit is still to sign, whatever its sheet reports", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await screen.findByRole("button", { name: "Sign on device" });

      await user.press(screen.getByTestId("device-step-hidden"));

      expect(isDeviceStepOpen()).toBe(true);
      await user.press(screen.getByRole("button", { name: "Sign on device" }));
      await expect(answer).resolves.toEqual({ action: "deactivate" });
    });

    it("should read the backend fresh the next time the position opens after the transaction", async () => {
      const { open, user } = setup();
      void open();
      await findDetails();
      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");
      await pressSheetControl(user, "header-close");
      serveStakes(address => [stakeRow(address, { status: "deactivating" })]);

      void open();

      await findDetails();
      expect(lastStakesRequest()).toEqual([expect.objectContaining({ fresh: true })]);
    });

    it("should open the operation once the sheet is closed, from View transaction", async () => {
      const { account, open, user } = setup();
      void open();
      await findDetails();
      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");

      await user.press(screen.getByRole("button", { name: "View transaction" }));

      expect(isSheetOpen()).toBe(false);
      await waitFor(() =>
        expect(mockBaseParams).toHaveBeenLastCalledWith({
          screen: ScreenName.OperationDetails,
          params: {
            accountId: account.id,
            operation: expect.objectContaining({ id: `${account.id}-stake-position-op` }),
          },
        }),
      );
    });

    it("should close the result from its header and leave nothing shown once its sheet has hidden", async () => {
      const { open, shown, user } = setup();
      void open();
      await findDetails();
      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");

      await pressSheetControl(user, "header-close");

      expect(isSheetOpen()).toBe(false);
      expect(shown.result.current).toMatchObject({
        phase: "closed",
        request: { id: expect.any(Number) },
      });
      expect(screen.getByTestId(SHEET)).toBeOnTheScreen();

      await user.press(screen.getByTestId(`${SHEET}-hidden`));

      expect(shown.result.current).toEqual({ request: null, phase: "closed" });
      expect(screen.queryByTestId(SHEET)).toBeNull();
    });

    it("should report its pages and buttons, never the transaction", async () => {
      const { open, user } = setup();
      void open();
      await findDetails();

      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");

      expect(jest.mocked(trackPage).mock.calls.map(([event]) => event)).toEqual([
        expect.objectContaining({ category: "Stake position", name: "Details" }),
        expect.objectContaining({ category: "Stake position", name: "Confirm" }),
        expect.objectContaining({ category: "Stake position", name: "Success" }),
      ]);
      expect(jest.mocked(track).mock.calls.map(([event]) => event)).toEqual([
        "button_clicked",
        "button_clicked",
      ]);
    });

    it("should send no transaction event from the sheet", async () => {
      const { open, user } = setup();
      void open();
      await findDetails();

      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");

      const events = jest.mocked(track).mock.calls.map(([event]) => event);
      expect(events.filter(event => /^earn_transaction_|staking_completed/.test(event))).toEqual(
        [],
      );
    });

    it("should show the failure in the sheet when the device step cannot start, and let the user try again", async () => {
      const critical = jest.spyOn(logger, "critical").mockImplementation(() => undefined);
      suiteSpies.push(critical);
      const failure = new Error("No app for this currency");
      jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(failure);
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));

      const result = await screen.findByTestId("stake-position-failure");

      expect(within(result).getByText("Transaction failed")).toBeVisible();
      expect(isSheetOpen()).toBe(true);
      expect(isDeviceStepOpen()).toBe(false);
      expect(critical).toHaveBeenCalledWith(failure);
      await user.press(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByText("Deactivate your SOL")).toBeVisible();
      await waitFor(() => expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled());
      await user.press(screen.getByRole("button", { name: "Deactivate" }));
      await user.press(await screen.findByRole("button", { name: "Sign on device" }));
      await expect(answer).resolves.toEqual({ action: "deactivate" });
    });

    it("should open a failure the user sees to a new request, since the device never showed the exit", async () => {
      suiteSpies.push(jest.spyOn(logger, "critical").mockImplementation(() => undefined));
      jest
        .mocked(buildDeviceInitializationInput)
        .mockRejectedValueOnce(new Error("No app for this currency"));
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await screen.findByTestId("stake-position-failure");
      expect(await isPending(answer)).toBe(true);

      const next = open();

      await expect(answer).resolves.toEqual({ action: null });
      await findDetails();
      expect(await isPending(next)).toBe(true);
    });

    it("should answer null when the user closes the failure of a device step that could not start", async () => {
      suiteSpies.push(jest.spyOn(logger, "critical").mockImplementation(() => undefined));
      jest
        .mocked(buildDeviceInitializationInput)
        .mockRejectedValueOnce(new Error("No app for this currency"));
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));
      await screen.findByTestId("stake-position-failure");

      await pressSheetControl(user, "header-close");

      await expect(answer).resolves.toEqual({ action: null });
      expect(isSheetOpen()).toBe(false);
    });

    it("should warn, and let the user close or try again, when a signed transaction fails to broadcast", async () => {
      suiteSpies.push(jest.spyOn(logger, "critical").mockImplementation(() => undefined));
      mockBroadcast.mockRejectedValueOnce(new Error("The network refused the transaction"));
      const { open, user } = setup();
      const answer = open();
      await findDetails();

      await signOnDevice(user);

      expect(await screen.findByTestId("stake-position-failure")).toBeVisible();
      expect(screen.getByText(BROADCAST_WARNING)).toBeVisible();
      expect(screen.getByTestId(`${SHEET}-header-close`)).toBeVisible();
      await user.press(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByText("Deactivate your SOL")).toBeVisible();
      await pressSheetControl(user, "header-close");

      await expect(answer).resolves.toEqual({ action: null });
      expect(isSheetOpen()).toBe(false);
    });

    it("should close the sheets when the device step opens another screen", async () => {
      const { open, user } = setup();
      const answer = open();
      await findDetails();
      await user.press(await goToConfirmation(user, "Deactivate"));

      await user.press(await screen.findByRole("button", { name: "Open My Ledger" }));

      await expect(answer).resolves.toEqual({ action: null });
      expect(await screen.findByText("My Ledger")).toBeVisible();
      expect(isDeviceStepOpen()).toBe(false);
      expect(isSheetOpen()).toBe(false);
    });
  });

  describe("when the account changes before the signature", () => {
    it("should prepare the exit again from the updated position on the confirmation", async () => {
      serveStakes(address => [stakeRow(address, { status: "deactivated" })]);
      const { open, updateAccount, user } = setup({
        account: solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] }),
      });
      void open();
      await findDetails();
      await goToConfirmation(user, "Withdraw");

      await updateAccount(current => ({
        ...current,
        stakingResources: stakingResourcesOf(
          [],
          [deactivatedPosition({ withdrawableAmount: new BigNumber(1.75 * SOL) })],
        ),
      }));

      expect(await screen.findByText(/^Your 1\.75\sSOL in /)).toBeVisible();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Withdraw all" })).toBeEnabled(),
      );
      await user.press(screen.getByRole("button", { name: "Withdraw all" }));
      await screen.findByRole("button", { name: "Sign on device" });
      expect(mockSignedTransactions.at(-1)?.amount).toEqual(new BigNumber(1.75 * SOL));
    });

    it("should go back to the details when the exit is no longer possible", async () => {
      const { open, updateAccount, user } = setup();
      void open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");

      await updateAccount(current => ({
        ...current,
        stakingResources: stakingResourcesOf([activePosition({ canStake: false })]),
      }));

      expect(await screen.findByText(MISSING_AUTHORITY_NOTICE)).toBeVisible();
      expect(screen.queryByRole("button", { name: "Deactivate" })).toBeNull();
    });

    it("should let Earn fall back when the position leaves the account on the details", async () => {
      const { open, updateAccount } = setup();
      const answer = open();
      await findDetails();

      await updateAccount(current => ({ ...current, stakingResources: stakingResourcesOf([]) }));

      await expect(answer).resolves.toEqual({ action: null, reason: "unavailable" });
      expect(isSheetOpen()).toBe(false);
    });

    it("should say the position is not available when the account leaves the wallet", async () => {
      const account = solanaAccount();
      const { open, store, user } = setup({ account });
      const answer = open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");

      await act(async () => {
        store.dispatch(deleteAccount(account));
      });

      expect(await screen.findByText("Position not available")).toBeVisible();
      expect(isSheetOpen()).toBe(true);
      await user.press(screen.getByRole("button", { name: "Close" }));
      await expect(answer).resolves.toEqual({ action: null });
    });
  });
});

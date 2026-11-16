import React, { useEffect, useSyncExternalStore } from "react";
import { BackHandler, Pressable } from "react-native";
import { BigNumber } from "bignumber.js";
import type { ParamListBase } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import {
  BridgeSyncContext,
  BridgeSyncStateContext,
} from "@ledgerhq/live-common/bridge/react/context";
import type { BridgeSyncState } from "@ledgerhq/live-common/bridge/react/types";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { Account, StakingDelegation, StakingUnbonding } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { importCountervalues, pairId } from "@domain/entity-market-countervalues";
import { track, trackPage } from "@shared/analytics";
import {
  abandonStakePosition,
  dismissStakePosition,
  useShownStakePosition,
  type StakePositionResult,
} from "@features/flow-stake-position";
import {
  act,
  countervaluesTestUserSettings,
  render,
  renderHook,
  screen,
  waitFor,
} from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import { deleteAccount, updateAccount, updateAccountWithUpdater } from "~/actions/accounts";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { StakePositionSheetRoot, useStakePositionHandlers } from "LLM/features/StakePosition";
import { STAKE_POSITION_SYNC_WAIT_MS } from "../hooks/useStakePositionAccountSync";

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

// Preparing a Solana transaction calls the network's RPC: the bridge is faked at its edge.
const mockBridge = {
  createTransaction: jest.fn(() => ({ family: "solana", amount: new BigNumber(0), recipient: "" })),
  updateTransaction: jest.fn((transaction: object, patch: object) => ({
    ...transaction,
    ...patch,
  })),
  prepareTransaction: jest.fn((_account: Account, transaction: object) =>
    Promise.resolve(transaction),
  ),
  getTransactionStatus: jest.fn(),
};
// Like the real one, a single settled promise per family: `use()` suspends on a new promise.
const mockBridgePromise = Object.assign(Promise.resolve(mockBridge), {
  status: "fulfilled",
  value: mockBridge,
});
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
  getAccountBridge: () => mockBridgePromise,
}));

// The deposit flow navigates to the Base stack, which this test does not mount.
const mockOpenStakingDrawer = jest.fn();
jest.mock("~/components/Stake/useStakingDrawer", () => ({
  useStakingDrawer: () => mockOpenStakingDrawer,
}));

const VALIDATORS_URL = "https://earn.api.live.ledger.com/v0/network/solana/validator-details";
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";
const FIGMENT_VOTE = "FigmentVote1111111111111111111111111111111";
const UNLISTED_VOTE = "UnlistedVote22222222222222222222222222222222";
const STAKE_ACCOUNT = "StakeAccount3333333333333333333333333333333";
const OTHER_STAKE_ACCOUNT = "StakeAccount4444444444444444444444444444444";
const SHEET = "stake-position-sheet";

const solana = getCryptoCurrencyById("solana");
const usd = getFiatCurrencyByTicker("USD");
const SOL = (amount: number) => new BigNumber(amount).times(1e9);

const endpoints = {
  validators: jest.fn<Response, [{ request: Request }]>(),
  summary: jest.fn<Response, [{ request: Request }]>(),
};

const activePosition = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: STAKE_ACCOUNT,
  validatorAddress: FIGMENT_VOTE,
  amount: SOL(2),
  activeAmount: SOL(2),
  inactiveAmount: new BigNumber(0),
  withdrawableAmount: new BigNumber(0),
  canStake: true,
  canWithdraw: true,
  pendingRewards: new BigNumber(0),
  status: "bonded",
  ...overrides,
});

const inactivePosition = (overrides: Partial<StakingUnbonding> = {}): StakingUnbonding => ({
  positionId: STAKE_ACCOUNT,
  validatorAddress: FIGMENT_VOTE,
  amount: SOL(1),
  activeAmount: new BigNumber(0),
  inactiveAmount: SOL(1),
  withdrawableAmount: SOL(1.5),
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

function solanaAccountWith(
  delegations: StakingDelegation[],
  unbondings: StakingUnbonding[] = [],
  lastSyncDate = syncedSecondsAgo(10),
): Account {
  return {
    ...genAccount("stake-position-solana", { currency: solana, operationsSize: 0 }),
    balance: SOL(5),
    spendableBalance: SOL(3),
    lastSyncDate,
    stakingResources: stakingResourcesOf(delegations, unbondings),
  } as Account;
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

const okStatus = () => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(5000),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(5000),
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

function BridgeSyncTestProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = useSyncExternalStore(subscribeToSyncState, () => syncState);
  return (
    <BridgeSyncContext.Provider value={mockSync}>
      <BridgeSyncStateContext.Provider value={state}>{children}</BridgeSyncStateContext.Provider>
    </BridgeSyncContext.Provider>
  );
}

const mockFlowParams = jest.fn();
function DeviceFlowScreen({ route, navigation }: NativeStackScreenProps<ParamListBase>) {
  useEffect(() => mockFlowParams(route.params), [route.params]);
  return <Pressable testID="leave-device-flow" onPress={() => navigation.goBack()} />;
}

const Stack = createNativeStackNavigator();

type OpenHandler = (request: { params: unknown }) => Promise<StakePositionResult>;

function renderEarn(
  account: Account,
  { withSolRate = false, discreet = false }: { withSolRate?: boolean; discreet?: boolean } = {},
) {
  const accounts = [account, ethAccount, usdcAccount, bitcoinAccount];
  accounts.forEach(({ id }) => setWalletApiIdForAccountId(id));
  const player = renderHook(() => useStakePositionHandlers(accounts));
  const view = render(
    <BridgeSyncTestProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="EarnDashboard" component={StakePositionSheetRoot} />
        <Stack.Screen name={NavigatorName.SolanaStakePositionFlow} component={DeviceFlowScreen} />
      </Stack.Navigator>
    </BridgeSyncTestProvider>,
    {
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: { ...state.accounts, active: [account, ethAccount, bitcoinAccount] },
        settings: { ...state.settings, discreetMode: discreet },
        countervalues: withSolRate
          ? {
              ...state.countervalues,
              rates: importCountervalues(
                { status: {}, [pairId({ from: solana, to: usd })]: { latest: 150 } },
                countervaluesTestUserSettings,
              ),
            }
          : state.countervalues,
      }),
    },
  );

  const open = (params: Record<string, unknown>) => {
    const handler = player.result.current["custom.stake.position.open"] as unknown as OpenHandler;
    let answer: Promise<StakePositionResult> = Promise.resolve({ action: null });
    act(() => {
      answer = handler({ params });
    });
    return answer;
  };
  const openPosition = (overrides: Record<string, unknown> = {}) =>
    open({
      accountId: getWalletApiIdFromAccountId(account.id),
      positionId: STAKE_ACCOUNT,
      validatorAddress: FIGMENT_VOTE,
      ...overrides,
    });
  // Awaited: once the confirmation reads the bridge with `use()`, a sync act leaves its effects unrun.
  const dispatch = (action: Parameters<typeof view.store.dispatch>[0]) =>
    act(async () => {
      view.store.dispatch(action);
    });
  const updatePositions = (delegations: StakingDelegation[], unbondings?: StakingUnbonding[]) =>
    dispatch(
      updateAccountWithUpdater({
        accountId: account.id,
        updater: current => ({
          ...(current as SolanaAccount),
          stakingResources: stakingResourcesOf(delegations, unbondings),
        }),
      }),
    );

  return { ...view, player, open, openPosition, dispatch, updatePositions };
}

const isSheetOpen = () => screen.queryByTestId(SHEET)?.props.accessibilityState?.expanded === true;
const pressSheetControl = async (
  user: ReturnType<typeof render>["user"],
  control: "header-close" | "backdrop" | "back",
) => user.press(screen.getByTestId(`${SHEET}-${control}`));
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

function spyOnBackPressHandlers() {
  const handlers: Array<() => boolean | null | undefined> = [];
  jest.spyOn(BackHandler, "addEventListener").mockImplementation((event, handler) => {
    if (event === "hardwareBackPress") handlers.push(handler);
    return {
      remove: () => handlers.splice(handlers.indexOf(handler), 1),
    } as unknown as ReturnType<typeof BackHandler.addEventListener>;
  });
  return handlers;
}

describe("StakePosition", () => {
  // Loading the Solana bridge registers the coin config the validators list is fetched with.
  beforeAll(async () => {
    const { getAccountBridge } = jest.requireActual<
      typeof import("@ledgerhq/live-common/bridge/index")
    >("@ledgerhq/live-common/bridge/index");
    await getAccountBridge(solanaAccountWith([activePosition()]));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    syncState = {};
    mockBridge.getTransactionStatus.mockImplementation(() => Promise.resolve(okStatus()));
    const { getSolanaValidators } = jest.requireActual("@ledgerhq/coin-solana/validators") as {
      getSolanaValidators: { reset: () => void };
    };
    getSolanaValidators.reset();
    endpoints.validators.mockReset().mockImplementation(() =>
      HttpResponse.json([
        {
          active_stake: 1,
          commission: 7,
          total_score: 1,
          vote_account: FIGMENT_VOTE,
          name: "Figment",
          avatar_url: "https://figment.example/logo.png",
          delinquent: false,
        },
      ]),
    );
    endpoints.summary
      .mockReset()
      .mockImplementation(() =>
        HttpResponse.json([{ address: FIGMENT_VOTE, delegator_apy: 0.078107, name: "Figment" }]),
      );
    server.use(
      http.get(VALIDATORS_URL, endpoints.validators),
      http.get(VALIDATORS_SUMMARY_URL, endpoints.summary),
    );
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const id = result.current.request?.id;
    if (id !== undefined) abandonStakePosition(id);
    unmount();
    jest.restoreAllMocks();
  });

  describe("custom.stake.position.open", () => {
    it("should reject an account id the wallet doesn't know", async () => {
      const { open, player } = renderEarn(solanaAccountWith([activePosition()]));

      await expect(
        open({ accountId: "unknown", positionId: STAKE_ACCOUNT, validatorAddress: FIGMENT_VOTE }),
      ).rejects.toMatchObject({ name: "StakePositionAccountNotFound" });
      expect(screen.queryByTestId(SHEET)).toBeNull();
      player.unmount();
    });

    it.each([
      ["a token account", usdcAccount.id],
      ["an account whose family has no position sheet", bitcoinAccount.id],
    ])("should reject %s as unsupported", async (_case, accountId) => {
      const { open, player } = renderEarn(solanaAccountWith([activePosition()]));

      await expect(
        open({
          accountId: getWalletApiIdFromAccountId(accountId),
          positionId: STAKE_ACCOUNT,
          validatorAddress: FIGMENT_VOTE,
        }),
      ).rejects.toMatchObject({ name: "StakePositionUnsupported" });
      expect(screen.queryByTestId(SHEET)).toBeNull();
      player.unmount();
    });

    it("should answer null when the Earn player unmounts with the sheet open", async () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]));
      const answer = openPosition();

      act(() => player.unmount());

      await expect(answer).resolves.toEqual({ action: null });
      expect(isSheetOpen()).toBe(false);
    });
  });

  describe("details", () => {
    it("should show the position with its validator, APY and rewards in one sheet", async () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]), {
        withSolRate: true,
      });

      openPosition({ rewards: "1000000000" });

      expect(isSheetOpen()).toBe(true);
      expect(screen.getByRole("header", { name: "SOL position" })).toBeVisible();
      expect(screen.getByText("Active")).toBeVisible();
      expect(screen.getByText("2\u00a0SOL")).toBeVisible();
      expect(screen.getByText("1\u00a0SOL")).toBeVisible();
      expect(screen.getByText("$150.00")).toBeVisible();
      expect(screen.getByText("StakeA…333333")).toBeVisible();
      expect(await screen.findByText("Figment")).toBeVisible();
      expect(screen.getByText("7.81%")).toBeVisible();
      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
      player.unmount();
    });

    it("should name an unlisted validator by its short address and show no APY", async () => {
      const { openPosition, player } = renderEarn(
        solanaAccountWith([activePosition({ validatorAddress: UNLISTED_VOTE })]),
      );

      openPosition({ validatorAddress: UNLISTED_VOTE });

      expect(screen.getByText("Unlist…222222")).toBeVisible();
      expect(screen.getByText("—")).toBeVisible();
      expect(screen.queryByText("Rewards")).toBeNull();
      player.unmount();
    });

    it("should mask every amount in discreet mode", () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]), {
        withSolRate: true,
        discreet: true,
      });

      openPosition({ rewards: "1000000000" });

      expect(screen.queryByText("2\u00a0SOL")).toBeNull();
      expect(screen.queryByText("$150.00")).toBeNull();
      expect(screen.getAllByText(/\*\*\*/).length).toBeGreaterThanOrEqual(2);
      player.unmount();
    });

    it("should offer the withdraw-all of a deactivated position", () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([], [inactivePosition()]));

      openPosition();

      expect(screen.getByText("Deactivated")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw all" })).toBeEnabled();
      player.unmount();
    });

    it("should track the page without the position's address, amounts or validator", () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]));

      openPosition({ rewards: "1000000000" });

      expect(trackPage).toHaveBeenCalledWith({
        category: "Stake position",
        name: "Details",
        props: { flow: "stake", currency: "SOL", source: "earn", position_status: "active" },
      });
      expect(
        JSON.stringify([jest.mocked(trackPage).mock.calls, jest.mocked(track).mock.calls]),
      ).not.toMatch(new RegExp(`${STAKE_ACCOUNT}|${FIGMENT_VOTE}|1000000000`));
      player.unmount();
    });

    it.each(["header-close", "backdrop"] as const)(
      "should answer null when the user closes the sheet from the %s",
      async control => {
        const { openPosition, player, user } = renderEarn(solanaAccountWith([activePosition()]));
        const answer = openPosition();

        await pressSheetControl(user, control);

        await expect(answer).resolves.toEqual({ action: null });
        expect(isSheetOpen()).toBe(false);
        player.unmount();
      },
    );

    it("should answer null when the user presses the Android back on the details", async () => {
      const backPressHandlers = spyOnBackPressHandlers();
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]));
      const answer = openPosition();

      act(() => {
        backPressHandlers.at(-1)?.();
      });

      await expect(answer).resolves.toEqual({ action: null });
      player.unmount();
    });

    it("should answer earnMore and open the deposit flow of the account", async () => {
      const account = solanaAccountWith([activePosition()]);
      const { openPosition, player, user } = renderEarn(account);
      const answer = openPosition();

      await user.press(screen.getByRole("button", { name: "Earn more" }));

      await expect(answer).resolves.toEqual({ action: "earnMore" });
      expect(mockOpenStakingDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id }),
        undefined,
        "solana",
      );
      expect(isSheetOpen()).toBe(false);
      player.unmount();
    });
  });

  describe("confirmation", () => {
    it("should confirm the deactivation in the same sheet and go back to the details", async () => {
      const { openPosition, player, user } = renderEarn(solanaAccountWith([activePosition()]));
      openPosition();

      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      expect(screen.getByRole("header", { name: "Deactivate this position?" })).toBeVisible();
      expect(await screen.findByRole("button", { name: "Deactivate" })).toBeEnabled();
      expect(isSheetOpen()).toBe(true);

      await pressSheetControl(user, "back");

      expect(screen.getByRole("header", { name: "SOL position" })).toBeVisible();
      player.unmount();
    });

    it("should build the deactivation from the account's own position", async () => {
      const account = solanaAccountWith([activePosition()]);
      const { openPosition, player, user } = renderEarn(account);
      openPosition();

      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      await waitFor(() =>
        expect(mockBridge.prepareTransaction).toHaveBeenLastCalledWith(
          expect.objectContaining({ id: account.id }),
          expect.objectContaining({ mode: "undelegate", recipient: STAKE_ACCOUNT, amount: SOL(2) }),
        ),
      );
      player.unmount();
    });

    it("should withdraw the full withdrawable amount the account holds", async () => {
      const { openPosition, player, user } = renderEarn(
        solanaAccountWith([], [inactivePosition()]),
      );
      openPosition();

      await user.press(screen.getByRole("button", { name: "Withdraw all" }));

      expect(screen.getByRole("header", { name: "Withdraw all your SOL?" })).toBeVisible();
      await waitFor(() =>
        expect(mockBridge.prepareTransaction).toHaveBeenLastCalledWith(
          expect.anything(),
          expect.objectContaining({ mode: "unstake", recipient: STAKE_ACCOUNT, amount: SOL(1.5) }),
        ),
      );
      expect(screen.getByText("1.5\u00a0SOL")).toBeVisible();
      player.unmount();
    });

    it("should keep the confirmation disabled and show the error the bridge finds", async () => {
      mockBridge.getTransactionStatus.mockImplementation(() =>
        Promise.resolve({ ...okStatus(), errors: { fee: new NotEnoughBalance() } }),
      );
      const { openPosition, player, user } = renderEarn(solanaAccountWith([activePosition()]));
      openPosition();

      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      expect(await screen.findByText("Sorry, insufficient funds")).toBeVisible();
      expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
      player.unmount();
    });

    it("should keep the confirmation disabled while the bridge prepares the transaction", async () => {
      mockBridge.getTransactionStatus.mockImplementation(() => new Promise(() => undefined));
      const { openPosition, player, user } = renderEarn(solanaAccountWith([activePosition()]));
      openPosition();

      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
      player.unmount();
    });

    it("should hand the transaction off to the device screens without answering the live app", async () => {
      const account = solanaAccountWith([activePosition()]);
      const { openPosition, player, user } = renderEarn(account);
      const answer = openPosition();
      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      await user.press(await screen.findByRole("button", { name: "Deactivate" }));

      expect(mockFlowParams).toHaveBeenCalledWith({
        screen: ScreenName.SolanaStakePositionSelectDevice,
        params: expect.objectContaining({
          accountId: account.id,
          action: "deactivate",
          analyticsPropertyFlow: "stake",
          transaction: expect.objectContaining({ mode: "undelegate", recipient: STAKE_ACCOUNT }),
          status: expect.objectContaining({ errors: {} }),
        }),
      });
      const { requestId } = mockFlowParams.mock.lastCall[0].params;
      expect(await isPending(answer)).toBe(true);
      // Committed, the request ignores a dismissal: only the device flow answers it now.
      dismissStakePosition(requestId);
      expect(await isPending(answer)).toBe(true);
      player.unmount();
    });

    it("should not reopen the sheet when the device flow is left", async () => {
      const { openPosition, player, user } = renderEarn(solanaAccountWith([activePosition()]));
      const answer = openPosition();
      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));
      await user.press(await screen.findByRole("button", { name: "Deactivate" }));
      const { requestId } = mockFlowParams.mock.lastCall[0].params;

      await user.press(screen.getByTestId("leave-device-flow"));
      act(() => abandonStakePosition(requestId));

      await expect(answer).resolves.toEqual({ action: null });
      expect(isSheetOpen()).toBe(false);
      player.unmount();
    });
  });

  describe("account sync", () => {
    it("should sync data older than a minute once, and hold the exit until it is synced", async () => {
      const account = solanaAccountWith([activePosition()], [], syncedSecondsAgo(120));
      const { openPosition, player, dispatch } = renderEarn(account);

      openPosition();

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(mockSync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        accountId: account.id,
        priority: 10,
        reason: "stake-position-open",
      });
      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();

      setSyncState({ [account.id]: { pending: true, error: null } });
      await dispatch(updateAccount({ id: account.id, lastSyncDate: new Date() }));
      setSyncState({ [account.id]: { pending: false, error: null } });

      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeEnabled();
      expect(mockSync).toHaveBeenCalledTimes(1);
      player.unmount();
    });

    it("should not sync again for a request handed off to the device screens", async () => {
      const account = solanaAccountWith([activePosition()], [], syncedSecondsAgo(120));
      const { openPosition, player, user } = renderEarn(account);
      openPosition();
      act(() => jest.advanceTimersByTime(STAKE_POSITION_SYNC_WAIT_MS));
      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));
      await user.press(await screen.findByRole("button", { name: "Deactivate" }));

      await user.press(screen.getByTestId("leave-device-flow"));

      expect(mockSync).toHaveBeenCalledTimes(1);
      player.unmount();
    });

    it("should not sync data synced less than a minute ago", () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]));

      openPosition();

      expect(mockSync).not.toHaveBeenCalled();
      player.unmount();
    });

    it("should release the exit when the sync fails", () => {
      const account = solanaAccountWith([activePosition()], [], syncedSecondsAgo(120));
      const { openPosition, player } = renderEarn(account);
      openPosition();

      setSyncState({ [account.id]: { pending: false, error: new Error("offline") } });

      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeEnabled();
      player.unmount();
    });

    it("should stop waiting for a sync the bridge never runs", () => {
      const account = solanaAccountWith([activePosition()], [], syncedSecondsAgo(120));
      const { openPosition, player } = renderEarn(account);
      openPosition();

      act(() => jest.advanceTimersByTime(STAKE_POSITION_SYNC_WAIT_MS));

      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeEnabled();
      player.unmount();
    });

    it("should show the position as loading until the sync, then as not found", async () => {
      const account = solanaAccountWith([], [], syncedSecondsAgo(120));
      const { openPosition, player, dispatch, user } = renderEarn(account);
      const answer = openPosition();

      expect(screen.getByText("Loading your position...")).toBeVisible();

      await dispatch(updateAccount({ id: account.id, lastSyncDate: new Date() }));

      expect(screen.getByText("Position not found")).toBeVisible();
      expect(trackPage).toHaveBeenCalledWith(expect.objectContaining({ name: "Not found" }));
      await user.press(screen.getByRole("button", { name: "Close" }));
      await expect(answer).resolves.toEqual({ action: null });
      player.unmount();
    });

    it("should answer ambiguous when several positions of the account share the validator", async () => {
      const { openPosition, player } = renderEarn(
        solanaAccountWith([activePosition(), activePosition({ positionId: OTHER_STAKE_ACCOUNT })]),
      );

      const answer = openPosition();

      await expect(answer).resolves.toEqual({ action: null, reason: "ambiguous" });
      expect(isSheetOpen()).toBe(false);
      player.unmount();
    });

    it("should wait for the sync before telling the position is ambiguous", async () => {
      const account = solanaAccountWith([activePosition()], [], syncedSecondsAgo(120));
      const { openPosition, player, dispatch } = renderEarn(account);
      const answer = openPosition();
      expect(await isPending(answer)).toBe(true);

      await dispatch(
        updateAccountWithUpdater({
          accountId: account.id,
          updater: current => ({
            ...(current as SolanaAccount),
            lastSyncDate: new Date(),
            stakingResources: stakingResourcesOf([
              activePosition(),
              activePosition({ positionId: OTHER_STAKE_ACCOUNT }),
            ]),
          }),
        }),
      );

      await expect(answer).resolves.toEqual({ action: null, reason: "ambiguous" });
      player.unmount();
    });

    it("should tell the position is not found when its validator differs from the live app's", () => {
      const { openPosition, player } = renderEarn(solanaAccountWith([activePosition()]));

      openPosition({ validatorAddress: UNLISTED_VOTE });

      expect(screen.getByText("Position not found")).toBeVisible();
      player.unmount();
    });
  });

  describe("account updates before the hand-off", () => {
    it("should follow a position update on the details", async () => {
      const { openPosition, player, updatePositions } = renderEarn(
        solanaAccountWith([activePosition()]),
      );
      openPosition();

      await updatePositions([activePosition({ amount: SOL(3) })]);

      expect(screen.getByText("3\u00a0SOL")).toBeVisible();
      player.unmount();
    });

    it("should rebuild the confirmed transaction from a position update", async () => {
      const { openPosition, player, updatePositions, user } = renderEarn(
        solanaAccountWith([activePosition()]),
      );
      openPosition();
      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled());

      await updatePositions([activePosition({ amount: SOL(3) })]);

      await waitFor(() =>
        expect(mockBridge.prepareTransaction).toHaveBeenLastCalledWith(
          expect.anything(),
          expect.objectContaining({ mode: "undelegate", amount: SOL(3) }),
        ),
      );
      expect(screen.getByText("3\u00a0SOL")).toBeVisible();
      player.unmount();
    });

    it.each(["details", "confirmation"] as const)(
      "should tell the position is gone when the account is removed on the %s",
      async step => {
        const account = solanaAccountWith([activePosition()]);
        const { openPosition, player, dispatch, user } = renderEarn(account);
        const answer = openPosition();
        if (step === "confirmation") {
          await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));
        }

        await dispatch(deleteAccount(account));

        expect(screen.getByText("Position not found")).toBeVisible();
        expect(isSheetOpen()).toBe(true);
        await user.press(screen.getByRole("button", { name: "Close" }));
        await expect(answer).resolves.toEqual({ action: null });
        player.unmount();
      },
    );

    it("should go back to the details when the position stops offering the confirmed exit", async () => {
      const { openPosition, player, updatePositions, user } = renderEarn(
        solanaAccountWith([activePosition()]),
      );
      openPosition();
      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      await updatePositions([], [inactivePosition({ status: "deactivating" })]);

      expect(screen.getByRole("header", { name: "SOL position" })).toBeVisible();
      expect(
        screen.getByText(
          "Deactivation in progress. You can withdraw your SOL once it is complete.",
        ),
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Deactivate" })).toBeNull();
      player.unmount();
    });

    it("should tell the position is gone when the position leaves the account on the confirmation", async () => {
      const { openPosition, player, updatePositions, user } = renderEarn(
        solanaAccountWith([activePosition()]),
      );
      openPosition();
      await user.press(screen.getByRole("button", { name: "Deactivate to withdraw" }));

      await updatePositions([]);

      expect(screen.getByText("Position not found")).toBeVisible();
      expect(screen.queryByRole("button", { name: "Deactivate" })).toBeNull();
      player.unmount();
    });
  });
});

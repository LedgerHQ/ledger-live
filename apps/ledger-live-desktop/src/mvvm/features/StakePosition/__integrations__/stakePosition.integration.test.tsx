import React, { Suspense } from "react";
import BigNumber from "bignumber.js";
import { Route, Routes } from "react-router";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  within,
  withFlagOverrides,
} from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CounterValuesStateRaw } from "@domain/entity-market-countervalues";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  BridgeSyncContext,
  BridgeSyncStateContext,
} from "@ledgerhq/live-common/bridge/react/index";
import type { BridgeSyncState, SyncState } from "@ledgerhq/live-common/bridge/react/types";
import type { SolanaAccount, Transaction } from "@ledgerhq/live-common/families/solana/types";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
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
import {
  abandonStakePosition,
  useShownStakePosition,
  useStakePositionOpener,
  type StakePositionOpenResult,
} from "@features/flow-stake-position";
import { track, trackPage } from "@shared/analytics";
import { setOverride } from "@shared/feature-flags";
import { selectIsBuyDeviceOpen } from "LLD/features/BuyDevice/buyDeviceDialog";
import { removeAccount, updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { importLLDCoinFamily } from "~/renderer/families";
import logger from "~/renderer/logger";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import StakePositionDialogRoot from "../StakePositionDialogRoot";
import { useStakePositionHandlers } from "../hooks/useStakePositionHandlers";
import { selectIsStakePositionDialogOpen } from "../stakePositionDialog";

type MockExecutorProps = Readonly<{
  intent: Readonly<{
    input: Readonly<{ account: AccountLike; transaction: Transaction }>;
    onResult?: (signedOperation: SignedOperation) => void;
  }>;
  onIntentJobStateChanged?: (jobState: SignTransactionIntentWithResultJobState) => void;
  onIntentJobComplete?: () => void;
  onUserCancel: () => void;
}>;

const mockSignedTransactions: Transaction[] = [];
let mockDeviceError: Error = new Error("The device disconnected");

const mockSignedOperation = (account: AccountLike): SignedOperation => ({
  signature: "stake-position-signature",
  operation: {
    id: `${account.id}-stake-position-op`,
    hash: "",
    type: "OUT",
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

// The device intent executor drives a real device: it is replaced by its outcomes, and by the
// Manager link a device step offers when an app is missing or outdated.
jest.mock("LLD/components/DeviceIntentExecutor", () => {
  const { useNavigate } = jest.requireActual<typeof import("react-router")>("react-router");
  return {
    buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appRequest: {} })),
    DeviceIntentExecutor: function MockDeviceIntentExecutor({
      intent,
      onIntentJobStateChanged,
      onIntentJobComplete,
      onUserCancel,
    }: MockExecutorProps) {
      const navigate = useNavigate();
      mockSignedTransactions.push(intent.input.transaction);
      return (
        <div data-testid="device-intent-executor">
          <button
            type="button"
            onClick={() => {
              intent.onResult?.(mockSignedOperation(intent.input.account));
              onIntentJobComplete?.();
            }}
          >
            Sign on device
          </button>
          <button
            type="button"
            onClick={() => onIntentJobStateChanged?.({ type: "cancelled", retry: mockRetry })}
          >
            Refuse on device
          </button>
          <button
            type="button"
            onClick={() =>
              onIntentJobStateChanged?.({ type: "error", error: mockDeviceError, retry: mockRetry })
            }
          >
            Fail on device
          </button>
          <button type="button" onClick={onUserCancel}>
            Leave the device step
          </button>
          <button type="button" onClick={() => navigate("/manager")}>
            Open the Manager
          </button>
        </div>
      );
    },
  };
});

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();

// The broadcast reaches the network: it answers the optimistic operation of the signature.
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

// Loads the real family, unless a test holds its import back to unmount the player meanwhile.
jest.mock("~/renderer/families", () => {
  const families = jest.requireActual<typeof import("~/renderer/families")>("~/renderer/families");
  return { ...families, importLLDCoinFamily: jest.fn(families.importLLDCoinFamily) };
});

const solana = getCryptoCurrencyById("solana");
const VALIDATOR = "FakeVote1111111111111111111111111111111111";
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";
const SOL = 1_000_000_000;
const STAKES_URL = "https://earn.api.live.ledger.com/v3/stakes";
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";
const FIGMENT_LOGO = "https://validators.example/figment.png";

const SOL_AT_150_USD = {
  status: {
    "USD solana": { oldestDateRequested: "2020-04-22T11:51:36.000Z", timestamp: 1749558512861 },
  },
  "USD solana": { latest: 150 },
} as unknown as CounterValuesStateRaw;

type StakesRequestItem = Readonly<{ network: string; address: string; fresh?: boolean }>;

const endpoints = {
  stakes: jest.fn<Response | Promise<Response>, [{ request: Request }]>(),
  summary: jest.fn<Response, [{ request: Request }]>(),
};
const stakesRequests: StakesRequestItem[][] = [];

type StakeRowOptions = Readonly<{
  status?: string;
  stakedBalance?: number;
  rewards?: number;
  deposited?: number;
  protocolName?: string;
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
  }: StakeRowOptions = {},
) {
  return {
    type: "BatchStakeViewV1",
    id: { network: "solana", address },
    stake: {
      provider: "prv_ledger_by_figment",
      protocol_name: protocolName,
      currency: "solana",
      interest: { type: "APY", value: "0.0712", currency: "solana" },
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
        net_apy: 0.0712,
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

// Each test signs from its own wallet: the user's own transaction on a position changes how the
// next opens of that position read the backend.
let accountSeed = 0;

function solanaAccount({
  delegations = [activePosition()],
  unbondings = [],
  balance = 5 * SOL,
  lastSyncDate = new Date(),
}: {
  delegations?: StakingDelegation[];
  unbondings?: StakingUnbonding[];
  balance?: number;
  lastSyncDate?: Date;
} = {}): SolanaAccount {
  accountSeed += 1;
  return {
    ...genAccount(`stake-position-solana-${accountSeed}`, { currency: solana, operationsSize: 0 }),
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
    lastSyncDate,
    stakingResources: {
      delegations,
      redelegations: [],
      unbondings,
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  };
}

const sync = jest.fn();

function Harness({ syncState }: Readonly<{ syncState: BridgeSyncState }>) {
  return (
    <BridgeSyncContext.Provider value={sync}>
      <BridgeSyncStateContext.Provider value={syncState}>
        <Routes>
          <Route path="/earn" element={<p>Earn dashboard</p>} />
          <Route path="/manager" element={<p>Manager</p>} />
        </Routes>
        <Suspense fallback={null}>
          <StakePositionDialogRoot />
        </Suspense>
      </BridgeSyncStateContext.Provider>
    </BridgeSyncContext.Provider>
  );
}

type OpenHandler = (request: { params: unknown }) => Promise<StakePositionOpenResult>;

type SetupOptions = {
  account?: SolanaAccount;
  liveAppAccounts?: AccountLike[];
  settings?: typeof AFTER_ONBOARDING_STATE;
  hasSolRate?: boolean;
  syncState?: BridgeSyncState;
  isNativeStakePositionEnabled?: boolean;
};

function setup({
  account = solanaAccount(),
  liveAppAccounts = [account],
  settings = AFTER_ONBOARDING_STATE,
  hasSolRate = true,
  syncState = {},
  isNativeStakePositionEnabled = true,
}: SetupOptions = {}) {
  liveAppAccounts.forEach(({ id }) => setWalletApiIdForAccountId(id));
  const view = render(<Harness syncState={syncState} />, {
    initialRoute: "/earn",
    initialCountervalues: hasSolRate ? SOL_AT_150_USD : undefined,
    initialState: {
      ...withFlagOverrides({
        stakePrograms: { enabled: true, params: { list: ["solana"], redirects: {} } },
        earnNativeStakePosition: { enabled: isNativeStakePositionEnabled },
      }),
      settings,
      accounts: [account],
    },
  });
  const liveApp = renderHook(() => useStakePositionHandlers(liveAppAccounts), {
    store: view.store,
  });
  const accountScreen = renderHook(() => useStakePositionOpener("account"), {
    store: view.store,
  });
  const handlers = () => liveApp.result.current;

  const open = (params: Record<string, unknown> = {}) => {
    const handler = handlers()["custom.stake.position.open"] as unknown as OpenHandler;
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

  const openFromAccount = () =>
    act(() => {
      accountScreen.result.current({ accountId: account.id, positionId: STAKE_ACCOUNT });
    });

  const updateAccount = (update: (current: Account) => Account) =>
    act(() => {
      view.store.dispatch(updateAccountWithUpdater(account.id, update));
    });

  return {
    ...view,
    account,
    handlers,
    open,
    openFromAccount,
    updateAccount,
    setSyncState: (state: BridgeSyncState) => view.rerender(<Harness syncState={state} />),
    closeLiveApp: liveApp.unmount,
  };
}

/** An outdated account without the position yet, synced on open, after a sync that failed. */
function setupWithEarlierSyncError() {
  const account = solanaAccount({
    lastSyncDate: new Date(Date.now() - 2 * 60_000),
    delegations: [],
  });
  const syncStateOf = (state: SyncState): BridgeSyncState => ({ [account.id]: state });
  const view = setup({
    account,
    syncState: syncStateOf({ pending: false, error: new Error("The previous sync failed") }),
  });

  return {
    ...view,
    setAccountSyncState: (state: SyncState) => view.setSyncState(syncStateOf(state)),
  };
}

const findDialog = (name = "Earning Solana") => screen.findByRole("dialog", { name });
const findDetails = async () => {
  const dialog = await findDialog();
  await within(dialog).findByTestId("stake-position-details");
  return dialog;
};
const dialogIsClosed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
const isPending = (answer: Promise<unknown>) =>
  Promise.race([answer.then(() => false), new Promise(resolve => setTimeout(resolve, 50, true))]);
const lastStakesRequest = () => stakesRequests.at(-1);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// The details name the exit like the confirmation names its button, so the confirmation is found
// through its title: the details button is gone by then.
const CONFIRMATIONS = {
  Deactivate: { title: "Deactivate your SOL", cta: "Deactivate" },
  Withdraw: { title: "Withdraw SOL", cta: "Withdraw all" },
} as const;

async function goToConfirmation(
  user: ReturnType<typeof setup>["user"],
  exit: keyof typeof CONFIRMATIONS,
) {
  await user.click(await screen.findByRole("button", { name: exit }));
  const { title, cta } = CONFIRMATIONS[exit];
  const confirmation = within(await findDialog(title)).getByRole("button", { name: cta });
  await waitFor(() => expect(confirmation).toBeEnabled());
  return confirmation;
}

async function signOnDevice(user: ReturnType<typeof setup>["user"]) {
  await user.click(await goToConfirmation(user, "Deactivate"));
  await user.click(await screen.findByRole("button", { name: "Sign on device" }));
}

async function userClose(dialog: HTMLElement) {
  const closeButtons = within(dialog).getAllByRole("button", { name: "Close" });
  act(() => closeButtons[closeButtons.length - 1].click());
  await dialogIsClosed();
}

describe("Stake position dialog", () => {
  beforeAll(async () => {
    const account = solanaAccount();
    await Promise.all([importLLDCoinFamily(solana.family), getAccountBridge(account)]);
  });

  beforeEach(() => {
    mockSignedTransactions.length = 0;
    stakesRequests.length = 0;
    mockDeviceError = new Error("The device disconnected");
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
    endpoints.summary
      .mockReset()
      .mockImplementation(() =>
        HttpResponse.json([
          { address: VALIDATOR, delegator_apy: 0.078107, name: "Ledger by Figment" },
        ]),
      );
    server.use(
      http.post(STAKES_URL, endpoints.stakes),
      http.get(VALIDATORS_SUMMARY_URL, endpoints.summary),
    );
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const { request } = result.current;
    if (request) act(() => abandonStakePosition(request.id));
    unmount();
  });

  describe("the earnNativeStakePosition flag", () => {
    it("should register the handler when it is on", () => {
      const { handlers } = setup({ isNativeStakePositionEnabled: true });

      expect(handlers()["custom.stake.position.open"]).toEqual(expect.any(Function));
    });

    it("should neither register the handler nor open a dialog when it is off", () => {
      const { handlers, store } = setup({ isNativeStakePositionEnabled: false });

      expect(Object.keys(handlers())).not.toContain("custom.stake.position.open");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(selectIsStakePositionDialogOpen(store.getState())).toBe(false);
      expect(endpoints.stakes).not.toHaveBeenCalled();
    });

    it("should register the handler as soon as it turns on, and drop it as soon as it turns off", () => {
      const { handlers, store } = setup({ isNativeStakePositionEnabled: false });

      act(() => {
        store.dispatch(setOverride({ key: "earnNativeStakePosition", value: { enabled: true } }));
      });
      expect(handlers()["custom.stake.position.open"]).toEqual(expect.any(Function));

      act(() => {
        store.dispatch(setOverride({ key: "earnNativeStakePosition", value: { enabled: false } }));
      });
      expect(Object.keys(handlers())).not.toContain("custom.stake.position.open");
    });
  });

  describe("when Earn asks for a position", () => {
    it("should refuse a Wallet API account id that matches no account, without a dialog", async () => {
      const { open } = setup();

      await expect(open({ accountId: "unknown-wallet-api-id" })).rejects.toMatchObject({
        name: "StakePositionAccountNotFound",
      });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should refuse a token account", async () => {
      const account = solanaAccount();
      const ethereumAccount = genAccount("stake-position-ethereum", {
        currency: getCryptoCurrencyById("ethereum"),
      });
      const usdcAccount = genTokenAccount(0, ethereumAccount, usdcToken);
      const { open } = setup({ account, liveAppAccounts: [account, ethereumAccount, usdcAccount] });

      await expect(
        open({ accountId: getWalletApiIdFromAccountId(usdcAccount.id) }),
      ).rejects.toMatchObject({ name: "StakePositionUnsupported" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should refuse an account whose family cannot show a position", async () => {
      const account = solanaAccount();
      const bitcoinAccount = genAccount("stake-position-bitcoin", {
        currency: getCryptoCurrencyById("bitcoin"),
      });
      const { open } = setup({ account, liveAppAccounts: [account, bitcoinAccount] });

      await expect(
        open({ accountId: getWalletApiIdFromAccountId(bitcoinAccount.id) }),
      ).rejects.toMatchObject({ name: "StakePositionUnsupported" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should show the figures the Earn backend reports for the wallet address", async () => {
      const { account, open } = setup();

      void open();

      const dialog = await findDetails();
      expect(stakesRequests[0]).toEqual([{ network: "solana", address: account.freshAddress }]);
      expect(within(dialog).getByText("Total rewards")).toBeVisible();
      // The headline amount names itself with a space after the currency symbol.
      expect(within(dialog).getByRole("img", { name: "$ 150.00" })).toBeVisible();
      expect(within(dialog).getByText("1 SOL")).toBeVisible();
      expect(within(dialog).getByText("10 SOL")).toBeVisible();
      expect(within(dialog).getByText("9.75 SOL")).toBeVisible();
      expect(within(dialog).getByText("Active")).toBeVisible();
      expect(within(dialog).getByText("Ledger by Figment")).toBeVisible();
      expect(await within(dialog).findByText("7.81% APY")).toBeVisible();
      expect(within(dialog).getByText(`Solana ${account.index + 1}`)).toBeVisible();
      expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
    });

    it("should open the position by its identity only, whatever else Earn still sends", async () => {
      const { open } = setup();

      void open({ rewards: String(999 * SOL), validatorAddress: "AnotherVote1111111111111111" });

      const dialog = await findDetails();
      expect(within(dialog).getByText("1 SOL")).toBeVisible();
      expect(within(dialog).queryByText("999 SOL")).not.toBeInTheDocument();
    });

    it("should register the dialog as open in the dialogs slice while it is shown", async () => {
      const { open, store, user } = setup();

      const answer = open();
      await findDetails();
      expect(selectIsStakePositionDialogOpen(store.getState())).toBe(true);

      await user.click(screen.getByRole("button", { name: "Close" }));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
      expect(selectIsStakePositionDialogOpen(store.getState())).toBe(false);
    });

    it("should answer null when the player of the live app unmounts", async () => {
      const { open, closeLiveApp } = setup();

      const answer = open();
      await findDialog();
      closeLiveApp();

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
    });

    it("should answer null, and open no dialog, when the player unmounts while the family loads", async () => {
      const family = await importLLDCoinFamily(solana.family);
      const familyImport = createDeferred<typeof family>();
      jest.mocked(importLLDCoinFamily).mockReturnValueOnce(familyImport.promise);
      const { open, closeLiveApp } = setup();
      const shown = renderHook(() => useShownStakePosition());

      const answer = open();
      closeLiveApp();
      await act(async () => familyImport.resolve(family));

      expect(shown.result.current.request).toBeNull();
      await expect(answer).resolves.toEqual({ action: null });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should answer null, and leave no dialog open, when the account leaves the wallet while the family loads", async () => {
      const family = await importLLDCoinFamily(solana.family);
      const familyImport = createDeferred<typeof family>();
      jest.mocked(importLLDCoinFamily).mockReturnValueOnce(familyImport.promise);
      const account = solanaAccount();
      const { open, store } = setup({ account });

      const answer = open();
      act(() => {
        store.dispatch(removeAccount(account));
      });
      await act(async () => familyImport.resolve(family));

      expect(await isPending(answer)).toBe(false);
      await expect(answer).resolves.toEqual({ action: null });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(selectIsStakePositionDialogOpen(store.getState())).toBe(false);
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

      await expect(answer).resolves.toEqual({ action: null, reason: "unavailable" });
      await dialogIsClosed();
      expect(trackPage).not.toHaveBeenCalled();
    });
  });

  describe("when an account screen asks for a position", () => {
    it("should show the figures of the Earn backend", async () => {
      const { openFromAccount } = setup();

      openFromAccount();

      const dialog = await findDetails();
      expect(within(dialog).getByText("10 SOL")).toBeVisible();
      expect(jest.mocked(trackPage)).toHaveBeenCalledWith(
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

      const dialog = await findDialog();
      expect(await within(dialog).findByText("We couldn't load this position")).toBeVisible();
      endpoints.stakes.mockImplementation(({ request }) =>
        request.json().then((body: StakesRequestItem[]) =>
          HttpResponse.json({
            data: body.flatMap(({ address }) => stakeRows(address)),
            meta: { is_stale: false },
          }),
        ),
      );
      await user.click(within(dialog).getByRole("button", { name: "Try again" }));

      expect(await within(dialog).findByText("10 SOL")).toBeVisible();
    });

    it("should say the position is not available when the backend has no row for it", async () => {
      serveStakes(() => []);
      const { openFromAccount } = setup();

      openFromAccount();

      const dialog = await findDialog();
      expect(await within(dialog).findByText("Position not available")).toBeVisible();
      expect(within(dialog).queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
      await userClose(dialog);
    });

    it("should say the position is not available when the synced account no longer holds it", async () => {
      const account = solanaAccount({ delegations: [] });
      const { openFromAccount } = setup({ account });

      openFromAccount();

      const dialog = await findDialog();
      expect(await within(dialog).findByText("Position not available")).toBeVisible();
    });
  });

  describe("details", () => {
    it("should offer Withdraw, and no Earn more, on a deactivated position", async () => {
      serveStakes(address => [
        stakeRow(address, { status: "deactivated", stakedBalance: 1.5 * SOL }),
      ]);
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open } = setup({ account });

      void open();

      const dialog = await findDetails();
      expect(within(dialog).getByText("Deactivated")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Earn more" })).not.toBeInTheDocument();
    });

    it("should hide the APY row while the validator APY is unknown, never showing the position APY", async () => {
      endpoints.summary.mockImplementation(() => HttpResponse.json([]));
      const { open } = setup();

      void open();

      const dialog = await findDetails();
      expect(within(dialog).queryByText("Current APY")).not.toBeInTheDocument();
      expect(within(dialog).queryByText(/APY$/)).not.toBeInTheDocument();
    });

    it("should name a validator the backend does not name by its shortened vote account", async () => {
      serveStakes(address => [stakeRow(address, { protocolName: "" })]);
      const { open } = setup();

      void open();

      const dialog = await findDetails();
      expect(within(dialog).getByText("FakeVo…111111")).toBeVisible();
    });

    it("should lead with the rewards in SOL when SOL has no rate", async () => {
      const { open } = setup({ hasSolRate: false });

      void open();

      const dialog = await findDetails();
      expect(within(dialog).getByText("Total rewards")).toBeVisible();
      expect(within(dialog).getByText("1 SOL")).toBeVisible();
      expect(within(dialog).queryByRole("img", { name: "$ 150.00" })).not.toBeInTheDocument();
    });

    it("should mask the amounts in discreet mode", async () => {
      const { open } = setup({ settings: { ...AFTER_ONBOARDING_STATE, discreetMode: true } });

      void open();

      const dialog = await findDetails();
      expect(within(dialog).getAllByText("*** SOL")).toHaveLength(3);
      expect(within(dialog).queryByText("10 SOL")).not.toBeInTheDocument();
      expect(within(dialog).queryByRole("img", { name: "$ 150.00" })).not.toBeInTheDocument();
    });

    it("should say the position is updating while the backend and the chain disagree", async () => {
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open } = setup({ account });

      void open();

      const dialog = await findDetails();
      expect(within(dialog).getByText("Active")).toBeVisible();
      expect(
        within(dialog).getByText("This position is updating. Some details may be out of date."),
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
    });

    it("should answer null when the user closes the details", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await user.keyboard("{Escape}");

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
    });
  });

  describe("one source per figure", () => {
    it("should show the backend balance in the details and the chain amount on the confirmation", async () => {
      const { open, user } = setup();

      void open();

      const dialog = await findDetails();
      expect(within(dialog).getByText("10 SOL")).toBeVisible();
      expect(within(dialog).queryByText("12 SOL")).not.toBeInTheDocument();
      await goToConfirmation(user, "Deactivate");
      expect(
        screen.getByText(
          "Your 12 SOL in Ledger by Figment will be deactivated. Once deactivated, you will be able to withdraw your funds. It may take a few days to complete deactivation.",
        ),
      ).toBeVisible();
    });
  });

  describe("sync on open", () => {
    it("should sync an outdated account once, when the dialog opens", async () => {
      const account = solanaAccount({ lastSyncDate: new Date(Date.now() - 2 * 60_000) });
      const { open } = setup({ account });

      void open();
      await findDialog();

      expect(sync).toHaveBeenCalledTimes(1);
      expect(sync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        accountId: account.id,
        priority: 10,
        reason: "stake-position-open",
      });
    });

    it("should not sync an account synced moments ago", async () => {
      const account = solanaAccount({ lastSyncDate: new Date(Date.now() - 10_000) });
      const { open } = setup({ account });

      void open();
      await findDialog();

      expect(sync).not.toHaveBeenCalled();
    });

    it("should disable the exit, but not Earn more, while the account syncs", async () => {
      const account = solanaAccount();
      const { open } = setup({
        account,
        syncState: { [account.id]: { pending: true, error: null } },
      });

      void open();
      await findDetails();

      expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
    });

    it("should wait for the sync before letting Earn fall back for a position the chain does not hold", async () => {
      const account = solanaAccount({ delegations: [] });
      const { open, setSyncState } = setup({
        account,
        syncState: { [account.id]: { pending: true, error: null } },
      });

      const answer = open();
      const dialog = await findDialog();
      expect(await within(dialog).findByText("Loading your position...")).toBeVisible();
      expect(await isPending(answer)).toBe(true);

      setSyncState({ [account.id]: { pending: false, error: null } });

      await expect(answer).resolves.toEqual({ action: null, reason: "unavailable" });
      await dialogIsClosed();
    });

    describe("when an earlier sync left an error on the account", () => {
      it("should keep waiting for the sync that has not started, then show the refreshed position", async () => {
        const { open, updateAccount, setAccountSyncState } = setupWithEarlierSyncError();

        const answer = open();
        const dialog = await findDialog();
        // The sync is queued, not started: the error still on the account is not its failure.
        expect(await within(dialog).findByText("Loading your position...")).toBeVisible();
        expect(await isPending(answer)).toBe(true);

        setAccountSyncState({ pending: true, error: null });
        updateAccount(current => ({
          ...current,
          lastSyncDate: new Date(),
          stakingResources: {
            ...(current as SolanaAccount).stakingResources,
            delegations: [activePosition()],
          },
        }));
        setAccountSyncState({ pending: false, error: null });

        expect(await within(dialog).findByTestId("stake-position-details")).toBeVisible();
        expect(await isPending(answer)).toBe(true);
      });

      it("should stop waiting when the sync of the dialog fails with a new error", async () => {
        const { open, setAccountSyncState } = setupWithEarlierSyncError();

        const answer = open();
        const dialog = await findDialog();
        expect(await within(dialog).findByText("Loading your position...")).toBeVisible();

        setAccountSyncState({ pending: true, error: null });
        expect(await isPending(answer)).toBe(true);
        setAccountSyncState({ pending: false, error: new Error("The sync failed") });

        await expect(answer).resolves.toEqual({ action: null, reason: "unavailable" });
        await dialogIsClosed();
      });

      it("should let the user close the dialog while it waits for the sync", async () => {
        const { open } = setupWithEarlierSyncError();

        const answer = open();
        const dialog = await findDialog();
        expect(await within(dialog).findByText("Loading your position...")).toBeVisible();
        await userClose(dialog);

        await expect(answer).resolves.toEqual({ action: null });
      });
    });
  });

  describe("Earn more", () => {
    it("should answer earnMore to Earn and close, leaving Earn to open its deposit flow", async () => {
      const { open, store, user } = setup();

      const answer = open();
      await findDetails();
      await user.click(screen.getByRole("button", { name: "Earn more" }));

      await expect(answer).resolves.toEqual({ action: "earnMore" });
      await dialogIsClosed();
      expect(store.getState().modals.MODAL_START_STAKE?.isOpened).not.toBe(true);
    });

    it("should open the deposit flow itself for an account screen", async () => {
      const { openFromAccount, store, user } = setup();

      openFromAccount();
      await findDetails();
      await user.click(screen.getByRole("button", { name: "Earn more" }));

      await dialogIsClosed();
      expect(store.getState().modals.MODAL_START_STAKE).toMatchObject({
        isOpened: true,
        data: { source: "stake_position" },
      });
    });
  });

  describe("exit transaction", () => {
    it("should deactivate the stake account read from the account", async () => {
      const { open, user } = setup();

      void open();
      await findDetails();
      await user.click(await goToConfirmation(user, "Deactivate"));

      await screen.findByRole("button", { name: "Sign on device" });
      expect(mockSignedTransactions.at(-1)).toMatchObject({
        mode: "undelegate",
        recipient: STAKE_ACCOUNT,
      });
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
          `Your 1.5 SOL in Ledger by Figment will be withdrawn to your Solana ${account.index + 1} account. This may take a few minutes.`,
        ),
      ).toBeVisible();
      await user.click(confirmation);

      await screen.findByRole("button", { name: "Sign on device" });
      const transaction = mockSignedTransactions.at(-1);
      expect(transaction).toMatchObject({ mode: "unstake", recipient: STAKE_ACCOUNT });
      expect(transaction?.amount).toEqual(new BigNumber(1.5 * SOL));
    });

    it("should block the confirmation while the prepared transaction has an error", async () => {
      serveStakes(address => [stakeRow(address, { status: "deactivated" })]);
      const account = solanaAccount({
        delegations: [],
        unbondings: [deactivatedPosition()],
        balance: 0.5 * SOL,
      });
      const { open, user } = setup({ account });

      void open();
      await findDetails();
      await user.click(screen.getByRole("button", { name: "Withdraw" }));

      expect(await screen.findByText("Sorry, insufficient funds")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw all" })).toBeDisabled();
    });

    it("should leave the flow from the close button of the confirmation, which has no way back", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");
      expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close" }));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
    });

    it("should leave the flow when the user leaves the device step before signing", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await user.click(await goToConfirmation(user, "Deactivate"));
      await user.click(await screen.findByRole("button", { name: "Leave the device step" }));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
      expect(mockBroadcast).not.toHaveBeenCalled();
    });

    it("should keep the dialog open, without a way to close it, while the signed transaction is broadcast", async () => {
      const broadcast = createDeferred<Operation>();
      mockBroadcast.mockReturnValueOnce(broadcast.promise);
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await signOnDevice(user);

      const dialog = await findDialog("Deactivate your SOL");
      expect(within(dialog).getByText("This can take a few minutes.")).toBeVisible();
      expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(await isPending(answer)).toBe(true);
      await expect(open()).rejects.toMatchObject({ name: "StakePositionBusy" });
    });

    it("should answer the action once broadcast, with the pending operation in the account and the backend read again", async () => {
      const { account, open, store, user } = setup();

      const answer = open();
      await findDetails();
      const readsBeforeSigning = stakesRequests.length;
      await signOnDevice(user);

      await expect(answer).resolves.toEqual({ action: "deactivate" });
      const result = await screen.findByTestId("stake-position-success");
      expect(within(result).getByText("Transaction signed")).toBeVisible();
      expect(
        within(result).getByText(
          "Deactivation can take a few days. You can withdraw your SOL once it is complete.",
        ),
      ).toBeVisible();
      expect(mockBroadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: "stake-position-signature",
          operation: expect.objectContaining({ id: `${account.id}-stake-position-op` }),
        }),
      );
      const [storedAccount] = store.getState().accounts;
      expect(storedAccount.pendingOperations.map(({ id }) => id)).toEqual([
        `${account.id}-stake-position-op`,
      ]);
      await waitFor(() => expect(stakesRequests.length).toBeGreaterThan(readsBeforeSigning));
    });

    it("should read the backend fresh the next time the position opens after the transaction", async () => {
      const { open, user } = setup();

      void open();
      await findDetails();
      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");
      await userClose(await findDialog("Transaction signed"));
      serveStakes(address => [stakeRow(address, { status: "deactivating" })]);

      void open();

      await findDetails();
      expect(lastStakesRequest()).toEqual([expect.objectContaining({ fresh: true })]);
    });

    it("should open the operation once the dialog is closed, from View transaction", async () => {
      const { account, open, user } = setup();

      void open();
      await findDetails();
      await signOnDevice(user);
      const result = await screen.findByTestId("stake-position-success");
      await user.click(within(result).getByRole("button", { name: "View transaction" }));

      await dialogIsClosed();
      expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
        operationId: `${account.id}-stake-position-op`,
        accountId: account.id,
      });
    });

    it("should close the result from its header and leave nothing shown", async () => {
      const { open, store, user } = setup();

      void open();
      await findDetails();
      await signOnDevice(user);
      await screen.findByTestId("stake-position-success");
      await user.click(screen.getByRole("button", { name: "Close" }));

      await dialogIsClosed();
      expect(selectIsStakePositionDialogOpen(store.getState())).toBe(false);
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

    it("should let the user try again after refusing on the device, without logging it", async () => {
      const critical = jest.spyOn(logger, "critical");
      const { open, user } = setup();

      void open();
      await findDetails();
      await user.click(await goToConfirmation(user, "Deactivate"));
      await user.click(await screen.findByRole("button", { name: "Refuse on device" }));
      const failure = await screen.findByTestId("stake-position-failure");
      expect(within(failure).getByText("Transaction failed")).toBeVisible();
      await user.click(within(failure).getByRole("button", { name: "Try again" }));

      const confirmation = await findDialog("Deactivate your SOL");
      expect(within(confirmation).getByRole("button", { name: "Deactivate" })).toBeVisible();
      expect(critical).not.toHaveBeenCalled();
    });

    it("should answer null when the user closes a failed transaction", async () => {
      const critical = jest.spyOn(logger, "critical").mockImplementation(() => undefined);
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await user.click(await goToConfirmation(user, "Deactivate"));
      await user.click(await screen.findByRole("button", { name: "Fail on device" }));
      await screen.findByTestId("stake-position-failure");
      await user.click(screen.getByRole("button", { name: "Close" }));

      await expect(answer).resolves.toEqual({ action: null });
      expect(critical).toHaveBeenCalledWith(mockDeviceError);
    });

    it("should warn, and let the user close or try again, when a signed transaction fails to broadcast", async () => {
      jest.spyOn(logger, "critical").mockImplementation(() => undefined);
      mockBroadcast.mockRejectedValueOnce(new Error("The network refused the transaction"));
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await signOnDevice(user);
      const failure = await screen.findByTestId("stake-position-failure");
      expect(
        within(failure).getByText(
          "Your transaction may have failed. Please wait a moment then check the transaction history before trying again.",
        ),
      ).toBeVisible();
      expect(await screen.findByRole("button", { name: "Close" })).toBeVisible();
      await user.click(within(failure).getByRole("button", { name: "Try again" }));
      await findDialog("Deactivate your SOL");
      await user.keyboard("{Escape}");

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
    });

    it("should send no transaction event from the dialog", async () => {
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
  });

  describe("when the account changes before the signature", () => {
    it("should prepare the exit again from the updated position on the confirmation", async () => {
      serveStakes(address => [stakeRow(address, { status: "deactivated" })]);
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open, updateAccount, user } = setup({ account });

      void open();
      await findDetails();
      await goToConfirmation(user, "Withdraw");
      updateAccount(current => ({
        ...current,
        stakingResources: {
          ...(current as SolanaAccount).stakingResources,
          unbondings: [deactivatedPosition({ withdrawableAmount: new BigNumber(1.75 * SOL) })],
        },
      }));
      expect(await screen.findByText(/^Your 1\.75 SOL in /)).toBeVisible();
      const confirmation = screen.getByRole("button", { name: "Withdraw all" });
      await waitFor(() => expect(confirmation).toBeEnabled());
      await user.click(confirmation);

      await screen.findByRole("button", { name: "Sign on device" });
      expect(mockSignedTransactions.at(-1)?.amount).toEqual(new BigNumber(1.75 * SOL));
    });

    it("should prepare the exit again when only the balance of the account grows", async () => {
      serveStakes(address => [stakeRow(address, { status: "deactivated" })]);
      const account = solanaAccount({
        delegations: [],
        unbondings: [deactivatedPosition()],
        balance: 0.5 * SOL,
      });
      const { open, updateAccount, user } = setup({ account });

      void open();
      await findDetails();
      await user.click(screen.getByRole("button", { name: "Withdraw" }));
      expect(await screen.findByText("Sorry, insufficient funds")).toBeVisible();
      // Funding an account below its reserve grows its balance, not its spendable balance.
      updateAccount(current => ({ ...current, balance: new BigNumber(2 * SOL) }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Withdraw all" })).toBeEnabled(),
      );
      expect(screen.queryByText("Sorry, insufficient funds")).not.toBeInTheDocument();
    });

    it("should go back to the details when the exit is no longer possible", async () => {
      const { open, updateAccount, user } = setup();

      void open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");
      updateAccount(current => ({
        ...current,
        stakingResources: {
          ...(current as SolanaAccount).stakingResources,
          delegations: [activePosition({ canStake: false })],
        },
      }));

      expect(
        await screen.findByText(
          "You can't change this position from this account. Another wallet may control it, or a lockup may apply.",
        ),
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
    });

    it("should let Earn fall back when the position leaves the account on the details", async () => {
      const { open, updateAccount } = setup();

      const answer = open();
      await findDetails();
      updateAccount(current => ({
        ...current,
        stakingResources: { ...(current as SolanaAccount).stakingResources, delegations: [] },
      }));

      await expect(answer).resolves.toEqual({ action: null, reason: "unavailable" });
      await dialogIsClosed();
    });

    it("should say the position is not available when it leaves the account of an account screen", async () => {
      const { openFromAccount, updateAccount } = setup();

      openFromAccount();
      const dialog = await findDetails();
      updateAccount(current => ({
        ...current,
        stakingResources: { ...(current as SolanaAccount).stakingResources, delegations: [] },
      }));

      expect(await within(dialog).findByText("Position not available")).toBeVisible();
    });

    it("should say the position is not available when the account leaves the wallet", async () => {
      const account = solanaAccount();
      const { open, store, user } = setup({ account });

      const answer = open();
      await findDetails();
      await goToConfirmation(user, "Deactivate");
      act(() => {
        store.dispatch(removeAccount(account));
      });

      const dialog = await findDialog();
      expect(within(dialog).getByText("Position not available")).toBeVisible();
      await userClose(dialog);
      await expect(answer).resolves.toEqual({ action: null });
    });
  });

  describe("when the device step leaves the dialog", () => {
    it("should close the dialog before Buy Device opens, without a device ever onboarded", async () => {
      const { open, store, user } = setup({
        settings: { ...AFTER_ONBOARDING_STATE, lastSeenDevice: null },
      });

      const answer = open();
      await findDetails();
      await user.click(await goToConfirmation(user, "Deactivate"));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
      expect(selectIsBuyDeviceOpen(store.getState())).toBe(true);
      expect(mockSignedTransactions).toHaveLength(0);
    });

    it("should close the dialog when the device step opens the Manager", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDetails();
      await user.click(await goToConfirmation(user, "Deactivate"));
      await user.click(await screen.findByRole("button", { name: "Open the Manager" }));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
      expect(screen.getByText("Manager")).toBeVisible();
    });
  });
});

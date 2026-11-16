import React, { Suspense } from "react";
import { BigNumber } from "bignumber.js";
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
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  BridgeSyncContext,
  BridgeSyncStateContext,
} from "@ledgerhq/live-common/bridge/react/index";
import type { BridgeSyncState } from "@ledgerhq/live-common/bridge/react/types";
import type { SolanaAccount, Transaction } from "@ledgerhq/live-common/families/solana/types";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type {
  Account,
  AccountLike,
  Operation,
  StakingDelegation,
  StakingUnbonding,
} from "@ledgerhq/types-live";
import {
  abandonStakePosition,
  useShownStakePosition,
  type StakePositionResult,
} from "@features/flow-stake-position";
import { track, trackPage } from "@shared/analytics";
import { selectIsBuyDeviceOpen } from "LLD/features/BuyDevice/buyDeviceDialog";
import { removeAccount, updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { importLLDCoinFamily } from "~/renderer/families";
import logger from "~/renderer/logger";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import StakePositionDialogRoot from "../StakePositionDialogRoot";
import { useStakePositionHandlers } from "../hooks/useStakePositionHandlers";
import { selectIsStakePositionDialogOpen } from "../stakePositionDialog";

type DeviceStepProps = {
  account?: AccountLike | null;
  transaction?: Transaction | null;
  setSigned: (signed: boolean) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  onTransactionError: (error: Error) => void;
};

const mockDeviceStepTransactions: Array<Transaction | null | undefined> = [];
let mockDeviceError: Error = new Error("The device disconnected");

// The device step drives a real device: it is replaced by its outcomes, and by the Manager link a
// device action offers when an app is missing or outdated.
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => {
  const { useNavigate } = jest.requireActual<typeof import("react-router")>("react-router");
  return {
    __esModule: true,
    default: function MockDeviceStep({
      account,
      transaction,
      setSigned,
      onOperationBroadcasted,
      onTransactionError,
    }: DeviceStepProps) {
      const navigate = useNavigate();
      mockDeviceStepTransactions.push(transaction);
      return (
        <div>
          <button type="button" onClick={() => setSigned(true)}>
            Sign on device
          </button>
          <button
            type="button"
            onClick={() =>
              onOperationBroadcasted({
                id: `${account?.id}-stake-position-op`,
                hash: "",
                type: "OUT",
                value: new BigNumber(0),
                fee: new BigNumber(5000),
                senders: [],
                recipients: [],
                blockHash: null,
                blockHeight: null,
                accountId: account?.id ?? "",
                date: new Date(),
                extra: {},
              })
            }
          >
            Broadcast
          </button>
          <button type="button" onClick={() => onTransactionError(mockDeviceError)}>
            Fail on device
          </button>
          <button type="button" onClick={() => navigate("/manager")}>
            Open the Manager
          </button>
        </div>
      );
    },
  };
});

const solana = getCryptoCurrencyById("solana");
const VALIDATOR = "FakeVote1111111111111111111111111111111111";
const OTHER_VALIDATOR = "FakeVote2222222222222222222222222222222222";
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";
const OTHER_STAKE_ACCOUNT = "FakeStake222222222222222222222222222222222";
const SOL = 1_000_000_000;
const VALIDATORS_URL = "https://earn.api.live.ledger.com/v0/network/solana/validator-details";
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";

const endpoints = {
  validators: jest.fn<Response, [{ request: Request }]>(),
  summary: jest.fn<Response, [{ request: Request }]>(),
};

const SOL_AT_150_USD = {
  status: {
    "USD solana": { oldestDateRequested: "2020-04-22T11:51:36.000Z", timestamp: 1749558512861 },
  },
  "USD solana": { latest: 150 },
} as unknown as CounterValuesStateRaw;

const activePosition = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: STAKE_ACCOUNT,
  validatorAddress: VALIDATOR,
  amount: new BigNumber(2 * SOL),
  activeAmount: new BigNumber(2 * SOL),
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
  return {
    ...genAccount("stake-position-solana", { currency: solana, operationsSize: 0 }),
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

type OpenHandler = (request: { params: unknown }) => Promise<StakePositionResult>;

type SetupOptions = {
  account?: SolanaAccount;
  liveAppAccounts?: AccountLike[];
  settings?: typeof AFTER_ONBOARDING_STATE;
  hasSolRate?: boolean;
  syncState?: BridgeSyncState;
};

function setup({
  account = solanaAccount(),
  liveAppAccounts = [account],
  settings = AFTER_ONBOARDING_STATE,
  hasSolRate = true,
  syncState = {},
}: SetupOptions = {}) {
  liveAppAccounts.forEach(({ id }) => setWalletApiIdForAccountId(id));
  const view = render(<Harness syncState={syncState} />, {
    initialRoute: "/earn",
    initialCountervalues: hasSolRate ? SOL_AT_150_USD : undefined,
    initialState: {
      ...withFlagOverrides({
        stakePrograms: { enabled: true, params: { list: ["solana"], redirects: {} } },
      }),
      settings,
      accounts: [account],
    },
  });
  const liveApp = renderHook(() => useStakePositionHandlers(liveAppAccounts), {
    store: view.store,
  });

  const open = (params: Record<string, unknown> = {}) => {
    const handler = liveApp.result.current["custom.stake.position.open"] as unknown as OpenHandler;
    let answer: Promise<StakePositionResult> = Promise.resolve({ action: null });
    act(() => {
      answer = handler({
        params: {
          accountId: getWalletApiIdFromAccountId(account.id),
          positionId: STAKE_ACCOUNT,
          validatorAddress: VALIDATOR,
          ...params,
        },
      });
    });
    return answer;
  };

  const updateAccount = (update: (current: Account) => Account) =>
    act(() => {
      view.store.dispatch(updateAccountWithUpdater(account.id, update));
    });

  return {
    ...view,
    open,
    updateAccount,
    setSyncState: (state: BridgeSyncState) => view.rerender(<Harness syncState={state} />),
    closeLiveApp: liveApp.unmount,
  };
}

const findDialog = (name = "SOL position") => screen.findByRole("dialog", { name });
// The avatar's image is decorative: the avatar itself carries the role.
const validatorImageOf = (dialog: HTMLElement) =>
  within(dialog).getByRole("img", { name: "User avatar" }).querySelector("img");
const dialogIsClosed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
const isPending = (answer: Promise<unknown>) =>
  Promise.race([answer.then(() => false), new Promise(resolve => setTimeout(resolve, 50, true))]);

async function goToConfirmation(
  user: ReturnType<typeof setup>["user"],
  exit: "Deactivate to withdraw" | "Withdraw all",
) {
  await user.click(await screen.findByRole("button", { name: exit }));
  const cta = exit === "Withdraw all" ? "Withdraw all" : "Deactivate";
  const confirmation = await screen.findByRole("button", { name: cta });
  await waitFor(() => expect(confirmation).toBeEnabled());
  return confirmation;
}

async function signOnDevice(user: ReturnType<typeof setup>["user"]) {
  await user.click(await goToConfirmation(user, "Deactivate to withdraw"));
  await user.click(await screen.findByRole("button", { name: "Sign on device" }));
}

describe("Stake position dialog", () => {
  beforeAll(async () => {
    const account = solanaAccount();
    await Promise.all([importLLDCoinFamily(solana.family), getAccountBridge(account)]);
  });

  beforeEach(() => {
    mockDeviceStepTransactions.length = 0;
    mockDeviceError = new Error("The device disconnected");
    const { getSolanaValidators } = jest.requireActual("@ledgerhq/coin-solana/validators") as {
      getSolanaValidators: { reset: () => void };
    };
    getSolanaValidators.reset();
    endpoints.validators.mockReset().mockImplementation(() =>
      HttpResponse.json([
        {
          active_stake: 1000,
          commission: 7,
          total_score: 10,
          vote_account: VALIDATOR,
          name: "Stake position validator",
          avatar_url: "https://validators.example/avatar.png",
          delinquent: false,
        },
      ]),
    );
    endpoints.summary
      .mockReset()
      .mockImplementation(() =>
        HttpResponse.json([{ address: VALIDATOR, delegator_apy: 0.078107, name: "validator" }]),
      );
    server.use(
      http.get(VALIDATORS_URL, endpoints.validators),
      http.get(VALIDATORS_SUMMARY_URL, endpoints.summary),
    );
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const { request } = result.current;
    if (request) act(() => abandonStakePosition(request.id));
    unmount();
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

    it("should open the details of the Solana position", async () => {
      const { open } = setup();

      void open();

      const dialog = await findDialog();
      expect(within(dialog).getByText("2 SOL")).toBeVisible();
      expect(within(dialog).getByText("Active")).toBeVisible();
      expect(within(dialog).getByText("FakeSt…111111")).toBeVisible();
      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
    });

    it("should register the dialog as open in the dialogs slice while it is shown", async () => {
      const { open, store, user } = setup();

      const answer = open();
      await findDialog();
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
  });

  describe("details", () => {
    it("should show the withdrawable amount of a deactivated position as its balance", async () => {
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open } = setup({ account });

      void open();

      const dialog = await findDialog();
      expect(within(dialog).getByText("1.5 SOL")).toBeVisible();
      expect(within(dialog).getByText("Deactivated")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw all" })).toBeEnabled();
    });

    it("should name an unknown validator by its vote address, without an APY", async () => {
      endpoints.validators.mockImplementation(() => HttpResponse.json([]));
      endpoints.summary.mockImplementation(() => HttpResponse.json([]));
      const { open } = setup();

      void open();

      const dialog = await findDialog();
      expect(await within(dialog).findByText("FakeVo…111111")).toBeVisible();
      expect(within(dialog).getByText("—")).toBeVisible();
      expect(within(dialog).queryByText("Stake position validator")).not.toBeInTheDocument();
      expect(validatorImageOf(dialog)).toBeNull();
    });

    it("should show the name, the image and the APY of a known validator", async () => {
      const { open } = setup();

      void open();

      const dialog = await findDialog();
      expect(await within(dialog).findByText("Stake position validator")).toBeVisible();
      expect(await within(dialog).findByText("7.81%")).toBeVisible();
      expect(validatorImageOf(dialog)).toHaveAttribute(
        "src",
        "https://validators.example/avatar.png",
      );
    });

    it("should show the rewards in SOL and in the counter value", async () => {
      const { open } = setup();

      void open({ rewards: String(SOL) });

      const dialog = await findDialog();
      expect(within(dialog).getByText("Rewards")).toBeVisible();
      expect(within(dialog).getByText("1 SOL")).toBeVisible();
      expect(within(dialog).getByText("$150.00")).toBeVisible();
    });

    it("should show the rewards in SOL alone when SOL has no rate", async () => {
      const { open } = setup({ hasSolRate: false });

      void open({ rewards: String(SOL) });

      const dialog = await findDialog();
      expect(within(dialog).getByText("1 SOL")).toBeVisible();
      expect(within(dialog).queryByText("$150.00")).not.toBeInTheDocument();
    });

    it("should hide the rewards when Earn sends none it can show", async () => {
      const { open } = setup();

      void open({ rewards: "12.5" });

      const dialog = await findDialog();
      expect(within(dialog).queryByText("Rewards")).not.toBeInTheDocument();
    });

    it("should mask the amounts in discreet mode", async () => {
      const { open } = setup({ settings: { ...AFTER_ONBOARDING_STATE, discreetMode: true } });

      void open({ rewards: String(SOL) });

      const dialog = await findDialog();
      expect(within(dialog).getAllByText("*** SOL")).toHaveLength(2);
      expect(within(dialog).queryByText("2 SOL")).not.toBeInTheDocument();
    });

    it("should answer null when the user closes the details", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDialog();
      await user.keyboard("{Escape}");

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
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
      await findDialog();

      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Earn more" })).toBeEnabled();
    });

    it("should wait for the sync before saying a missing position is not found", async () => {
      const account = solanaAccount({ delegations: [] });
      const { open, setSyncState } = setup({
        account,
        syncState: { [account.id]: { pending: true, error: null } },
      });

      const answer = open();
      const dialog = await findDialog();
      expect(within(dialog).getByText("Loading your position...")).toBeVisible();

      setSyncState({ [account.id]: { pending: false, error: null } });

      expect(await within(dialog).findByText("Position not found")).toBeVisible();
      await userClose(dialog);
      await expect(answer).resolves.toEqual({ action: null });
    });

    it("should let Earn fall back when a validator holds several positions after the sync", async () => {
      const account = solanaAccount({
        lastSyncDate: new Date(Date.now() - 2 * 60_000),
        delegations: [activePosition()],
      });
      const { open, updateAccount } = setup({ account });

      const answer = open();
      await findDialog();
      updateAccount(current => ({
        ...current,
        lastSyncDate: new Date(),
        stakingResources: {
          ...(current as SolanaAccount).stakingResources,
          delegations: [activePosition(), activePosition({ positionId: OTHER_STAKE_ACCOUNT })],
        },
      }));

      await expect(answer).resolves.toEqual({ action: null, reason: "ambiguous" });
      await dialogIsClosed();
    });
  });

  describe("Earn more", () => {
    it("should answer earnMore, close the dialog and open the deposit flow", async () => {
      const { open, store, user } = setup();

      const answer = open();
      await findDialog();
      await user.click(screen.getByRole("button", { name: "Earn more" }));

      await expect(answer).resolves.toEqual({ action: "earnMore" });
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
      await findDialog();
      await user.click(await goToConfirmation(user, "Deactivate to withdraw"));

      await screen.findByRole("button", { name: "Sign on device" });
      expect(mockDeviceStepTransactions.at(-1)).toMatchObject({
        mode: "undelegate",
        recipient: STAKE_ACCOUNT,
      });
    });

    it("should withdraw the whole withdrawable amount the account holds", async () => {
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open, user } = setup({ account });

      void open();
      await findDialog();
      const confirmation = await goToConfirmation(user, "Withdraw all");
      expect(screen.getByRole("dialog", { name: "Withdraw all your SOL?" })).toBeVisible();
      expect(screen.getByText("1.5 SOL")).toBeVisible();
      await user.click(confirmation);

      await screen.findByRole("button", { name: "Sign on device" });
      const transaction = mockDeviceStepTransactions.at(-1);
      expect(transaction).toMatchObject({ mode: "unstake", recipient: STAKE_ACCOUNT });
      expect(transaction?.amount).toEqual(new BigNumber(1.5 * SOL));
    });

    it("should block the confirmation while the prepared transaction has an error", async () => {
      const account = solanaAccount({
        delegations: [],
        unbondings: [deactivatedPosition()],
        balance: 0.5 * SOL,
      });
      const { open, user } = setup({ account });

      void open();
      await findDialog();
      await user.click(await screen.findByRole("button", { name: "Withdraw all" }));

      expect(await screen.findByText("Sorry, insufficient funds")).toBeVisible();
      expect(screen.getByRole("button", { name: "Withdraw all" })).toBeDisabled();
    });

    it("should go back to the details from the confirmation", async () => {
      const { open, user } = setup();

      void open();
      await findDialog();
      await goToConfirmation(user, "Deactivate to withdraw");
      await user.click(screen.getByRole("button", { name: "Go back" }));

      expect(await findDialog()).toBeVisible();
      expect(screen.getByRole("button", { name: "Deactivate to withdraw" })).toBeVisible();
    });

    it("should keep the dialog open, and its title, once the transaction is signed", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDialog();
      await signOnDevice(user);

      expect(await findDialog("Deactivate this position?")).toBeVisible();
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(await isPending(answer)).toBe(true);
      await expect(open()).rejects.toMatchObject({ name: "StakePositionBusy" });
    });

    it("should answer the action once broadcast, with the pending operation in the account", async () => {
      const account = solanaAccount();
      const { open, store, user } = setup({ account });

      const answer = open();
      await findDialog();
      await signOnDevice(user);
      await user.click(screen.getByRole("button", { name: "Broadcast" }));

      await expect(answer).resolves.toEqual({ action: "deactivate" });
      expect(await screen.findByText("Deactivation submitted")).toBeVisible();
      const [storedAccount] = store.getState().accounts;
      expect(storedAccount.pendingOperations.map(({ id }) => id)).toEqual([
        `${account.id}-stake-position-op`,
      ]);
    });

    it("should close the result and leave nothing shown", async () => {
      const { open, store, user } = setup();

      void open();
      await findDialog();
      await signOnDevice(user);
      await user.click(screen.getByRole("button", { name: "Broadcast" }));
      const result = await screen.findByTestId("stake-position-success");
      await user.click(within(result).getByRole("button", { name: "Close" }));

      await dialogIsClosed();
      expect(selectIsStakePositionDialogOpen(store.getState())).toBe(false);
    });

    it("should report its pages and buttons, never the transaction", async () => {
      const { open, user } = setup();

      void open();
      await findDialog();
      await signOnDevice(user);
      await user.click(screen.getByRole("button", { name: "Broadcast" }));
      await screen.findByText("Deactivation submitted");

      expect(jest.mocked(trackPage).mock.calls.map(([event]) => event)).toEqual([
        expect.objectContaining({ category: "Stake position", name: "Details" }),
        expect.objectContaining({ category: "Stake position", name: "Confirm" }),
      ]);
      expect(jest.mocked(track).mock.calls.map(([event]) => event)).toEqual([
        "button_clicked",
        "button_clicked",
      ]);
    });

    it("should let the user retry after refusing on the device, without logging it", async () => {
      mockDeviceError = new UserRefusedOnDevice();
      const critical = jest.spyOn(logger, "critical");
      const { open, user } = setup();

      void open();
      await findDialog();
      await user.click(await goToConfirmation(user, "Deactivate to withdraw"));
      await user.click(await screen.findByRole("button", { name: "Fail on device" }));
      const failure = await screen.findByTestId("stake-position-failure");
      await user.click(within(failure).getByRole("button", { name: "Try again" }));

      expect(await screen.findByRole("button", { name: "Deactivate" })).toBeVisible();
      expect(critical).not.toHaveBeenCalled();
    });

    it("should answer null when the user leaves a failed transaction", async () => {
      const critical = jest.spyOn(logger, "critical").mockImplementation(() => undefined);
      const { open, user } = setup();

      const answer = open();
      await findDialog();
      await user.click(await goToConfirmation(user, "Deactivate to withdraw"));
      await user.click(await screen.findByRole("button", { name: "Fail on device" }));
      const failure = await screen.findByTestId("stake-position-failure");
      await user.click(within(failure).getByRole("button", { name: "Close" }));

      await expect(answer).resolves.toEqual({ action: null });
      expect(critical).toHaveBeenCalledWith(mockDeviceError);
    });

    it("should make the dialog dismissible again when the user retries a failed broadcast", async () => {
      jest.spyOn(logger, "critical").mockImplementation(() => undefined);
      const { open, user } = setup();

      const answer = open();
      await findDialog();
      await signOnDevice(user);
      await user.click(screen.getByRole("button", { name: "Fail on device" }));
      const failure = await screen.findByTestId("stake-position-failure");
      expect(
        within(failure).getByText(
          "Your transaction may have failed. Please wait a moment then check the transaction history before trying again.",
        ),
      ).toBeVisible();
      expect(screen.getAllByRole("button", { name: "Close" })).toEqual([
        within(failure).getByRole("button", { name: "Close" }),
      ]);
      await user.click(within(failure).getByRole("button", { name: "Try again" }));
      await screen.findByRole("button", { name: "Deactivate" });
      await user.click(screen.getByRole("button", { name: "Close" }));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
    });
  });

  describe("when the account changes before the signature", () => {
    it("should prepare the exit again from the updated position on the confirmation", async () => {
      const account = solanaAccount({ delegations: [], unbondings: [deactivatedPosition()] });
      const { open, updateAccount, user } = setup({ account });

      void open();
      await findDialog();
      await goToConfirmation(user, "Withdraw all");
      updateAccount(current => ({
        ...current,
        stakingResources: {
          ...(current as SolanaAccount).stakingResources,
          unbondings: [deactivatedPosition({ withdrawableAmount: new BigNumber(1.75 * SOL) })],
        },
      }));
      expect(await screen.findByText("1.75 SOL")).toBeVisible();
      const confirmation = screen.getByRole("button", { name: "Withdraw all" });
      await waitFor(() => expect(confirmation).toBeEnabled());
      await user.click(confirmation);

      await screen.findByRole("button", { name: "Sign on device" });
      expect(mockDeviceStepTransactions.at(-1)?.amount).toEqual(new BigNumber(1.75 * SOL));
    });

    it("should go back to the details when the exit is no longer possible", async () => {
      const { open, updateAccount, user } = setup();

      void open();
      await findDialog();
      await goToConfirmation(user, "Deactivate to withdraw");
      updateAccount(current => ({
        ...current,
        stakingResources: {
          ...(current as SolanaAccount).stakingResources,
          delegations: [activePosition({ canStake: false })],
        },
      }));

      expect(
        await screen.findByText(
          "Another wallet controls this position, so you can't change it from this account.",
        ),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Deactivate to withdraw" }),
      ).not.toBeInTheDocument();
    });

    it("should say the position is not found when it leaves the account on the details", async () => {
      const { open, updateAccount } = setup();

      const answer = open();
      const dialog = await findDialog();
      updateAccount(current => ({
        ...current,
        stakingResources: { ...(current as SolanaAccount).stakingResources, delegations: [] },
      }));

      expect(await within(dialog).findByText("Position not found")).toBeVisible();
      await userClose(dialog);
      await expect(answer).resolves.toEqual({ action: null });
    });

    it("should say the position is not found when it moves to another validator on the confirmation", async () => {
      const { open, updateAccount, user } = setup();

      void open();
      await findDialog();
      await goToConfirmation(user, "Deactivate to withdraw");
      updateAccount(current => ({
        ...current,
        stakingResources: {
          ...(current as SolanaAccount).stakingResources,
          delegations: [activePosition({ validatorAddress: OTHER_VALIDATOR })],
        },
      }));

      expect(await screen.findByText("Position not found")).toBeVisible();
    });

    it("should say the position is not found when the account leaves the wallet", async () => {
      const account = solanaAccount();
      const { open, store, user } = setup({ account });

      const answer = open();
      await findDialog();
      await goToConfirmation(user, "Deactivate to withdraw");
      act(() => {
        store.dispatch(removeAccount(account));
      });

      const dialog = await findDialog();
      expect(within(dialog).getByText("Position not found")).toBeVisible();
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
      await findDialog();
      await user.click(await goToConfirmation(user, "Deactivate to withdraw"));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
      expect(selectIsBuyDeviceOpen(store.getState())).toBe(true);
      expect(mockDeviceStepTransactions).toHaveLength(0);
    });

    it("should close the dialog when the device step opens the Manager", async () => {
      const { open, user } = setup();

      const answer = open();
      await findDialog();
      await user.click(await goToConfirmation(user, "Deactivate to withdraw"));
      await user.click(await screen.findByRole("button", { name: "Open the Manager" }));

      await expect(answer).resolves.toEqual({ action: null });
      await dialogIsClosed();
      expect(screen.getByText("Manager")).toBeVisible();
    });
  });
});

async function userClose(dialog: HTMLElement) {
  const closeButtons = within(dialog).getAllByRole("button", { name: "Close" });
  act(() => closeButtons[closeButtons.length - 1].click());
  await dialogIsClosed();
}

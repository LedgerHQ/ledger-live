import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  abandonStakePosition,
  commitStakePosition,
  useShownStakePosition,
  useStakePositionData,
  useStakePositionOpener,
  type ReadyStakePositionData,
} from "@features/flow-stake-position";
import { act, renderHook } from "@tests/test-renderer";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSolanaStakePositionSheetViewModel } from "./useSolanaStakePositionSheetViewModel";

// The data hook reads the Earn backend, which the integration suite serves: here the position is given.
jest.mock("@features/flow-stake-position", () => ({
  ...jest.requireActual("@features/flow-stake-position"),
  useStakePositionData: jest.fn(),
}));

// The region of the user decides the appearance of the rate.
jest.mock("~/helpers/getStakeLabelLocaleBased", () => {
  const actual = jest.requireActual("~/helpers/getStakeLabelLocaleBased");
  return { ...actual, getCountryLocale: jest.fn(actual.getCountryLocale) };
});

const SOL = 1_000_000_000;
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";
const VALIDATOR = "FakeVote1111111111111111111111111111111111";

const READY = {
  kind: "ready",
  position: {
    id: STAKE_ACCOUNT,
    network: "solana",
    ownerAddress: "FakeOwner11111111111111111111111111111111111",
    validatorAddress: VALIDATOR,
    validatorName: "Ledger by Figment",
    status: "activated",
    balance: String(10 * SOL),
    deposited: String(9.75 * SOL),
    totalRewards: String(SOL),
    interest: { type: "APY", value: 0.0712 },
  },
  status: "active",
  isStale: false,
  isPolling: false,
} as unknown as ReadyStakePositionData;

function solanaAccount(): SolanaAccount {
  return {
    ...genAccount("stake-position-sheet-view-model", {
      currency: getCryptoCurrencyById("solana"),
      operationsSize: 0,
    }),
    balance: new BigNumber(5 * SOL),
    spendableBalance: new BigNumber(5 * SOL),
    stakingResources: {
      delegations: [
        {
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
        },
      ],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  } as SolanaAccount;
}

/**
 * The sheet of a request a wallet screen opened. A surface reads the request store from before the
 * request opens, as `shown` does: it keeps the closed request while its sheet hides.
 */
function setup({ isSyncing = false } = {}) {
  const account = solanaAccount();
  const opener = renderHook(() => useStakePositionOpener("account"));
  const shown = renderHook(() => useShownStakePosition());
  act(() => opener.result.current({ accountId: account.id, positionId: STAKE_ACCOUNT }));
  const { request } = shown.result.current;
  if (!request) throw new Error("The request is not shown");

  let isAccountSyncing = isSyncing;
  const view = renderHook(() => {
    const { phase } = useShownStakePosition();
    const sheet = useSolanaStakePositionSheetViewModel({
      account,
      isAccountRemoved: false,
      request,
      phase,
      isSyncing: isAccountSyncing,
      onEarnMore: jest.fn(),
    });
    return { phase, sheet };
  });
  const setSyncing = (next: boolean) => {
    isAccountSyncing = next;
    view.rerender({});
  };
  return { view, shown, requestId: request.id, setSyncing };
}

type View = ReturnType<typeof setup>["view"];

function detailsOf(view: View) {
  const { body } = view.result.current.sheet;
  if (body.kind !== "details") throw new Error(`Expected the details, got ${body.kind}`);
  return body.details;
}

function confirmationOf(view: View) {
  const { body } = view.result.current.sheet;
  if (body.kind !== "confirm") throw new Error(`Expected the confirmation, got ${body.kind}`);
  return body.confirm;
}

function exitTransactionOf(view: View) {
  const { exitTransaction } = view.result.current.sheet;
  if (!exitTransaction) throw new Error("The exit transaction is not mounted");
  return exitTransaction;
}

/** The confirmation of the deactivation, once the exit transaction reports it is prepared. */
function goToPreparedConfirmation(view: View) {
  act(() => detailsOf(view).onSelectExitAction("deactivate"));
  const exitTransaction = exitTransactionOf(view);
  act(() =>
    exitTransaction.onPreparedChange({
      transactionKey: exitTransaction.transactionKey,
      isPending: false,
      isReady: true,
      error: undefined,
    }),
  );
}

describe("useSolanaStakePositionSheetViewModel", () => {
  beforeEach(() => {
    jest.mocked(useStakePositionData).mockReturnValue(READY);
    jest.mocked(getCountryLocale).mockReturnValue("US");
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const id = result.current.request?.id;
    if (id !== undefined) act(() => abandonStakePosition(id));
    unmount();
  });

  describe("the details", () => {
    it("should show the rate of the position with its type, and no initial deposit", () => {
      const { view } = setup();

      const details = detailsOf(view);

      expect(details.apy).toEqual({ value: "7.12%", type: "APY" });
      expect(details).not.toHaveProperty("initialDepositCrypto");
      expect(details).not.toHaveProperty("initialDepositFiat");
    });

    it.each([
      ["US", "success"],
      ["FR", "success"],
      ["GB", "gray"],
    ] as const)("should tag the rate in the region %s as %s", (region, appearance) => {
      jest.mocked(getCountryLocale).mockReturnValue(region);
      const { view } = setup();

      expect(detailsOf(view).apyAppearance).toBe(appearance);
    });
  });

  describe("the confirmation", () => {
    it("should start signing the exit, and step the sheet aside for the device", () => {
      const { view } = setup();
      goToPreparedConfirmation(view);
      expect(view.result.current.phase).toBe("open");
      expect(view.result.current.sheet.surface.isOpen).toBe(true);

      act(() => confirmationOf(view).onConfirm());

      expect(view.result.current.phase).toBe("signing");
      expect(exitTransactionOf(view).stage).toBe("signing");
      expect(view.result.current.sheet.surface.isOpen).toBe(false);
    });

    it("should wait for the account sync before it hands the exit to the device", () => {
      const { view, setSyncing } = setup({ isSyncing: true });
      goToPreparedConfirmation(view);
      expect(confirmationOf(view).isPending).toBe(true);

      act(() => confirmationOf(view).onConfirm());

      expect(view.result.current.phase).toBe("open");
      expect(exitTransactionOf(view).stage).toBe("confirm");
      setSyncing(false);
      expect(confirmationOf(view).isPending).toBe(false);
      act(() => confirmationOf(view).onConfirm());
      expect(view.result.current.phase).toBe("signing");
      expect(exitTransactionOf(view).stage).toBe("signing");
    });
  });

  describe("the device step", () => {
    it("should show the processing of the exit in the sheet once the signature is handed over", () => {
      const { view, requestId } = setup();
      goToPreparedConfirmation(view);
      act(() => confirmationOf(view).onConfirm());

      act(() => {
        commitStakePosition(requestId);
        exitTransactionOf(view).onSigned();
      });

      const { sheet } = view.result.current;
      expect(exitTransactionOf(view).stage).toBe("broadcasting");
      expect(sheet.body).toEqual({ kind: "processing", action: "deactivate" });
      expect(sheet.surface.isOpen).toBe(true);
    });

    it("should let the user close the sheet while the exit is unsigned, never once it is signed", () => {
      const { view, requestId } = setup();
      goToPreparedConfirmation(view);
      act(() => confirmationOf(view).onConfirm());
      expect(view.result.current.phase).toBe("signing");
      expect(view.result.current.sheet.surface.isDismissible).toBe(true);

      act(() => commitStakePosition(requestId));

      expect(view.result.current.phase).toBe("committed");
      expect(view.result.current.sheet.surface.isDismissible).toBe(false);
    });

    it("should open the request again, for a new request, when the device step cannot start", () => {
      const { view } = setup();
      goToPreparedConfirmation(view);
      act(() => confirmationOf(view).onConfirm());
      expect(view.result.current.phase).toBe("signing");

      act(() => exitTransactionOf(view).onFailed(new Error("The device step could not start")));

      expect(view.result.current.sheet.body.kind).toBe("failure");
      expect(view.result.current.phase).toBe("open");
    });
  });

  describe("the hide of the sheet", () => {
    it("should keep a request that is held, and release it once it is closed", () => {
      const { view, shown, requestId } = setup();

      act(() => view.result.current.sheet.surface.onHidden?.());
      expect(shown.result.current).toMatchObject({ phase: "open", request: { id: requestId } });

      act(() => abandonStakePosition(requestId));
      expect(shown.result.current).toMatchObject({ phase: "closed", request: { id: requestId } });
      act(() => view.result.current.sheet.surface.onHidden?.());

      expect(shown.result.current).toEqual({ request: null, phase: "closed" });
    });
  });
});

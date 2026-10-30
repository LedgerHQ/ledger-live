import BigNumber from "bignumber.js";
import { act, renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { listSolanaStakingPositions } from "@ledgerhq/live-common/families/solana/logic";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { StakingDelegation, StakingResources, StakingUnbonding } from "@ledgerhq/types-live";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import { openURL } from "~/renderer/linking";
import { useSolanaDelegationsViewModel } from "./useSolanaDelegationsViewModel";

const mockDispatch = jest.fn();

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));
jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));
jest.mock("@ledgerhq/live-common/families/solana/react", () => ({
  useSolanaStakesWithMeta: jest.fn(),
}));

const { useSolanaStakesWithMeta } = jest.requireMock("@ledgerhq/live-common/families/solana/react");

const SOL = (value: number) => new BigNumber(value).times(1e9);

const delegation = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: "stake-bonded",
  validatorAddress: "vote-bonded",
  amount: SOL(2),
  activeAmount: SOL(2),
  inactiveAmount: new BigNumber(0),
  withdrawableAmount: new BigNumber(0),
  pendingRewards: new BigNumber(0),
  status: "bonded",
  ...overrides,
});

const unbonding = (overrides: Partial<StakingUnbonding> = {}): StakingUnbonding => ({
  positionId: "stake-inactive",
  validatorAddress: "vote-inactive",
  amount: SOL(1),
  activeAmount: new BigNumber(0),
  inactiveAmount: SOL(1),
  withdrawableAmount: SOL(1),
  completionDate: new Date(0),
  status: "withdrawable",
  ...overrides,
});

const accountWith = (
  stakes: { delegations?: StakingDelegation[]; unbondings?: StakingUnbonding[] },
  spendableBalance = new BigNumber(0),
): SolanaAccount =>
  ({
    type: "Account",
    id: "solana-account",
    currency: getCryptoCurrencyById("solana"),
    spendableBalance,
    stakingResources: {
      delegations: stakes.delegations ?? [],
      redelegations: [],
      unbondings: stakes.unbondings ?? [],
    } as unknown as StakingResources,
  }) as unknown as SolanaAccount;

const metaFor = (
  validators: Record<string, { name?: string; img?: string; url?: string } | undefined> = {},
) =>
  useSolanaStakesWithMeta.mockImplementation(
    (_currency: unknown, resources: StakingResources | undefined) =>
      listSolanaStakingPositions(resources).map(stake => ({
        stake,
        meta: { validator: validators[stake.validatorAddress ?? ""] },
      })),
  );

const render = (account: SolanaAccount) => renderHook(() => useSolanaDelegationsViewModel(account));

const getProps = (account: SolanaAccount) => {
  const { result } = render(account);
  if (!result.current) throw new Error("expected the view model to expose delegations");
  return { props: result.current, dispatch: mockDispatch };
};

describe("useSolanaDelegationsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    metaFor();
  });

  describe("visibility", () => {
    it("exposes nothing when there is no stake and nothing to stake", () => {
      const { result } = render(accountWith({}));

      expect(result.current).toBeUndefined();
    });

    it("exposes the empty state when there is no stake but a spendable balance", () => {
      const { props } = getProps(accountWith({}, SOL(1)));

      expect(props.rows).toEqual([]);
      expect(props.headerActions).toEqual([]);
    });

    it("offers to add a delegation once there is at least one stake", () => {
      const { props } = getProps(accountWith({ delegations: [delegation()] }));

      expect(props.headerActions).toEqual([expect.objectContaining({ id: "delegate" })]);
    });
  });

  describe("rows", () => {
    it("maps each stake with its validator, status, amounts and active share", () => {
      metaFor({ "vote-bonded": { name: "Ledger Validator", img: "https://img/ledger.png" } });
      const { props } = getProps(
        accountWith({
          delegations: [delegation({ withdrawableAmount: SOL(0.5), activeAmount: SOL(1) })],
        }),
      );

      expect(props.rows).toHaveLength(1);
      expect(props.rows[0]).toMatchObject({
        id: "stake-bonded",
        validator: { name: "Ledger Validator", imageUrl: "https://img/ledger.png" },
        status: { appearance: "success" },
        cells: {
          delegated: { value: "2\u00a0SOL", sensitive: true },
          active: { value: "50.00 %" },
          available: { value: "0.5\u00a0SOL", sensitive: true },
        },
      });
    });

    it("falls back to the validator address, then to a dash, for the validator name", () => {
      const { props } = getProps(
        accountWith({
          delegations: [delegation()],
          unbondings: [unbonding({ validatorAddress: "" })],
        }),
      );

      expect(props.rows.map(row => row.validator.name)).toEqual(["vote-bonded", "-"]);
    });

    it("reports a zero active share for a stake without validator", () => {
      const { props } = getProps(
        accountWith({ unbondings: [unbonding({ validatorAddress: "" })] }),
      );

      expect(props.rows[0]?.cells["active"]).toEqual({ value: "0 %" });
    });

    it("shows a zero available amount when the stake exposes none", () => {
      const { props } = getProps(
        accountWith({ delegations: [delegation({ withdrawableAmount: undefined })] }),
      );

      expect(props.rows[0]?.cells["available"]).toEqual({ value: "0\u00a0SOL", sensitive: true });
    });

    it("falls back to the row index when a stake has no position id", () => {
      const { props } = getProps(
        accountWith({ delegations: [delegation({ positionId: undefined })] }),
      );

      expect(props.rows[0]?.id).toBe("0");
    });

    it.each([
      ["bonded", "success"],
      ["activating", "warning"],
    ] as const)("gives a %s delegation the %s appearance", (status, appearance) => {
      const { props } = getProps(accountWith({ delegations: [delegation({ status })] }));

      expect(props.rows[0]?.status?.appearance).toBe(appearance);
    });

    it.each([
      ["withdrawable", "error"],
      ["deactivating", "warning"],
    ] as const)("gives a %s unbonding the %s appearance", (status, appearance) => {
      const { props } = getProps(accountWith({ unbondings: [unbonding({ status })] }));

      expect(props.rows[0]?.status?.appearance).toBe(appearance);
    });

    it("only explains the active state with the active tooltip", () => {
      const { props } = getProps(
        accountWith({ delegations: [delegation()], unbondings: [unbonding()] }),
      );
      const [active, inactive] = props.rows;

      expect(active?.status?.tooltip).toBeDefined();
      expect(active?.status?.tooltip).not.toBe(inactive?.status?.tooltip);
    });
  });

  describe("row actions", () => {
    it.each<[string, string, Parameters<typeof accountWith>[0]]>([
      ["activate", "MODAL_SOLANA_DELEGATION_ACTIVATE", { unbondings: [unbonding()] }],
      [
        "deactivate",
        "MODAL_SOLANA_DELEGATION_DEACTIVATE",
        { delegations: [delegation({ positionId: "stake-deactivate" })] },
      ],
      [
        "reactivate",
        "MODAL_SOLANA_DELEGATION_REACTIVATE",
        { unbondings: [unbonding({ status: "deactivating", withdrawableAmount: undefined })] },
      ],
    ])("offers %s as the %s modal", (_action, modal, stakes) => {
      const { props } = getProps(accountWith(stakes));

      expect(props.rows[0]?.actions.map(action => action.id)).toContain(modal);
    });

    it("offers withdraw next to the state action when something is withdrawable", () => {
      const { props } = getProps(accountWith({ unbondings: [unbonding()] }));

      expect(props.rows[0]?.actions.map(action => action.id)).toEqual([
        "MODAL_SOLANA_DELEGATION_WITHDRAW",
        "MODAL_SOLANA_DELEGATION_ACTIVATE",
      ]);
    });

    it("offers no action for a stake without position id", () => {
      const { props } = getProps(
        accountWith({ delegations: [delegation({ positionId: undefined })] }),
      );

      expect(props.rows[0]?.actions).toEqual([]);
    });

    it("opens the action modal with the account and the stake of the selected row", () => {
      const account = accountWith({
        delegations: [
          delegation({ positionId: "stake-big", amount: SOL(3) }),
          delegation({ positionId: "stake-small", amount: SOL(1) }),
        ],
      });
      const { props, dispatch } = getProps(account);

      act(() => props.onSelectRowAction("stake-small", "MODAL_SOLANA_DELEGATION_DEACTIVATE"));

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        openModal("MODAL_SOLANA_DELEGATION_DEACTIVATE", {
          account,
          stakeWithMeta: expect.objectContaining({
            stake: expect.objectContaining({ positionId: "stake-small" }),
          }),
        }),
      );
    });

    it.each([
      "MODAL_SOLANA_DELEGATION_ACTIVATE",
      "MODAL_SOLANA_DELEGATION_REACTIVATE",
      "MODAL_SOLANA_DELEGATION_DEACTIVATE",
      "MODAL_SOLANA_DELEGATION_WITHDRAW",
    ] as const)("dispatches the %s modal", modal => {
      const account = accountWith({ delegations: [delegation()] });
      const { props, dispatch } = getProps(account);

      act(() => props.onSelectRowAction("stake-bonded", modal));

      expect(dispatch).toHaveBeenCalledWith(
        openModal(modal, { account, stakeWithMeta: expect.anything() }),
      );
    });

    it("does nothing when the selected row no longer exists", () => {
      const { props, dispatch } = getProps(accountWith({ delegations: [delegation()] }));

      act(() => props.onSelectRowAction("unknown", "MODAL_SOLANA_DELEGATION_WITHDRAW"));

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("header and empty state", () => {
    it("opens the delegate modal from the header action", () => {
      const account = accountWith({ delegations: [delegation()] });
      const { props, dispatch } = getProps(account);

      act(() => props.onSelectHeaderAction("delegate"));

      expect(dispatch).toHaveBeenCalledWith(openModal("MODAL_SOLANA_DELEGATE", { account }));
    });

    it("opens the rewards info modal from the empty state", () => {
      const account = accountWith({}, SOL(1));
      const { props, dispatch } = getProps(account);

      act(() => props.onStartDelegating());

      expect(dispatch).toHaveBeenCalledWith(openModal("MODAL_SOLANA_REWARDS_INFO", { account }));
    });

    it("opens the Solana staking page from the learn more link", () => {
      const { props } = getProps(accountWith({}, SOL(1)));

      props.onLearnMore?.();

      expect(openURL).toHaveBeenCalledWith(urls.solana.staking);
    });
  });

  describe("validator link", () => {
    it("opens the validator website when the metadata carries one", () => {
      metaFor({ "vote-bonded": { url: "https://validator.example" } });
      const { props } = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("stake-bonded");

      expect(openURL).toHaveBeenCalledWith("https://validator.example");
    });

    it("opens the localized Ledger validator page for the Ledger validator", () => {
      metaFor({ "vote-bonded": { url: urls.ledgerValidator } });
      const { props } = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("stake-bonded");

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith(expect.stringContaining("ledger.com/"));
    });

    it("falls back to the address explorer when the validator has no website", () => {
      const { props } = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("stake-bonded");

      expect(openURL).toHaveBeenCalledWith(expect.stringContaining("vote-bonded"));
    });

    it("opens nothing for a stake without validator", () => {
      const { props } = getProps(
        accountWith({ unbondings: [unbonding({ validatorAddress: "" })] }),
      );

      props.onOpenValidator?.("stake-inactive");

      expect(openURL).not.toHaveBeenCalled();
    });

    it("opens nothing for an unknown row", () => {
      const { props } = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("unknown");

      expect(openURL).not.toHaveBeenCalled();
    });
  });
});

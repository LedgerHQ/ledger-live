import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { listSolanaStakingPositions } from "@ledgerhq/live-common/families/solana/logic";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { AccountDelegationsProps } from "@features/flow-account-detail-delegations";
import { abandonStakePosition, useShownStakePosition } from "@features/flow-stake-position";
import type { StakingDelegation, StakingResources, StakingUnbonding } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useSolanaDelegationsViewModel } from "./useSolanaDelegationsViewModel";
import { VIEW_STAKE_POSITION_DETAILS } from "./useViewStakePositionDetails";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
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
  currencyId = "solana",
): SolanaAccount =>
  ({
    type: "Account",
    id: "solana-account",
    currency: getCryptoCurrencyById(currencyId),
    spendableBalance: new BigNumber(0),
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

type Flags = ReturnType<typeof withFlagOverrides>;

const getProps = (account: SolanaAccount, overrideInitialState?: Flags) =>
  renderHook(() => useSolanaDelegationsViewModel(account), { overrideInitialState }).result.current;

const actionIds = (account: SolanaAccount, overrideInitialState?: Flags) =>
  getProps(account, overrideInitialState).rows[0]?.actions.map(a => a.id);

const ACCOUNT_PAGE_ON = withFlagOverrides({
  earnNativeStakePosition: { enabled: true, params: { accountPage: true } },
});

describe("useSolanaDelegationsViewModel", () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    metaFor();
  });

  describe("rows", () => {
    it("maps each stake with its validator, status, amounts and active share", () => {
      metaFor({ "vote-bonded": { name: "Ledger Validator", img: "https://img/ledger.png" } });

      const props = getProps(
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
      const props = getProps(
        accountWith({
          delegations: [delegation()],
          unbondings: [unbonding({ validatorAddress: "" })],
        }),
      );

      expect(props.rows.map(row => row.validator.name)).toEqual(["vote-bonded", "-"]);
    });

    it("shows the withdrawable amount as delegated once the stake has been emptied", () => {
      const props = getProps(
        accountWith({ unbondings: [unbonding({ amount: new BigNumber(0) })] }),
      );

      expect(props.rows[0]?.cells["delegated"]).toEqual({ value: "1\u00a0SOL", sensitive: true });
    });

    it("reports a zero active share for a stake without validator", () => {
      const props = getProps(accountWith({ unbondings: [unbonding({ validatorAddress: "" })] }));

      expect(props.rows[0]?.cells["active"]).toEqual({ value: "0 %" });
    });

    it("only shows the inactive amount when there is some", () => {
      const props = getProps(
        accountWith({
          delegations: [delegation()],
          unbondings: [unbonding({ inactiveAmount: SOL(0.25) })],
        }),
      );
      const [bonded, inactive] = props.rows;

      expect(bonded?.cells).not.toHaveProperty("inactive");
      expect(inactive?.cells["inactive"]).toEqual({ value: "0.25\u00a0SOL", sensitive: true });
    });

    it("shows a zero available amount when the stake exposes none", () => {
      const props = getProps(
        accountWith({ delegations: [delegation({ withdrawableAmount: undefined })] }),
      );

      expect(props.rows[0]?.cells["available"]).toEqual({ value: "0\u00a0SOL", sensitive: true });
    });

    it("falls back to the row index when a stake has no position id", () => {
      const props = getProps(accountWith({ delegations: [delegation({ positionId: undefined })] }));

      expect(props.rows[0]?.id).toBe("0");
    });

    it.each([
      ["bonded", "success"],
      ["activating", "warning"],
    ] as const)("gives a %s delegation the %s appearance", (status, appearance) => {
      const props = getProps(accountWith({ delegations: [delegation({ status })] }));

      expect(props.rows[0]?.status?.appearance).toBe(appearance);
    });

    it.each([
      ["withdrawable", "error"],
      ["deactivating", "warning"],
    ] as const)("gives a %s unbonding the %s appearance", (status, appearance) => {
      const props = getProps(accountWith({ unbondings: [unbonding({ status })] }));

      expect(props.rows[0]?.status?.appearance).toBe(appearance);
    });
  });

  describe("header", () => {
    it("offers no header action while there is no stake", () => {
      expect(getProps(accountWith({})).headerActions).toEqual([]);
    });

    it("offers to add a delegation once there is a stake", () => {
      const props = getProps(accountWith({ delegations: [delegation()] }));

      expect(props.headerActions).toEqual([expect.objectContaining({ id: "delegate" })]);
    });
  });

  describe("action availability", () => {
    it("offers deactivate on an active stake", () => {
      expect(actionIds(accountWith({ delegations: [delegation()] }))).toEqual(["deactivate"]);
    });

    it("offers deactivate on an activating stake", () => {
      const account = accountWith({ delegations: [delegation({ status: "activating" })] });

      expect(actionIds(account)).toEqual(["deactivate"]);
    });

    it("offers reactivate on a deactivating stake", () => {
      const account = accountWith({
        unbondings: [unbonding({ status: "deactivating", withdrawableAmount: undefined })],
      });

      expect(actionIds(account)).toEqual(["reactivate"]);
    });

    it("offers withdraw and activate on an inactive stake with funds to withdraw", () => {
      expect(actionIds(accountWith({ unbondings: [unbonding()] }))).toEqual([
        "withdraw",
        "activate",
      ]);
    });

    it("offers no action on a stake without position id", () => {
      const account = accountWith({ delegations: [delegation({ positionId: undefined })] });

      expect(actionIds(account)).toEqual([]);
    });
  });

  describe("navigation", () => {
    it("changes the stake of the selected row with the chosen action", () => {
      const account = accountWith({
        delegations: [
          delegation({ positionId: "stake-big", amount: SOL(3) }),
          delegation({ positionId: "stake-small", amount: SOL(1) }),
        ],
      });
      const props = getProps(account);

      act(() => props.onSelectRowAction("stake-small", "deactivate"));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SolanaDelegationFlow, {
        screen: ScreenName.DelegationSummary,
        params: {
          accountId: "solana-account",
          delegationAction: {
            kind: "change",
            stakeAction: "deactivate",
            stakeWithMeta: expect.objectContaining({
              stake: expect.objectContaining({ positionId: "stake-small" }),
            }),
          },
        },
      });
    });

    it("does nothing when the selected row no longer exists", () => {
      const props = getProps(accountWith({ delegations: [delegation()] }));

      act(() => props.onSelectRowAction("unknown", "withdraw"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it.each([
      ["onStartDelegating", (props: AccountDelegationsProps) => props.onStartDelegating()],
      [
        "onSelectHeaderAction",
        (props: AccountDelegationsProps) => props.onSelectHeaderAction("delegate"),
      ],
    ] as const)("starts a new delegation from %s", (_name, trigger) => {
      const props = getProps(accountWith({ delegations: [delegation()] }));

      act(() => trigger(props));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SolanaDelegationFlow, {
        screen: ScreenName.DelegationSummary,
        params: { accountId: "solana-account", delegationAction: { kind: "new" } },
      });
    });
  });

  describe("View details", () => {
    afterEach(() => {
      const { result, unmount } = renderHook(() => useShownStakePosition());
      const { request } = result.current;
      if (request) act(() => abandonStakePosition(request.id));
      unmount();
    });

    it("comes first in the row actions once the flag opens the account page entry", () => {
      const props = getProps(
        accountWith({ delegations: [delegation()], unbondings: [unbonding()] }),
        ACCOUNT_PAGE_ON,
      );

      expect(props.rows.map(row => row.actions.map(action => action.label))).toEqual([
        ["View details", "Deactivate"],
        ["View details", "Withdraw", "Activate"],
      ]);
    });

    it("opens the stake position sheet for the row, and no legacy flow", () => {
      const props = getProps(accountWith({ delegations: [delegation()] }), ACCOUNT_PAGE_ON);
      const shown = renderHook(() => useShownStakePosition());
      const [viewDetails] = props.rows[0]?.actions ?? [];

      act(() => props.onSelectRowAction("stake-bonded", viewDetails?.id ?? ""));

      expect(shown.result.current.request).toMatchObject({
        origin: "account",
        accountId: "solana-account",
        positionId: "stake-bonded",
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("keeps opening the legacy flow for the other actions of the row", () => {
      const props = getProps(accountWith({ delegations: [delegation()] }), ACCOUNT_PAGE_ON);
      const shown = renderHook(() => useShownStakePosition());

      act(() => props.onSelectRowAction("stake-bonded", "deactivate"));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SolanaDelegationFlow, {
        screen: ScreenName.DelegationSummary,
        params: {
          accountId: "solana-account",
          delegationAction: expect.objectContaining({ kind: "change", stakeAction: "deactivate" }),
        },
      });
      expect(shown.result.current.request).toBeNull();
    });

    it("opens nothing for a stake without its stake account address", () => {
      const props = getProps(
        accountWith({ delegations: [delegation({ positionId: undefined })] }),
        ACCOUNT_PAGE_ON,
      );
      const shown = renderHook(() => useShownStakePosition());

      act(() => props.onSelectRowAction("0", VIEW_STAKE_POSITION_DETAILS));

      expect(shown.result.current.request).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it.each([
      ["the flag is off", withFlagOverrides({ earnNativeStakePosition: { enabled: false } })],
      [
        "the flag opens Earn only, as its existing values do",
        withFlagOverrides({ earnNativeStakePosition: { enabled: true } }),
      ],
      [
        "the account page param is off",
        withFlagOverrides({
          earnNativeStakePosition: { enabled: true, params: { accountPage: false } },
        }),
      ],
    ])("is not offered when %s", (_case, flags) => {
      expect(actionIds(accountWith({ delegations: [delegation()] }), flags)).toEqual([
        "deactivate",
      ]);
    });

    it.each(["solana_devnet", "solana_testnet"])("is not offered on %s", currencyId => {
      const account = accountWith({ delegations: [delegation()] }, currencyId);

      expect(actionIds(account, ACCOUNT_PAGE_ON)).toEqual(["deactivate"]);
    });

    it("is not offered for a stake without its stake account address", () => {
      const account = accountWith({ delegations: [delegation({ positionId: undefined })] });

      expect(actionIds(account, ACCOUNT_PAGE_ON)).toEqual([]);
    });
  });

  describe("links", () => {
    it("opens the Solana staking page from the learn more link", () => {
      getProps(accountWith({})).onLearnMore?.();

      expect(openURL).toHaveBeenCalledWith(urls.solana.stakingPage);
    });

    it("opens the validator website when the metadata carries one", () => {
      metaFor({ "vote-bonded": { url: "https://validator.example" } });
      const props = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("stake-bonded");

      expect(openURL).toHaveBeenCalledWith("https://validator.example");
    });

    it("falls back to the address explorer when the validator has no website", () => {
      const props = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("stake-bonded");

      expect(openURL).toHaveBeenCalledWith(expect.stringContaining("vote-bonded"));
    });

    it("opens nothing for a stake without validator", () => {
      const props = getProps(accountWith({ unbondings: [unbonding({ validatorAddress: "" })] }));

      props.onOpenValidator?.("stake-inactive");

      expect(openURL).not.toHaveBeenCalled();
    });

    it("opens nothing for an unknown row", () => {
      const props = getProps(accountWith({ delegations: [delegation()] }));

      props.onOpenValidator?.("unknown");

      expect(openURL).not.toHaveBeenCalled();
    });
  });
});

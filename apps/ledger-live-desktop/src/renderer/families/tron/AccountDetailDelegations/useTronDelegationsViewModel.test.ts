import BigNumber from "bignumber.js";
import { act, renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { track } from "@shared/analytics";
import { urls } from "~/config/urls";
import { setDiscreetMode } from "~/renderer/actions/settings";
import { openURL } from "~/renderer/linking";
import { useTronDelegationsViewModel } from "./useTronDelegationsViewModel";

const mockNavigate = jest.fn();
const DAY_MS = 24 * 60 * 60 * 1000;

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));
jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));
jest.mock("@ledgerhq/live-common/families/tron/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/tron/react"),
  useTronSuperRepresentatives: () => [],
}));

type Resources = Partial<TronAccount["tronResources"]>;

const accountWith = (resources: Resources = {}): TronAccount =>
  ({
    type: "Account",
    id: "tron-account",
    currency: getCryptoCurrencyById("tron"),
    spendableBalance: new BigNumber(0),
    operations: [],
    tronResources: {
      votes: [],
      tronPower: 0,
      unwithdrawnReward: new BigNumber(0),
      ...resources,
    },
  }) as unknown as TronAccount;

type Vote = TronAccount["tronResources"]["votes"][number];

const vote = (address: string, voteCount: number, name?: string) =>
  ({ address, voteCount, name }) as Vote;

const votes = [vote("sr-1", 6, "Ledger SR"), vote("sr-2", 4)];

const votingAccount = (resources: Resources = {}) =>
  accountWith({ votes, tronPower: 10, ...resources });

const getProps = (account: TronAccount) =>
  renderHook(() => useTronDelegationsViewModel(account)).result.current;

describe("useTronDelegationsViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("rows", () => {
    it("lists the votes with their amount and share of the tron power", () => {
      const { rows } = getProps(votingAccount());

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        id: "sr-1",
        validator: { name: "Ledger SR" },
        cells: {
          amount: { value: "6", sensitive: true },
          percentTP: { value: "60 %" },
        },
      });
    });

    it("falls back to the address when a vote has no name", () => {
      const { rows } = getProps(votingAccount());

      expect(rows[1]?.validator.name).toBe("sr-2");
    });

    it("shows no row when there is no tron power left to vote with", () => {
      expect(getProps(accountWith({ votes, tronPower: 0 })).rows).toEqual([]);
    });

    it("shows no row when nothing has been voted", () => {
      expect(getProps(accountWith({ tronPower: 10 })).rows).toEqual([]);
    });

    it("tells that the votes just started when the last vote is recent", () => {
      const { rows } = getProps(votingAccount({ lastVotedDate: new Date() }));

      expect(rows[0]?.cells["duration"]?.value).toBe("Just started");
    });

    it("tells for how long the votes have been cast", () => {
      const { rows } = getProps(
        votingAccount({ lastVotedDate: new Date(Date.now() - 3 * DAY_MS) }),
      );

      expect(rows[0]?.cells["duration"]?.value).toBe("3 days");
    });
  });

  describe("header actions", () => {
    it("offers no action without votes and rewards", () => {
      expect(getProps(accountWith()).headerActions).toEqual([]);
    });

    it("offers to manage the votes and to claim, with the reward amount, when rewards are available", () => {
      const { headerActions } = getProps(
        votingAccount({ unwithdrawnReward: new BigNumber(2_500_000) }),
      );

      expect(headerActions).toEqual([
        expect.objectContaining({ id: "vote", label: "Manage votes" }),
        expect.objectContaining({
          id: "claim",
          label: expect.stringContaining("2.5"),
          disabledReason: undefined,
        }),
      ]);
    });

    it("disables the claim action with a reason when there is nothing to claim", () => {
      const { headerActions } = getProps(votingAccount());

      expect(headerActions?.find(action => action.id === "claim")).toMatchObject({
        label: "Claim rewards",
        disabledReason: "No rewards available",
      });
    });

    it("disables the claim action until the next reward date once rewards were withdrawn", () => {
      const { headerActions } = getProps(
        votingAccount({
          unwithdrawnReward: new BigNumber(1_000_000),
          lastWithdrawnRewardDate: new Date(),
        }),
      );

      expect(headerActions?.find(action => action.id === "claim")?.disabledReason).toContain(
        "Rewards can be claimed",
      );
    });

    it("offers to claim even without votes when rewards are available", () => {
      const { headerActions } = getProps(
        accountWith({ unwithdrawnReward: new BigNumber(1_000_000) }),
      );

      expect(headerActions?.map(action => action.id)).toEqual(["claim"]);
    });
  });

  describe("footer", () => {
    it("reminds the remaining votes when not all of them are cast", () => {
      const { footer } = getProps(accountWith({ votes: [vote("sr-1", 4)], tronPower: 10 }));

      expect(footer).toMatchObject({
        title: "You still have 6 votes remaining",
        actionDisabled: true,
      });
    });

    it("masks the remaining votes when discreet mode is on", () => {
      const account = accountWith({ votes: [vote("sr-1", 4)], tronPower: 10 });

      const { result, store } = renderHook(() => useTronDelegationsViewModel(account));
      act(() => {
        store.dispatch(setDiscreetMode(true));
      });

      expect(result.current.discreet).toBe(true);
      expect(result.current.footer?.title).toBe("You still have *** votes remaining");
    });

    it("has no footer once every vote is cast", () => {
      expect(getProps(votingAccount()).footer).toBeUndefined();
    });

    it("has no footer without votes", () => {
      expect(getProps(accountWith({ tronPower: 10 })).footer).toBeUndefined();
    });
  });

  describe("empty state", () => {
    it("invites to freeze when there is no tron power", () => {
      const { emptyState } = getProps(accountWith());

      expect(emptyState).toMatchObject({
        description: "You can now earn rewards by freezing and voting.",
        actionDisabled: true,
      });
    });

    it("invites to cast votes when there is tron power but no vote", () => {
      const { emptyState } = getProps(accountWith({ tronPower: 10 }));

      expect(emptyState).toMatchObject({
        description: expect.stringContaining("Cast your votes"),
        actionLabel: "Cast votes",
      });
    });
  });

  describe("interactions", () => {
    it("sends the user to the staking app to manage the votes", () => {
      const account = votingAccount();
      const props = getProps(account);

      act(() => props.onSelectHeaderAction("vote"));

      expect(mockNavigate).toHaveBeenCalledWith(
        "/platform/stakekit",
        expect.objectContaining({
          state: expect.objectContaining({
            pendingaction: "REVOTE",
            yieldId: "tron-trx-native-staking",
            accountId: account.id,
          }),
        }),
      );
      expect(track).toHaveBeenCalledWith(
        "button_clicked2",
        expect.objectContaining({ button: "manage votes", currency: "TRX" }),
      );
    });

    it("sends the user to the staking app to claim the rewards", () => {
      const props = getProps(votingAccount({ unwithdrawnReward: new BigNumber(1_000_000) }));

      act(() => props.onSelectHeaderAction("claim"));

      expect(mockNavigate).toHaveBeenCalledWith(
        "/platform/stakekit",
        expect.objectContaining({
          state: expect.objectContaining({ pendingaction: "CLAIM_REWARDS" }),
        }),
      );
      expect(track).toHaveBeenCalledWith(
        "button_clicked2",
        expect.objectContaining({ button: "claim rewards" }),
      );
    });

    it("ignores an unknown header action", () => {
      const props = getProps(votingAccount());

      act(() => props.onSelectHeaderAction("unknown"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("opens the explorer on the address of the validator", () => {
      getProps(votingAccount()).onOpenValidator?.("sr-1");

      expect(openURL).toHaveBeenCalledWith(expect.stringContaining("sr-1"));
    });

    it("opens the Tron staking page from the learn more link", () => {
      getProps(votingAccount()).onLearnMore?.();

      expect(openURL).toHaveBeenCalledWith(expect.stringContaining(new URL(urls.stakingTron).host));
    });

    it("keeps the row and start delegating callbacks inert", () => {
      const props = getProps(votingAccount());

      expect(props.onSelectRowAction("sr-1", "any")).toBeUndefined();
      expect(props.onStartDelegating()).toBeUndefined();
      expect(props.onSelectFooterAction?.()).toBeUndefined();
    });
  });
});

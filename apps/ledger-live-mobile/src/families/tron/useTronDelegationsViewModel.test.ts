import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import { act, renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useTronDelegationsViewModel } from "./useTronDelegationsViewModel";

const mockNavigate = jest.fn();
const DAY_MS = 24 * 60 * 60 * 1000;
const ONE_TRX = 1_000_000;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("@ledgerhq/live-common/families/tron/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/tron/react"),
  useTronSuperRepresentatives: () => [],
}));
jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
}));

type Resources = Partial<TronAccount["tronResources"]>;

const accountWith = (resources: Resources = {}, spendable = 0): TronAccount =>
  ({
    type: "Account",
    id: "tron-account",
    currency: getCryptoCurrencyById("tron"),
    spendableBalance: new BigNumber(spendable),
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

const render = (account: TronAccount, discreet = false) =>
  renderHook(() => useTronDelegationsViewModel(account), {
    overrideInitialState: (state: State): State => ({
      ...state,
      settings: { ...state.settings, discreetMode: discreet },
    }),
  }).result.current;

const getProps = (account: TronAccount) => {
  const props = render(account);
  if (!props) throw new Error("expected the view model to expose votes");
  return props;
};

describe("useTronDelegationsViewModel", () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
  });

  describe("visibility", () => {
    it("exposes nothing without votes, rewards or balance to freeze", () => {
      expect(render(accountWith())).toBeUndefined();
    });

    it("exposes the empty state when there is a balance to freeze", () => {
      const props = getProps(accountWith({}, 2 * ONE_TRX));

      expect(props.rows).toEqual([]);
      expect(props.headerActions).toEqual([]);
    });

    it("exposes the rewards when there is something to claim", () => {
      const props = getProps(accountWith({ unwithdrawnReward: new BigNumber(ONE_TRX) }));

      expect(props.headerActions).toEqual([
        expect.objectContaining({ id: "claim", disabledReason: undefined }),
      ]);
    });
  });

  describe("rows", () => {
    it("lists the votes with their amount", () => {
      const { rows, columns } = getProps(votingAccount());

      expect(columns).toEqual([expect.objectContaining({ id: "amount" })]);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        id: "sr-1",
        validator: { name: "Ledger SR" },
        cells: { amount: { value: "6", sensitive: true } },
      });
    });

    it("falls back to the address when a vote has no name", () => {
      expect(getProps(votingAccount()).rows[1]?.validator.name).toBe("sr-2");
    });

    it("shows the vote age next to the representative", () => {
      const { rows } = getProps(
        votingAccount({ lastVotedDate: new Date(Date.now() - 3 * DAY_MS) }),
      );

      expect(rows.map(row => row.validator.description)).toEqual(["3 days ago", "3 days ago"]);
    });

    it("shows no vote age when the last vote is unknown", () => {
      const { rows } = getProps(votingAccount());

      expect(rows[0]?.validator.description).toBeUndefined();
    });

    it("shows no row when there is no tron power", () => {
      expect(getProps(accountWith({ votes, tronPower: 0 }, 2 * ONE_TRX)).rows).toEqual([]);
    });
  });

  describe("title and empty state", () => {
    it("counts the votes in the title", () => {
      expect(getProps(votingAccount()).title).toBe("Votes (2)");
    });

    it("titles the votes once there is tron power but no vote", () => {
      const props = getProps(accountWith({ tronPower: 10 }, 2 * ONE_TRX));

      expect(props.title).toBe("Votes");
      expect(props.emptyState).toMatchObject({ actionLabel: "Vote", actionDisabled: true });
    });

    it("introduces freezing when there is no tron power", () => {
      const props = getProps(accountWith({}, 2 * ONE_TRX));

      expect(props.title).not.toBe("Votes");
      expect(props.emptyState?.description).toBe(
        "You can now earn rewards by freezing and voting.",
      );
    });
  });

  describe("header actions", () => {
    it("offers to manage the votes and to claim", () => {
      const { headerActions } = getProps(
        votingAccount({ unwithdrawnReward: new BigNumber(ONE_TRX) }),
      );

      expect(headerActions).toEqual([
        expect.objectContaining({ id: "vote", label: "Manage votes" }),
        expect.objectContaining({ id: "claim", disabledReason: undefined }),
      ]);
    });

    it("disables the claim action with a reason when there is nothing to claim", () => {
      const { headerActions } = getProps(votingAccount());

      expect(headerActions?.find(action => action.id === "claim")).toMatchObject({
        disabledReason: "No rewards available",
      });
    });
  });

  describe("footer", () => {
    it("reminds that some votes remain when not all of them are cast", () => {
      const { footer } = getProps(accountWith({ votes: [vote("sr-1", 4)], tronPower: 10 }));

      expect(footer?.title).toBe("You still have votes remaining");
    });

    it("has no footer once every vote is cast", () => {
      expect(getProps(votingAccount()).footer).toBeUndefined();
    });
  });

  describe("discreet mode", () => {
    it("follows the discreet mode setting", () => {
      expect(render(votingAccount(), true)?.discreet).toBe(true);
      expect(render(votingAccount(), false)?.discreet).toBe(false);
    });
  });

  describe("navigation to the staking app", () => {
    const manifest = { id: "stakekit", name: "StakeKit" };

    it.each([
      ["vote", "REVOTE"],
      ["claim", "CLAIM_REWARDS"],
    ] as const)("opens the staking app for the %s action as %s", (actionId, pendingaction) => {
      jest.mocked(useRemoteLiveAppManifest).mockReturnValue(manifest as never);
      const props = getProps(votingAccount());

      act(() => props.onSelectHeaderAction(actionId));

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.PlatformApp, {
        platform: "stakekit",
        name: "StakeKit",
        accountId: "tron-account",
        yieldId: "tron-trx-native-staking",
        pendingaction,
      });
    });

    it("falls back to the local manifest when there is no remote one", () => {
      jest.mocked(useLocalLiveAppManifest).mockReturnValue(manifest as never);
      const props = getProps(votingAccount());

      act(() => props.onSelectHeaderAction("vote"));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("does nothing when the staking app is not available", () => {
      const props = getProps(votingAccount());

      act(() => props.onSelectHeaderAction("vote"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("links and inert callbacks", () => {
    it("opens the explorer on the address of the validator", () => {
      getProps(votingAccount()).onOpenValidator?.("sr-1");

      expect(openURL).toHaveBeenCalledWith(expect.stringContaining("sr-1"));
    });

    it("opens the Tron staking page from the learn more link", () => {
      getProps(votingAccount()).onLearnMore?.();

      expect(openURL).toHaveBeenCalledWith(urls.tronStaking);
    });

    it("keeps the row and start delegating callbacks inert", () => {
      const props = getProps(votingAccount());

      expect(props.onSelectRowAction("sr-1", "any")).toBeUndefined();
      expect(props.onStartDelegating()).toBeUndefined();
    });
  });
});

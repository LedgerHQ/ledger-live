import { Linking } from "react-native";
import BigNumber from "bignumber.js";
import { act, renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useCardanoDelegationsViewModel } from "./useCardanoDelegationsViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const ADA = (value: number) => new BigNumber(value).times(1e6);

const accountWith = (delegation?: Record<string, unknown>): CardanoAccount =>
  ({
    type: "Account",
    id: "cardano-account",
    currency: getCryptoCurrencyById("cardano"),
    balance: ADA(10),
    cardanoResources: { delegation },
  }) as unknown as CardanoAccount;

const delegated = (overrides: Record<string, unknown> = {}) => ({
  poolId: "pool1abcdefghijklmnop",
  name: "Ledger pool",
  status: true,
  rewards: ADA(2),
  dRepHex: "drep",
  ...overrides,
});

const render = (account: CardanoAccount) =>
  renderHook(() => useCardanoDelegationsViewModel(account));

describe("useCardanoDelegationsViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps the pool, its status, the amount and the rewards to a single row", () => {
    const { rows } = render(accountWith(delegated())).result.current.props;

    expect(rows).toHaveLength(1);
    expect(rows[0].validator.name).toBe("Ledger pool");
    expect(rows[0].status?.appearance).toBe("success");
    expect(rows[0].actions.map(({ id }) => id)).toEqual(["redelegate", "undelegate"]);
  });

  it("marks an inactive pool as such", () => {
    const { rows } = render(accountWith(delegated({ status: false }))).result.current.props;

    expect(rows[0].status?.appearance).toBe("error");
  });

  it("shows no row without a delegation", () => {
    expect(render(accountWith(undefined)).result.current.props.rows).toEqual([]);
  });

  it("starts the delegation flow from the empty state", () => {
    const { result } = render(accountWith(undefined));

    act(() => result.current.props.onStartDelegating());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoDelegationFlow, {
      screen: ScreenName.CardanoDelegationStarted,
      params: { accountId: "cardano-account" },
    });
  });

  it("opens the delegation summary to change the delegation", () => {
    const { result } = render(accountWith(delegated()));

    act(() => result.current.props.onSelectRowAction("pool", "redelegate"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoDelegationFlow, {
      screen: ScreenName.CardanoDelegationSummary,
      params: { accountId: "cardano-account" },
    });
  });

  it("opens the undelegation summary with the delegation", () => {
    const delegation = delegated();
    const { result } = render(accountWith(delegation));

    act(() => result.current.props.onSelectRowAction("pool", "undelegate"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoUndelegationFlow, {
      screen: ScreenName.CardanoUndelegationSummary,
      params: { delegation, accountId: "cardano-account" },
    });
  });

  it("opens the self transaction drawer when rewards remain without a DRep delegation", () => {
    const { result } = render(accountWith(delegated({ dRepHex: undefined })));

    act(() => result.current.props.onSelectRowAction("pool", "undelegate"));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.selfTxDrawer.isOpen).toBe(true);

    act(() => result.current.selfTxDrawer.onClose());

    expect(result.current.selfTxDrawer.isOpen).toBe(false);
  });

  it("opens the Cardano staking page from the learn more link", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    render(accountWith(undefined)).result.current.props.onLearnMore?.();

    expect(openURL).toHaveBeenCalledWith(urls.cardanoStaking);
  });
});

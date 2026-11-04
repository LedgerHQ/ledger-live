import BigNumber from "bignumber.js";
import { act, renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import { openURL } from "~/renderer/linking";
import { useCardanoDelegationsViewModel } from "./useCardanoDelegationsViewModel";

const mockDispatch = jest.fn();

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));
jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

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
  ticker: "LDGR",
  name: "Ledger pool",
  rewards: ADA(2),
  dRepHex: "drep",
  ...overrides,
});

const render = (account: CardanoAccount) =>
  renderHook(() => useCardanoDelegationsViewModel(account)).result.current;

describe("useCardanoDelegationsViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps the pool, the amount and the rewards to a single row", () => {
    const { rows } = render(accountWith(delegated()));

    expect(rows).toHaveLength(1);
    expect(rows[0].validator.name).toBe("LDGR - Ledger pool");
    expect(rows[0].cells.amount.value).toContain("10");
    expect(rows[0].cells.rewards.value).toContain("2");
    expect(rows[0].actions.map(({ id }) => id)).toEqual(["redelegate", "undelegate"]);
  });

  it("shows no row without a delegation", () => {
    expect(render(accountWith(undefined)).rows).toEqual([]);
  });

  it("opens the delegate modal to change the delegation", () => {
    const account = accountWith(delegated());
    const { onSelectRowAction } = render(account);

    act(() => onSelectRowAction("pool", "redelegate"));

    expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_CARDANO_DELEGATE", { account }));
  });

  it("opens the undelegate modal", () => {
    const account = accountWith(delegated());

    const { onSelectRowAction } = render(account);

    act(() => onSelectRowAction("pool", "undelegate"));

    expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_CARDANO_UNDELEGATE", { account }));
  });

  it("opens the self transaction info when rewards remain without a DRep delegation", () => {
    const account = accountWith(delegated({ dRepHex: undefined }));

    const { onSelectRowAction } = render(account);

    act(() => onSelectRowAction("pool", "undelegate"));

    expect(mockDispatch).toHaveBeenCalledWith(
      openModal("MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO", { account }),
    );
  });

  it("opens the rewards info modal from the empty state", () => {
    const account = accountWith(undefined);

    const { onStartDelegating } = render(account);

    act(() => onStartDelegating());

    expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_CARDANO_REWARDS_INFO", { account }));
  });

  it("opens the Cardano staking page from the learn more link", () => {
    render(accountWith(undefined)).onLearnMore?.();

    expect(openURL).toHaveBeenCalledWith(urls.cardanoStakingRewards);
  });
});

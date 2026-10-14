import { renderHook, withReadOnlyDisabled } from "@tests/test-renderer";
import useAccountActions from "~/screens/Account/hooks/useAccountActions";
import { makeStacksAccount, makeStakingPosition } from "../__mocks__/account.mock";

// Whether "stacks" is listed in the stakePrograms flag: the value useAccountActions derives
// `canStakeUsingLedgerLive` from and must forward to the family's getMainActions.
let mockStacksInStakePrograms = false;

jest.mock("LLM/hooks/useStake/useStake", () => ({
  useStake: () => ({
    getCanStakeUsingLedgerLive: (currencyId: string) =>
      currencyId === "stacks" && mockStacksInStakePrograms,
    getCanStakeUsingPlatformApp: () => false,
    getRouteParamsForPlatformApp: () => null,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ key: "Account", name: "Account" }),
}));

// The real hook suspends on the lazily loaded bridge, and Stacks' getMainActions never reads it.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({}),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

const mainActionIds = () => {
  const account = makeStacksAccount({}, [makeStakingPosition()]);
  const { result } = renderHook(() => useAccountActions({ account }), {
    overrideInitialState: withReadOnlyDisabled,
  });
  return result.current.mainActions.map(action => action.id);
};

describe("useAccountActions for a Stacks account with a staking position", () => {
  it("offers Unstake when Stacks is listed in stakePrograms", () => {
    mockStacksInStakePrograms = true;

    expect(mainActionIds()).toContain("unstake");
  });

  it("hides Unstake when Stacks isn't listed in stakePrograms", () => {
    mockStacksInStakePrograms = false;

    expect(mainActionIds()).not.toContain("unstake");
  });
});

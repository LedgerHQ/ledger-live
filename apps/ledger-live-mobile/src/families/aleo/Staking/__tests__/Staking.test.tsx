import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor, act, fireEvent, within } from "@tests/test-renderer";
import type { Operation } from "@ledgerhq/types-live";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import type {
  AleoAccount,
  AleoResources,
  AleoValidator,
} from "@ledgerhq/live-common/families/aleo/types";
import { Linking } from "react-native";
import { getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { NavigatorName, ScreenName } from "~/const";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import Staking from "../index";

jest.mock("@ledgerhq/live-common/families/aleo/config", () => ({
  getAleoCurrencyConfigById: jest.fn(),
}));

// Mocked here and not at useAleoValidators, which useAleoStakingPosition calls as a same-module
// closure jest.mock cannot intercept. Virtual because coin-aleo is live-common's dependency,
// not live-mobile's, so it has no type declarations here. `isDelegatorBelowMinimum` is stubbed off rather than reimplemented.
jest.mock(
  "@ledgerhq/coin-aleo/logic",
  () => ({
    getValidators: jest.fn(),
    isDelegatorBelowMinimum: () => false,
  }),
  { virtual: true },
);

type GetValidatorsMock = jest.Mock<Promise<AleoValidator[]>, [string]>;
const mockGetValidators: GetValidatorsMock = (
  jest.requireMock("@ledgerhq/coin-aleo/logic") as { getValidators: GetValidatorsMock }
).getValidators;

/**
 * The wrapper only feeds `paused` to the shared hook, so the test drives the chain tip here and
 * lets the real `getUnbondingDisplayState` turn it into the labels asserted below.
 */
let liveHeight = 0;
jest.mock("../useUnbondingState", () => ({
  useUnbondingState: (
    account: AleoAccount,
    position: { unbondingHeight: number | null; claimableBalance: BigNumber },
  ) =>
    jest.requireActual("@ledgerhq/live-common/families/aleo/utils").getUnbondingDisplayState({
      unbondingHeight: position.unbondingHeight,
      claimableBalance: position.claimableBalance,
      syncedHeight: account.blockHeight,
      currentHeight: liveHeight,
    }),
}));

jest.mock("@ledgerhq/live-common/explorers", () => ({
  getDefaultExplorerView: jest.fn(),
  getAddressExplorer: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const flushValidators = () => act(async () => {});

const mockGetAleoConfig = jest.mocked(getAleoCurrencyConfigById);
const mockGetAddressExplorer = jest.mocked(getAddressExplorer);

const baseAleoResources: AleoResources = {
  transparentBalance: new BigNumber(0),
  provableApi: null,
  privateBalance: null,
  unspentPrivateRecords: null,
  lastPrivateSyncDate: null,
};

const VALIDATOR_ADDRESS = "aleo1validatorqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvalid";

const STAKED_AMOUNT = new BigNumber(20_000_000_000);

// `useAleoValidators` keeps a module-level render seed per currency id, so every account needs
// its own id or it would be handed the previous test's seed instead of loading.
let currencyIdCounter = 0;

function pendingOperation(type: "BOND" | "UNBOND" | "WITHDRAW_UNBONDED"): Operation {
  return { type } as unknown as Operation;
}

function makeAccount(overrides: Partial<AleoAccount> = {}): AleoAccount {
  const account = ALEO_ACCOUNT_1 as AleoAccount;
  return {
    ...account,
    currency: {
      ...account.currency,
      id: `aleo_test_${currencyIdCounter++}` as AleoAccount["currency"]["id"],
    },
    blockHeight: 5000,
    pendingOperations: [],
    aleoResources: { ...baseAleoResources },
    ...overrides,
  };
}

function makeConfig(enableStaking: boolean): ReturnType<typeof getAleoCurrencyConfigById> {
  return { enableStaking } as ReturnType<typeof getAleoCurrencyConfigById>;
}

function makeValidator(overrides: Partial<AleoValidator> = {}): AleoValidator {
  return {
    address: VALIDATOR_ADDRESS,
    name: "Validator One",
    stakeMicrocredits: 0,
    isOpen: true,
    isUnbonding: false,
    commissionPercent: 5,
    estimatedYearlyRewardsRate: 0.07,
    ...overrides,
  };
}

function bondedAccount(
  resources: Partial<AleoResources> = {},
  overrides: Partial<AleoAccount> = {},
): AleoAccount {
  return makeAccount({
    aleoResources: {
      ...baseAleoResources,
      bondedBalance: STAKED_AMOUNT,
      bondedValidator: VALIDATOR_ADDRESS,
      ...resources,
    },
    ...overrides,
  });
}

describe("Staking section", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAleoConfig.mockReturnValue(makeConfig(true));
    mockGetValidators.mockResolvedValue([]);
    liveHeight = 5000;
    mockGetAddressExplorer.mockReturnValue(undefined);
  });

  it("renders nothing when staking is disabled in the currency config", () => {
    mockGetAleoConfig.mockReturnValue(makeConfig(false));

    const { toJSON } = render(<Staking account={makeAccount()} />);

    expect(toJSON()).toBeNull();
  });

  it("shows the empty state and its call to action when there is no position", async () => {
    render(<Staking account={makeAccount()} />);

    expect(screen.getByTestId("aleo-staking-empty-state")).toBeOnTheScreen();
    expect(screen.getByText("You can earn rewards by staking your Aleo.")).toBeOnTheScreen();
    expect(screen.getByText("Earn rewards")).toBeOnTheScreen();
    await flushValidators();
  });

  it("opens the bond flow from the empty state call to action", async () => {
    render(<Staking account={makeAccount()} />);

    fireEvent.press(screen.getByText("Earn rewards"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AleoBondPublicFlow, {
      screen: ScreenName.AleoBondPublicSelectValidator,
      params: { accountId: ALEO_ACCOUNT_1.id },
    });
    await flushValidators();
  });

  it("blocks the empty state call to action while a first bond is pending", async () => {
    render(<Staking account={makeAccount({ pendingOperations: [pendingOperation("BOND")] })} />);

    fireEvent.press(screen.getByText("Earn rewards"));

    expect(mockNavigate).not.toHaveBeenCalled();
    await flushValidators();
  });

  it("says why the empty state call to action is blocked", async () => {
    render(<Staking account={makeAccount({ pendingOperations: [pendingOperation("BOND")] })} />);

    expect(screen.getByTestId("aleo-staking-bond-pending")).toBeOnTheScreen();
    await flushValidators();
  });

  it("leaves the reason off when nothing is pending", async () => {
    render(<Staking account={makeAccount()} />);

    expect(screen.queryByTestId("aleo-staking-bond-pending")).toBeNull();
    await flushValidators();
  });

  it("shows the staked amount and validator label for a bonded position", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByText("Validator One")).toBeOnTheScreen());
    expect(screen.getByTestId("aleo-staked-row-amount")).toHaveTextContent("20,000 ALEO");
    expect(screen.getByTestId("aleo-status-earning")).toBeOnTheScreen();
  });

  it("falls back to the address as the row label when the validator has no name", async () => {
    mockGetValidators.mockResolvedValue([makeValidator({ name: "" })]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByText(VALIDATOR_ADDRESS)).toBeOnTheScreen());
  });

  it("lists the staked and the unstaking positions as separate rows", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = bondedAccount({
      unbondingBalance: new BigNumber(5_000_000),
      unbondingHeight: 10_000,
    });

    render(<Staking account={account} />);

    await waitFor(() => expect(screen.getByTestId("aleo-staked-row")).toBeOnTheScreen());
    expect(screen.getByTestId("aleo-staked-row-amount")).toHaveTextContent("20,000 ALEO");
    expect(screen.getByTestId("aleo-unstaking-row-amount")).toHaveTextContent("5 ALEO");
    expect(screen.getByText("Unstaking")).toBeOnTheScreen();
  });

  it("labels the unstaking row without a validator once the position is fully unbonded", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = makeAccount({
      aleoResources: {
        ...baseAleoResources,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 10_000,
      },
    });

    render(<Staking account={account} />);

    await waitFor(() =>
      expect(within(screen.getByTestId("aleo-unstaking-row")).getByText("Aleo")).toBeOnTheScreen(),
    );
    expect(screen.getByTestId("aleo-unstaking-row-amount")).toHaveTextContent("5 ALEO");
  });

  it.each([
    [
      "fullCommission",
      { nonEarningReason: "fullCommission" as const },
      "This validator takes 100% commission, so you keep nothing.",
    ],
    [
      "overConcentrated",
      { nonEarningReason: "overConcentrated" as const },
      "This validator holds more than 25% of all staked ALEO. The protocol pays it nothing above that cap, so you earn nothing.",
    ],
  ])("warns that the position earns nothing: %s", async (_name, validatorOverrides, message) => {
    mockGetValidators.mockResolvedValue([makeValidator(validatorOverrides)]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByTestId("aleo-status-non-earning")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-status")).toHaveTextContent(message);
  });

  it("warns that the validator left the committee", async () => {
    mockGetValidators.mockResolvedValue([makeValidator({ address: "aleo1other" })]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByTestId("aleo-status-non-earning")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-status")).toHaveTextContent(
      "This validator is no longer in the committee, so your stake earns nothing. Unstake and bond to another validator to start earning again.",
    );
  });

  it("labels the unbonding entry as pending while an unbond is in flight", async () => {
    const account = bondedAccount(
      { unbondingBalance: new BigNumber(5_000_000), unbondingHeight: 10_000 },
      { pendingOperations: [pendingOperation("UNBOND")] },
    );

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("Unstaking...");
    await flushValidators();
  });

  it("labels the unbonding entry as claimable once the synced height reached it", async () => {
    const account = bondedAccount(
      { unbondingBalance: new BigNumber(5_000_000), unbondingHeight: 10_000 },
      { blockHeight: 10_000 },
    );

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("Claimable");

    fireEvent.press(screen.getByTestId("aleo-unstaking-row"));
    expect(await screen.findByTestId("aleo-unstaking-claimable")).toHaveTextContent("5 ALEO");
  });

  it("renders the block countdown while the unbonding period is running", async () => {
    liveHeight = 9_950;
    const account = makeAccount({
      blockHeight: 9_900,
      aleoResources: {
        ...baseAleoResources,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 10_000,
      },
    });

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("~50 blocks left");
    await flushValidators();
  });

  it("tops up the existing stake from the manage drawer bond action", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByText("Validator One")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    fireEvent.press(await screen.findByText("Bond"));
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AleoBondPublicFlow, {
      screen: ScreenName.AleoBondPublicSelectValidator,
      params: { accountId: ALEO_ACCOUNT_1.id },
    });
  });

  it("details the validator, its rate and status in the staked drawer", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByText("Validator One")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-validator")).toHaveTextContent("Validator One");
    expect(screen.getByTestId("aleo-manage-validator-address")).toHaveTextContent(
      "aleo1val...qqqvalid",
    );
    expect(screen.getByTestId("aleo-manage-rate")).toHaveTextContent("7.0% est.");
    expect(screen.getByTestId("aleo-manage-status")).toHaveTextContent("Earning rewards");
  });

  it("opens the explorer from the validator address in the staked drawer", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    mockGetAddressExplorer.mockReturnValue("https://explorer.test/aleo1validator");
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByText("Validator One")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    fireEvent.press(await screen.findByTestId("aleo-manage-validator-address"));
    expect(openURL).toHaveBeenCalledWith("https://explorer.test/aleo1validator");
  });

  it("details the unbonding amount, its status and unlock block in the unstaking drawer", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    liveHeight = 9_950;
    const account = bondedAccount(
      { unbondingBalance: new BigNumber(5_000_000), unbondingHeight: 10_000 },
      { blockHeight: 9_900 },
    );

    render(<Staking account={account} />);

    fireEvent.press(screen.getByTestId("aleo-unstaking-row"));

    expect(await screen.findByTestId("aleo-unstaking-status")).toHaveTextContent("~50 blocks left");
    expect(screen.getByTestId("aleo-unstaking-unlock-block")).toHaveTextContent("10000");
    expect(screen.queryByTestId("aleo-unstaking-claimable")).toBeNull();
  });

  it("explains why unbonding is unavailable while an unbond is in flight", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = bondedAccount(
      { unbondingBalance: new BigNumber(5_000_000) },
      { pendingOperations: [pendingOperation("UNBOND")] },
    );

    render(<Staking account={account} />);

    await waitFor(() => expect(screen.getByTestId("aleo-staked-row")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-pending-info")).toHaveTextContent(
      "An unstake is waiting to be confirmed. Aleo tracks one unbonding position at a time, so unbonding and claiming are both unavailable until it has gone through.",
    );
  });

  it("explains why claiming is unavailable while a claim is in flight", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = bondedAccount(
      { unbondingBalance: new BigNumber(5_000_000) },
      { pendingOperations: [pendingOperation("WITHDRAW_UNBONDED")] },
    );

    render(<Staking account={account} />);

    await waitFor(() => expect(screen.getByTestId("aleo-staked-row")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-pending-info")).toHaveTextContent(
      "A claim is waiting to be confirmed. Aleo tracks one unbonding position at a time, so unbonding and claiming are both unavailable until it has gone through.",
    );
  });

  it("shows every decimal of the staked and claimable amounts", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = bondedAccount({
      bondedBalance: new BigNumber(20_000_912_345),
      unbondingBalance: new BigNumber(5_123_456),
      unbondingHeight: 5_000,
    });

    render(<Staking account={account} />);

    await waitFor(() => expect(screen.getAllByText("Validator One")).toHaveLength(1));
    expect(screen.getByTestId("aleo-staked-row-amount")).toHaveTextContent("20,000.912345 ALEO");
    expect(screen.getByTestId("aleo-unstaking-row-amount")).toHaveTextContent("5.123456 ALEO");

    fireEvent.press(screen.getByTestId("aleo-unstaking-row"));
    expect(await screen.findByTestId("aleo-unstaking-claimable")).toHaveTextContent(
      "5.123456 ALEO",
    );
  });

  it("skeletons the validator label and earning status while the validator list loads", async () => {
    let resolveValidators: (validators: AleoValidator[]) => void = () => {};
    mockGetValidators.mockReturnValue(
      new Promise<AleoValidator[]>(resolve => {
        resolveValidators = resolve;
      }),
    );

    render(<Staking account={bondedAccount()} />);

    expect(screen.queryByText(VALIDATOR_ADDRESS)).toBeNull();
    expect(screen.queryByTestId("aleo-status-earning")).toBeNull();

    await act(async () => resolveValidators([makeValidator()]));
    expect(await screen.findByText("Validator One")).toBeOnTheScreen();
    expect(screen.getByTestId("aleo-status-earning")).toBeOnTheScreen();
  });

  it("claims no earning status when the validator list fails to load", async () => {
    mockGetValidators.mockRejectedValue(new Error("network down"));

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByTestId("aleo-status-unverified")).toBeOnTheScreen());
    expect(screen.queryByTestId("aleo-status-earning")).toBeNull();
    expect(screen.queryByTestId("aleo-status-non-earning")).toBeNull();

    fireEvent.press(screen.getByTestId("aleo-staked-row"));
    expect(await screen.findByTestId("aleo-manage-status")).toHaveTextContent("Status unavailable");
  });

  it("renders the settling label once the live height passed but the sync has not", async () => {
    liveHeight = 10_010;
    const account = makeAccount({
      blockHeight: 9_990,
      aleoResources: {
        ...baseAleoResources,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 10_000,
      },
    });

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("Almost there...");
    await flushValidators();
  });
});

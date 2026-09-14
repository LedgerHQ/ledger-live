import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor, act, fireEvent, within } from "@tests/test-renderer";
import type { Operation } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type {
  AleoAccount,
  AleoResources,
  AleoValidator,
} from "@ledgerhq/live-common/families/aleo/types";
import { Linking } from "react-native";
import { getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { NavigatorName, ScreenName } from "~/const";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { useAleoLiveBlockHeight } from "../../hooks/useAleoLiveBlockHeight";
import Staking from "../index";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

// useStakingPosition resolves the validator committee through useAleoValidators, which reads it
// from the coin module's getValidators — mocking it here (rather than useAleoValidators itself,
// which useStakingPosition calls as a same-module closure jest.mock cannot intercept) is what
// actually reaches useStakingPosition's real code path. `coin-aleo` is not one of live-mobile's
// own dependencies (only live-common's), so it has no type declarations here either: the module
// is mocked virtually, and the mock fn is read back via requireMock instead of being imported.
jest.mock(
  "@ledgerhq/coin-aleo/logic",
  () => {
    const { MIN_DELEGATOR_STAKE_MICROCREDITS } = jest.requireActual(
      "@ledgerhq/live-common/families/aleo/constants",
    );
    return {
      getValidators: jest.fn(),
      isDelegatorBelowMinimum: (stake: BigNumber) =>
        stake.isLessThan(MIN_DELEGATOR_STAKE_MICROCREDITS),
    };
  },
  { virtual: true },
);

type GetValidatorsMock = jest.Mock<Promise<AleoValidator[]>, [string]>;
const mockGetValidators: GetValidatorsMock = (
  jest.requireMock("@ledgerhq/coin-aleo/logic") as { getValidators: GetValidatorsMock }
).getValidators;

jest.mock("../../hooks/useAleoLiveBlockHeight", () => ({
  useAleoLiveBlockHeight: jest.fn(),
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

const mockGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);
const mockUseAleoLiveBlockHeight = jest.mocked(useAleoLiveBlockHeight);
const mockGetAddressExplorer = jest.mocked(getAddressExplorer);

const baseAleoResources: AleoResources = {
  transparentBalance: new BigNumber(0),
  provableApi: null,
  privateBalance: null,
  unspentPrivateRecords: null,
  lastPrivateSyncDate: null,
};

const VALIDATOR_ADDRESS = "aleo1validatorqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvalid";

/** Above MIN_DELEGATOR_STAKE_MICROCREDITS, so the position earns unless something else stops it. */
const STAKED_ABOVE_MINIMUM = new BigNumber(20_000_000_000);

function pendingOperation(type: "UNBOND" | "WITHDRAW_UNBONDED"): Operation {
  return { type } as unknown as Operation;
}

function makeAccount(overrides: Partial<AleoAccount> = {}): AleoAccount {
  return {
    ...(ALEO_ACCOUNT_1 as AleoAccount),
    blockHeight: 5000,
    pendingOperations: [],
    aleoResources: { ...baseAleoResources },
    ...overrides,
  };
}

function makeConfig(enableStaking: boolean): ReturnType<typeof getCurrencyConfiguration> {
  return {
    status: { type: "active" },
    networkType: "mainnet",
    enableStaking,
  } as ReturnType<typeof getCurrencyConfiguration>;
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

function bondedAccount(resources: Partial<AleoResources> = {}): AleoAccount {
  return makeAccount({
    aleoResources: {
      ...baseAleoResources,
      bondedBalance: STAKED_ABOVE_MINIMUM,
      bondedValidator: VALIDATOR_ADDRESS,
      ...resources,
    },
  });
}

describe("Staking section", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrencyConfiguration.mockReturnValue(makeConfig(true));
    mockGetValidators.mockResolvedValue([]);
    mockUseAleoLiveBlockHeight.mockReturnValue(5000);
    mockGetAddressExplorer.mockReturnValue(undefined);
  });

  it("renders nothing when staking is disabled in the currency config", () => {
    mockGetCurrencyConfiguration.mockReturnValue(makeConfig(false));

    const { toJSON } = render(<Staking account={makeAccount()} />);

    expect(toJSON()).toBeNull();
  });

  it("shows the empty state and its call to action when there is no position", async () => {
    render(<Staking account={makeAccount()} />);

    expect(screen.getByTestId("aleo-staking-empty-state")).toBeOnTheScreen();
    expect(screen.getByText("You can earn rewards by staking your Aleo.")).toBeOnTheScreen();
    expect(screen.getByText("Earn rewards")).toBeOnTheScreen();
    await act(async () => {});
  });

  it("opens the bond flow from the empty state call to action", async () => {
    render(<Staking account={makeAccount()} />);

    fireEvent.press(screen.getByText("Earn rewards"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AleoBondPublicFlow, {
      screen: ScreenName.AleoBondPublicSelectValidator,
      params: { accountId: ALEO_ACCOUNT_1.id },
    });
    await act(async () => {});
  });

  it("shows the staked amount and validator label for a bonded position", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = makeAccount({
      aleoResources: {
        ...baseAleoResources,
        bondedBalance: STAKED_ABOVE_MINIMUM,
        bondedValidator: VALIDATOR_ADDRESS,
      },
    });

    render(<Staking account={account} />);

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

    await waitFor(() => expect(screen.getByTestId("aleo-unstaking-row")).toBeOnTheScreen());
    expect(
      within(screen.getByTestId("aleo-unstaking-row")).getByText("Unstaking"),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Unknown validator")).toBeNull();
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

  it("warns that the own stake is below the delegator minimum", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = bondedAccount({ bondedBalance: new BigNumber(9_999_999_999) });

    render(<Staking account={account} />);

    await waitFor(() => expect(screen.getByTestId("aleo-status-non-earning")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-status")).toHaveTextContent(
      "Your stake is below the 10,000 ALEO minimum, so it earns nothing. Add to it to start earning again.",
    );
  });

  it("labels the unbonding entry as pending while an unbond is in flight", async () => {
    const account = makeAccount({
      pendingOperations: [pendingOperation("UNBOND")],
      aleoResources: {
        ...baseAleoResources,
        bondedBalance: STAKED_ABOVE_MINIMUM,
        bondedValidator: VALIDATOR_ADDRESS,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 10_000,
      },
    });

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("Unstaking\u2026");
    await act(async () => {});
  });

  it("labels the unbonding entry as claimable once the synced height reached it", async () => {
    const account = makeAccount({
      blockHeight: 10_000,
      aleoResources: {
        ...baseAleoResources,
        bondedBalance: STAKED_ABOVE_MINIMUM,
        bondedValidator: VALIDATOR_ADDRESS,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 10_000,
      },
    });

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("Claimable");

    fireEvent.press(screen.getByTestId("aleo-unstaking-row"));
    expect(await screen.findByTestId("aleo-unstaking-claimable")).toHaveTextContent("5 ALEO");

    fireEvent.press(screen.getByText("Claim"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders the block countdown while the unbonding period is running", async () => {
    mockUseAleoLiveBlockHeight.mockReturnValue(9_950);
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
    await act(async () => {});
  });

  it("keeps the unbond action inert until the unbond flow lands", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);

    render(<Staking account={bondedAccount()} />);

    await waitFor(() => expect(screen.getByText("Validator One")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    fireEvent.press(await screen.findByText("Unbond"));
    expect(mockNavigate).not.toHaveBeenCalled();
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
    mockUseAleoLiveBlockHeight.mockReturnValue(9_950);
    const account = bondedAccount({
      unbondingBalance: new BigNumber(5_000_000),
      unbondingHeight: 10_000,
    });
    account.blockHeight = 9_900;

    render(<Staking account={account} />);

    fireEvent.press(screen.getByTestId("aleo-unstaking-row"));

    expect(await screen.findByTestId("aleo-unstaking-status")).toHaveTextContent("~50 blocks left");
    expect(screen.getByTestId("aleo-unstaking-unlock-block")).toHaveTextContent("10000");
    expect(screen.queryByTestId("aleo-unstaking-claimable")).toBeNull();
  });

  it("explains why unbonding is unavailable while an unbond is in flight", async () => {
    mockGetValidators.mockResolvedValue([makeValidator()]);
    const account = bondedAccount({ unbondingBalance: new BigNumber(5_000_000) });
    account.pendingOperations = [pendingOperation("UNBOND")];

    render(<Staking account={account} />);

    await waitFor(() => expect(screen.getByTestId("aleo-staked-row")).toBeOnTheScreen());
    fireEvent.press(screen.getByTestId("aleo-staked-row"));

    expect(await screen.findByTestId("aleo-manage-pending-info")).toHaveTextContent(
      "An unstake is waiting to be confirmed. Aleo tracks one unbonding position at a time, so unbonding and claiming are both unavailable until it has gone through.",
    );
  });

  it("renders the settling label once the live height passed but the sync has not", async () => {
    mockUseAleoLiveBlockHeight.mockReturnValue(10_010);
    const account = makeAccount({
      blockHeight: 9_990,
      aleoResources: {
        ...baseAleoResources,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 10_000,
      },
    });

    render(<Staking account={account} />);

    expect(screen.getByTestId("aleo-unstaking-row-sub")).toHaveTextContent("Almost there\u2026");
    await act(async () => {});
  });
});

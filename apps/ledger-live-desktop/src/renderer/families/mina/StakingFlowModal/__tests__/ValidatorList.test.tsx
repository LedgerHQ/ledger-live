import React from "react";
import { render, screen, within } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import ValidatorList from "../components/ValidatorList";
import {
  createMockMinaAccount,
  createMockTransaction,
  mockValidators,
} from "../../__tests__/testUtils";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedOpenURL = jest.mocked(openURL);

describe("ValidatorList", () => {
  const defaultProps = {
    account: createMockMinaAccount(),
    transaction: createMockTransaction(),
    onUpdateTransaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the validator list container", () => {
    render(<ValidatorList {...defaultProps} />);

    expect(screen.getByTestId("validator-list")).toBeInTheDocument();
  });

  it("displays default 4 validators initially", () => {
    render(<ValidatorList {...defaultProps} />);

    const validatorList = screen.getByTestId("validator-list");
    const validatorNames = mockValidators.slice(0, 4).map(v => v.name);

    validatorNames.forEach(name => {
      expect(within(validatorList).getByText(name)).toBeInTheDocument();
    });
  });

  it("renders show all button", () => {
    render(<ValidatorList {...defaultProps} />);

    expect(screen.getByText("Show all")).toBeInTheDocument();
  });

  it("shows all validators when show all is clicked", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    await user.click(screen.getByText("Show all"));

    expect(screen.getByText("Show less")).toBeInTheDocument();

    mockValidators.forEach(validator => {
      expect(screen.getByText(validator.name)).toBeInTheDocument();
    });
  });

  it("collapses back to default when show less is clicked", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    await user.click(screen.getByText("Show all"));
    expect(screen.getByText("Show less")).toBeInTheDocument();

    await user.click(screen.getByText("Show less"));
    expect(screen.getByText("Show all")).toBeInTheDocument();
  });

  it.each(["{Enter}", " "])("toggles the full list with the %s key", async key => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    screen.getByRole("button", { name: "Show all" }).focus();
    await user.keyboard(key);

    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it("ignores other keys on the show-all toggle", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    screen.getByRole("button", { name: "Show all" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByText("Show all")).toBeInTheDocument();
  });

  it("stages the selected validator as a stake transaction", async () => {
    const onUpdateTransaction = jest.fn();
    const { user } = render(
      <ValidatorList {...defaultProps} onUpdateTransaction={onUpdateTransaction} />,
    );

    await user.click(screen.getAllByTestId("modal-provider-row")[0]);

    expect(onUpdateTransaction).toHaveBeenCalledTimes(1);
    const updater = onUpdateTransaction.mock.calls[0][0];
    expect(updater(createMockTransaction())).toMatchObject({
      recipient: mockValidators[0].address,
      txType: "stake",
    });
  });

  it("opens the explorer when the validator title is clicked", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    await user.click(screen.getAllByTestId("modal-provider-title")[0]);

    expect(mockedOpenURL).toHaveBeenCalledTimes(1);
    expect(mockedOpenURL.mock.calls[0][0]).toContain(mockValidators[0].address);
  });

  it("displays validator stake and commission labels", () => {
    render(<ValidatorList {...defaultProps} />);

    expect(screen.getAllByText("Total Stake").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Commission").length).toBeGreaterThan(0);
  });

  it("includes the currently selected validator in default view", () => {
    const transaction = createMockTransaction({
      recipient: mockValidators[4].address,
    });

    render(<ValidatorList {...defaultProps} transaction={transaction} />);

    expect(screen.getByText(mockValidators[4].name)).toBeInTheDocument();
  });

  it("filters validators by search input", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    await user.click(screen.getByText("Show all"));

    const searchInput = screen.getByRole("textbox");
    await user.type(searchInput, "Alpha");

    expect(screen.getByText("Validator Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Validator Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("Validator Gamma")).not.toBeInTheDocument();
  });

  it("filters validators by address", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    await user.click(screen.getByText("Show all"));

    const searchInput = screen.getByRole("textbox");
    await user.type(searchInput, mockValidators[1].address.slice(0, 10));

    expect(screen.getByText(mockValidators[1].name)).toBeInTheDocument();
  });

  it("shows no validators when search has no matches", async () => {
    const { user } = render(<ValidatorList {...defaultProps} />);

    const searchInput = screen.getByRole("textbox");
    await user.type(searchInput, "nonexistentvalidator");

    const validatorList = screen.getByTestId("validator-list");
    mockValidators.forEach(v => {
      expect(within(validatorList).queryByText(v.name)).not.toBeInTheDocument();
    });
  });

  it("renders with empty block producers gracefully", () => {
    const account = createMockMinaAccount({
      resources: {
        blockProducers: [],
        stakingActive: false,
        delegateInfo: undefined,
        epochInfo: {
          epoch: "50",
          slot: "100",
          globalSlot: "5000",
          startTime: "2024-01-01T00:00:00Z",
          endTime: "2024-01-15T00:00:00Z",
        },
      },
    });

    render(<ValidatorList {...defaultProps} account={account} />);

    expect(screen.getByTestId("validator-list")).toBeInTheDocument();
  });
});

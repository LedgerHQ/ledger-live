import React from "react";
import { render, screen } from "tests/testSetup";
import ContextMenu from "./ContextMenu";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import BigNumber from "bignumber.js";
import { openModal } from "~/renderer/actions/modals";

// Mock the openModal action
jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn().mockReturnValue({ type: "OPEN_MODAL" }),
}));

// Mock DropDownSelector to render items simply for testing
jest.mock("~/renderer/components/DropDownSelector", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockDropDown = ({ children, items, renderItem }: any) => {
    return (
      <div>
        {children && children({})}
        <div data-testid="dropdown-items">
          {items.map((item: { key: string; onClick: () => void; label: string }, index: number) => (
            <div key={item.key || index}>
              {renderItem ? renderItem({ item }) : <div onClick={item.onClick}>{item.label}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockDropDownItem = ({ children, onClick }: any) => (
    <div onClick={onClick} data-testid="dropdown-item">
      {children}
    </div>
  );
  return {
    __esModule: true,
    default: MockDropDown,
    DropDownItem: MockDropDownItem,
  };
});

const mockAccountBase = {
  id: "test-account-id",
  currency: { id: "cardano", name: "Cardano", ticker: "ADA" },
  cardanoResources: {
    delegation: {
      rewards: new BigNumber(0),
      dRepHex: undefined,
    },
  },
} as unknown as CardanoAccount;

describe("Cardano ContextMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (accountOverrides = {}) => {
    const account = {
      ...mockAccountBase,
      cardanoResources: {
        ...mockAccountBase.cardanoResources,
        ...accountOverrides,
      },
    } as unknown as CardanoAccount;

    return render(<ContextMenu account={account} />);
  };

  it("renders the context menu trigger", () => {
    setup();
    const trigger = screen.getByTestId("delegation-context-menu-button");
    expect(trigger).toBeVisible();
  });

  it("opens menu and handles Redelegate action", async () => {
    const { user } = setup();
    // In our mock, items are always rendered, so we can click directly

    const redelegateButton = screen.getByTestId("delegation-redelegate-button");
    expect(redelegateButton).toBeVisible();

    await user.click(redelegateButton);

    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_DELEGATE", {
      account: expect.objectContaining({ id: "test-account-id" }),
    });
  });

  it("opens menu and handles Stop Delegation action (Standard)", async () => {
    const { user } = setup({
      delegation: {
        rewards: new BigNumber(0), // No rewards
        dRepHex: undefined,
      },
    });

    const stopButton = screen.getByTestId("delegation-undelegate-button");
    expect(stopButton).toBeVisible();

    await user.click(stopButton);

    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_UNDELEGATE", {
      account: expect.objectContaining({ id: "test-account-id" }),
    });
  });

  it("opens menu and handles Stop Delegation action (Self Tx Info) when rewards > 0 and no DRep", async () => {
    const { user } = setup({
      delegation: {
        rewards: new BigNumber(100),
        dRepHex: undefined,
      },
    });

    const stopButton = screen.getByTestId("delegation-undelegate-button");
    await user.click(stopButton);

    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO", {
      account: expect.objectContaining({ id: "test-account-id" }),
    });
  });

  it("opens menu and handles Stop Delegation action (Standard) when rewards > 0 but has DRep", async () => {
    const { user } = setup({
      delegation: {
        rewards: new BigNumber(100),
        dRepHex: "some-drep-hex",
      },
    });

    const stopButton = screen.getByTestId("delegation-undelegate-button");
    await user.click(stopButton);

    expect(openModal).toHaveBeenCalledWith("MODAL_CARDANO_UNDELEGATE", {
      account: expect.objectContaining({ id: "test-account-id" }),
    });
  });
});

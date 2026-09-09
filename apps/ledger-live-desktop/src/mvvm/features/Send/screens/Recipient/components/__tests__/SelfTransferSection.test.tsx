/**
 * @jest-environment jsdom
 */
import React from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { render, screen } from "tests/testSetup";
import { createMockAccount } from "../../__integrations__/__fixtures__/accounts";
import { SelfTransferSection } from "../SelfTransferSection";

const mockGoToNextStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(() => ({ navigation: { goToNextStep: mockGoToNextStep } })),
}));

const mockSetRecipient = jest.fn();
const mockAccount = createMockAccount({ id: "zcash-acc" });

let mockRecipient: { address?: string; ensName?: string } | null = {
  address: "0xresolved",
  ensName: "alice.eth",
};

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({
    state: {
      account: { account: mockAccount },
      transaction: { transaction: { family: "zcash" } },
      recipient: mockRecipient,
    },
  })),
  useSendFlowActions: jest.fn(() => ({
    transaction: { setRecipient: mockSetRecipient },
  })),
}));

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));

const mockedGetBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);

describe("SelfTransferSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecipient = { address: "0xresolved", ensName: "alice.eth" };
    mockedGetBalanceTypeConfig.mockReturnValue({
      getOptions: jest.fn(),
      getSelectedOptionId: jest.fn(),
      buildSelectionPatch: jest.fn(),
      getSelfTransferTarget: jest.fn(() => ({
        address: "zs1pooladdress",
        translationKey: "recipient.selfTransfer.toPrivate",
        isDestinationPublic: false,
      })),
    });
  });

  it("should clear ensName when prefilling the self-transfer recipient", async () => {
    const { user } = render(<SelfTransferSection />);

    await user.click(screen.getByTestId("self-transfer-button"));

    expect(mockSetRecipient).toHaveBeenCalledWith({
      address: "zs1pooladdress",
      ensName: undefined,
      displayLabel: "Private balance",
    });
    expect(mockGoToNextStep).toHaveBeenCalled();
  });
});

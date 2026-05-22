/**
 * @jest-environment jsdom
 */
import {
  createEthereumAccount,
  renderSendFlow,
  resetSendFlowTestState,
  screen,
  setMockBridgeRecipientValidation,
  setMockSanctioned,
} from "../__mocks__/sendFlowTestUtils";

const SANCTIONED_ETHEREUM = "0x7F367cC41522cE07553e823bf3be79A889DEbe1B";
const NON_SANCTIONED_ETHEREUM = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

describe("Recipient sanctioned-address banners", () => {
  beforeEach(() => {
    resetSendFlowTestState("evm");
  });

  it("shows the sanctioned banner when the recipient address is flagged", async () => {
    setMockSanctioned(address => address === SANCTIONED_ETHEREUM);

    const { user } = renderSendFlow(createEthereumAccount());

    const recipientInput = await screen.findByTestId("send-recipient-input");
    await user.type(recipientInput, SANCTIONED_ETHEREUM);

    expect(
      await screen.findByTestId("sanctioned-address-banner", {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(screen.getByTestId("send-matched-address-button")).toHaveClass("cursor-not-allowed");
  });

  it("does not show the sanctioned banner for a clean recipient address", async () => {
    const { user } = renderSendFlow(createEthereumAccount());

    const recipientInput = await screen.findByTestId("send-recipient-input");
    await user.type(recipientInput, NON_SANCTIONED_ETHEREUM);

    expect(await screen.findByTestId("send-matched-address-button")).toBeVisible();
    expect(screen.queryByTestId("sanctioned-address-banner")).not.toBeInTheDocument();
  });

  it("shows the sender error banner when the bridge reports a sender sanction", async () => {
    setMockBridgeRecipientValidation({
      errors: { sender: new Error("Sender is sanctioned") },
      warnings: {},
      isLoading: false,
    });

    const { user } = renderSendFlow(createEthereumAccount());

    const recipientInput = await screen.findByTestId("send-recipient-input");
    await user.type(recipientInput, NON_SANCTIONED_ETHEREUM);

    expect(await screen.findByTestId("sender-error-banner")).toBeVisible();
  });
});

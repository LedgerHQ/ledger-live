/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { createMockAccount } from "../../__tests__/testUtils";
import { createMockDevice } from "../../OnboardModal/__tests__/testUtils";
import PendingTransferProposals from "../index";

const mockPerformTransferInstruction = jest.fn().mockResolvedValue(undefined);
const mockSync = jest.fn();

jest.mock("@ledgerhq/live-common/families/canton/react", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-common/families/canton/react")>(
    "@ledgerhq/live-common/families/canton/react",
  ),
  useCantonAcceptOrRejectOffer: () => mockPerformTransferInstruction,
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockSync,
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: (props: {
    onResult?: (r: { device: { deviceId: string; wired: boolean } }) => void;
  }) => (
    <button
      type="button"
      data-testid="canton-offers-mock-device-confirm"
      onClick={() => props.onResult?.({ device: { deviceId: "ledger-test-device", wired: false } })}
    >
      Mock device confirm
    </button>
  ),
}));

const createAccountWithProposal = (
  contractId: string,
  sender: string,
  receiver: string,
  overrides?: Partial<CantonAccount["cantonResources"]["pendingTransferProposals"][0]>,
) =>
  createMockAccount({
    xpub: "test-xpub",
    cantonResources: {
      isOnboarded: true,
      instrumentUtxoCounts: {},
      pendingTransferProposals: [
        {
          contract_id: contractId,
          sender,
          receiver,
          amount: "1000000",
          instrument_id: "instrument-1",
          instrument_admin: "",
          memo: "Test memo",
          expires_at_micros: Date.now() * 1000 + 3600000000,
          ...overrides,
        },
      ],
    },
  } as Partial<CantonAccount>);

describe("Canton pending offers integration (desktop)", () => {
  const mockDevice = createMockDevice({ deviceId: "device-1" });

  const buildInitialState = (overrides: Partial<State> = {}): Partial<State> => ({
    settings: { ...SETTINGS_INITIAL_STATE },
    devices: {
      currentDevice: mockDevice,
      devices: [mockDevice],
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformTransferInstruction.mockResolvedValue(undefined);
    if (!document.getElementById("modals")) {
      const modalsContainer = document.createElement("div");
      modalsContainer.id = "modals";
      document.body.appendChild(modalsContainer);
    }
  });

  afterEach(() => {
    const modalsContainer = document.getElementById("modals");
    if (modalsContainer?.parentNode) {
      modalsContainer.parentNode.removeChild(modalsContainer);
    }
  });

  it("accepts an incoming offer as recipient (Accept → device)", async () => {
    const account = createAccountWithProposal("contract-accept-1", "other-party-xpub", "test-xpub");

    const { user } = render(
      <PendingTransferProposals account={account} parentAccount={account} />,
      {
        initialState: buildInitialState(),
      },
    );

    await user.click(screen.getByRole("button", { name: /accept/i }));
    expect(await screen.findByTestId("modal-container")).toBeVisible();

    await user.click(screen.getByTestId("canton-offers-mock-device-confirm"));

    // Perform + sync in one waitFor: sync runs only after perform's promise resolves.
    await waitFor(() => {
      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-accept-1", deviceId: "ledger-test-device", reason: "" },
        "accept-transfer-instruction",
      );
      expect(mockSync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          reason: "canton-pending-transaction-action",
        }),
      );
    });
    expect(await screen.findByText("Offer Accepted")).toBeVisible();
    expect(
      await screen.findByText("The transfer offer has been successfully accepted."),
    ).toBeVisible();
  });

  it("rejects an incoming offer as recipient (Reject → device)", async () => {
    const account = createAccountWithProposal("contract-reject-1", "other-party-xpub", "test-xpub");

    const { user } = render(
      <PendingTransferProposals account={account} parentAccount={account} />,
      {
        initialState: buildInitialState(),
      },
    );

    await user.click(screen.getByRole("button", { name: /reject/i }));
    expect(await screen.findByTestId("modal-container")).toBeVisible();

    await user.click(screen.getByTestId("canton-offers-mock-device-confirm"));

    await waitFor(() => {
      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-reject-1", deviceId: "ledger-test-device", reason: "" },
        "reject-transfer-instruction",
      );
      expect(mockSync).toHaveBeenCalled();
    });
    expect(await screen.findByText("Offer Rejected")).toBeVisible();
    expect(
      await screen.findByText("The transfer offer has been successfully rejected."),
    ).toBeVisible();
  });

  it("cancels an outgoing offer as sender (Cancel → device)", async () => {
    const account = createAccountWithProposal(
      "contract-withdraw-1",
      "test-xpub",
      "receiver-party-xpub",
    );

    const { user } = render(
      <PendingTransferProposals account={account} parentAccount={account} />,
      {
        initialState: buildInitialState(),
      },
    );

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(await screen.findByTestId("modal-container")).toBeVisible();

    await user.click(screen.getByTestId("canton-offers-mock-device-confirm"));

    await waitFor(() => {
      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-withdraw-1", deviceId: "ledger-test-device", reason: "" },
        "withdraw-transfer-instruction",
      );
      expect(mockSync).toHaveBeenCalled();
    });
    expect(await screen.findByText("Offer Withdrawn")).toBeVisible();
    expect(
      await screen.findByText("The transfer offer has been successfully withdrawn."),
    ).toBeVisible();
  });
});

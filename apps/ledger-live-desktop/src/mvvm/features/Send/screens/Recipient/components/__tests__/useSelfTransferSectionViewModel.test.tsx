/**
 * @jest-environment jsdom
 */
import React, { forwardRef, useImperativeHandle } from "react";
import { render, cleanup } from "tests/testSetup";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import { useSelfTransferSectionViewModel } from "../useSelfTransferSectionViewModel";

const mockGoToNextStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(() => ({ navigation: { goToNextStep: mockGoToNextStep } })),
}));

const mockSetRecipient = jest.fn();

type MockState = {
  account: { account: { id: string; type: string; currency: unknown } | null };
  transaction: { transaction: { id: string; sender?: string } | null };
  recipient: { address: string; memo?: { value: string } } | null;
};

let mockState: MockState;

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({ state: mockState })),
  useSendFlowActions: jest.fn(() => ({
    transaction: { setRecipient: mockSetRecipient },
  })),
}));

// The send descriptor is the only source of the destination pool; the view model must
// never derive it from a coin-module.
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));

const mockedGetBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);

const SHIELDED_TARGET: BalanceTypeSelfTransferTarget = {
  address: "u1shielded",
  translationKey: "recipient.selfTransfer.toPrivate",
  isDestinationPublic: false,
};

function stubBalanceTypeConfig(target: BalanceTypeSelfTransferTarget | null) {
  mockedGetBalanceTypeConfig.mockReturnValue({
    getOptions: jest.fn(() => []),
    getSelectedOptionId: jest.fn(() => null),
    buildSelectionPatch: jest.fn(() => ({})),
    getSelfTransferTarget: jest.fn(() => target),
    buildSelfTransferPatch: jest.fn(() => ({})),
    getSelectableBalance: jest.fn(),
  });
}

type HookApi = ReturnType<typeof useSelfTransferSectionViewModel>;
const Harness = forwardRef<{ api: HookApi }>(function Harness(_props, ref) {
  const api = useSelfTransferSectionViewModel();
  useImperativeHandle(ref, () => ({ api }));
  return null;
});

function renderViewModel(): HookApi {
  const ref = React.createRef<{ api: HookApi }>();
  render(<Harness ref={ref} />);
  return ref.current?.api ?? null;
}

describe("useSelfTransferSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubBalanceTypeConfig(SHIELDED_TARGET);

    mockState = {
      account: { account: { id: "zcash-acc", type: "Account", currency: { id: "zcash" } } },
      transaction: { transaction: { id: "tx1", sender: "public" } },
      recipient: null,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("offers nothing when there is no account", () => {
    mockState.account.account = null;

    expect(renderViewModel()).toBeNull();
  });

  it("offers nothing when the currency declares no balance pools", () => {
    mockedGetBalanceTypeConfig.mockReturnValue(null);

    expect(renderViewModel()).toBeNull();
  });

  it("offers nothing when the descriptor has no destination pool", () => {
    stubBalanceTypeConfig(null);

    expect(renderViewModel()).toBeNull();
  });

  it("exposes the destination the descriptor resolved", () => {
    expect(renderViewModel()?.target).toEqual(SHIELDED_TARGET);
  });

  it("prefills the destination address and flags the transfer as a self-transfer", () => {
    renderViewModel()?.onSelfTransfer("Private balance");

    expect(mockSetRecipient).toHaveBeenCalledWith({
      address: "u1shielded",
      displayLabel: "Private balance",
      ensName: undefined,
      isSelfTransfer: true,
    });
  });

  it("keeps the rest of the recipient data it replaces", () => {
    mockState.recipient = { address: "u1typed", memo: { value: "kept" } };

    renderViewModel()?.onSelfTransfer("Private balance");

    expect(mockSetRecipient).toHaveBeenCalledWith(
      expect.objectContaining({ memo: { value: "kept" } }),
    );
  });

  it("moves to the next step", () => {
    renderViewModel()?.onSelfTransfer("Private balance");

    expect(mockGoToNextStep).toHaveBeenCalledTimes(1);
  });
});

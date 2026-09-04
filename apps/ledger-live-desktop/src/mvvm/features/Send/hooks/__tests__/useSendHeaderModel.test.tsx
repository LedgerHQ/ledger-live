import React from "react";
import { createRoot } from "react-dom/client";
import { BigNumber } from "bignumber.js";
import { act } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { useSendHeaderModel } from "../useSendHeaderModel";

jest.mock("../../../FlowWizard/FlowWizardContext", () => ({ useFlowWizard: jest.fn() }));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
  useSendFlowActions: jest.fn(),
}));
jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));
jest.mock("LLD/hooks/redux");
jest.mock("@features/platform-contacts", () => ({
  useContactsFeature: jest.fn(() => ({ isEnabled: false, eligibleAddressFamilies: ["evm"] })),
}));
jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  decodeURIScheme: jest.fn(),
}));
jest.mock("../../context/RecipientContactSelectionContext", () => ({
  useRecipientContactSelection: jest.fn(),
}));
jest.mock("../../context/AddNewContactHeaderContext", () => ({
  useAddNewContactHeaderState: jest.fn(() => ({
    titleKey: "contacts.addContact",
    onAddressPhaseBack: null,
  })),
}));

import { useFlowWizard } from "../../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { track } from "~/renderer/analytics/segment";
import { decodeURIScheme } from "@ledgerhq/live-common/currencies/index";
import { RecipientScannerProvider } from "../../context/RecipientScannerContext";
import { useSelector } from "LLD/hooks/redux";
import { useContactsFeature } from "@features/platform-contacts";
import { useRecipientContactSelection } from "../../context/RecipientContactSelectionContext";
import { useAddNewContactHeaderState } from "../../context/AddNewContactHeaderContext";

type VM = ReturnType<typeof useSendHeaderModel>;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let latestVM: VM | null = null;

function HookProbe({
  onResult,
  availableText = "",
  resetViewState = () => {},
}: {
  onResult: (vm: VM) => void;
  availableText?: string;
  resetViewState?: () => void;
}) {
  const vm = useSendHeaderModel({ availableText, resetViewState });
  onResult(vm);
  return null;
}

const mockNavigation = (overrides?: {
  canGoBack?: boolean;
  goToStep?: jest.Mock;
  goToPreviousStep?: jest.Mock;
}) => {
  const goToStep = overrides?.goToStep ?? jest.fn();
  const goToPreviousStep = overrides?.goToPreviousStep ?? jest.fn();
  const canGoBack = overrides?.canGoBack ?? true;
  (useFlowWizard as jest.Mock).mockReturnValue({
    currentStep: SEND_FLOW_STEP.AMOUNT,
    currentStepConfig: { addressInput: true, showTitle: true },
    navigation: {
      goToStep,
      goToPreviousStep,
      canGoBack: () => canGoBack,
    },
  });
  return { goToStep, goToPreviousStep };
};

const mockActions = (overrides?: { updateTransaction?: jest.Mock }) => {
  const close = jest.fn();
  const updateTransaction = overrides?.updateTransaction ?? jest.fn();
  (useSendFlowActions as jest.Mock).mockReturnValue({
    close,
    transaction: { updateTransaction },
  });
  return { close, updateTransaction };
};

const mockData = (
  state: unknown,
  uiConfig: Record<string, unknown> = { hasMemo: false },
  recipientSearch = { value: "" },
) => {
  const search = { ...recipientSearch, setValue: jest.fn(), clear: jest.fn() };
  (useSendFlowData as jest.Mock).mockReturnValue({
    state,
    uiConfig,
    recipientSearch: search,
  });
  return search;
};

function renderHook(availableText = "", resetViewState = () => {}) {
  act(() => {
    root.render(
      <RecipientScannerProvider>
        <HookProbe
          onResult={vm => (latestVM = vm)}
          availableText={availableText}
          resetViewState={resetViewState}
        />
      </RecipientScannerProvider>,
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  latestVM = null;
  mockData({
    account: { currency: { ticker: "ETH" }, account: {} },
    recipient: null,
    transaction: { status: {} },
  });
  (useMaybeAccountName as jest.Mock).mockReturnValue("Base 1");
  jest.mocked(useRecipientContactSelection).mockReturnValue({
    selectedContact: undefined,
    selectContact: jest.fn(),
    clearSelectedContact: jest.fn(),
  });
  jest.mocked(useAddNewContactHeaderState).mockReturnValue({
    titleKey: "contacts.addContact",
    onAddressPhaseBack: null,
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe("useSendHeaderModel", () => {
  describe("recipient header summary", () => {
    it("shows the default send title and account summary on recipient step", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("$5,969.83");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("Base 1 · $5,969.83");
    });

    it("falls back to the balance only in description when account name is unavailable", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });
      (useMaybeAccountName as jest.Mock).mockReturnValue(undefined);

      renderHook("$5,969.83");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("$5,969.83");
    });

    it("shows the contact address selection header and returns to the recipient list", () => {
      const clearSelectedContact = jest.fn();
      jest.mocked(useRecipientContactSelection).mockReturnValue({
        selectedContact: mockContact({ name: "Benoit" }),
        selectContact: jest.fn(),
        clearSelectedContact,
      });
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => false },
      });

      renderHook("$5,969.83");

      expect(latestVM?.title).toBe("Select address");
      expect(latestVM?.descriptionText).toBe("Benoit");
      expect(latestVM?.showRecipientInput).toBe(false);
      expect(latestVM?.showBackButton).toBe(true);

      act(() => latestVM?.handleBack());
      expect(clearSelectedContact).toHaveBeenCalledTimes(1);
    });
  });

  describe("recipient input placeholder", () => {
    const renderOnRecipientStep = ({
      supportsDomain,
      isContactsFeatureEnabled,
      eligibleAddressFamilies = ["evm"],
    }: {
      supportsDomain: boolean;
      isContactsFeatureEnabled: boolean;
      eligibleAddressFamilies?: string[];
    }) => {
      (useContactsFeature as jest.Mock).mockReturnValue({
        isEnabled: isContactsFeatureEnabled,
        eligibleAddressFamilies,
      });
      mockActions();
      mockData(
        {
          account: {
            currency: {
              type: "CryptoCurrency",
              ticker: "ETH",
              id: "ethereum",
              family: "evm",
            },
            account: {},
          },
          recipient: null,
          transaction: { status: {} },
        },
        { hasMemo: false, recipientSupportsDomain: supportsDomain },
      );
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook();
    };

    it("mentions contacts and ENS when the network supports both", () => {
      renderOnRecipientStep({
        supportsDomain: true,
        isContactsFeatureEnabled: true,
      });

      expect(latestVM?.recipientPlaceholder).toBe("Enter address, ENS or contact");
    });

    it("mentions contacts only when the network has no ENS support", () => {
      renderOnRecipientStep({
        supportsDomain: false,
        isContactsFeatureEnabled: true,
      });

      expect(latestVM?.recipientPlaceholder).toBe("Enter address or contact");
    });

    it("keeps the default placeholder when the currency family is not eligible", () => {
      renderOnRecipientStep({
        supportsDomain: true,
        isContactsFeatureEnabled: true,
        eligibleAddressFamilies: ["bitcoin"],
      });

      expect(latestVM?.recipientPlaceholder).toBe("Enter address or ENS");
    });

    it("keeps the default placeholder when the contacts feature is disabled", () => {
      renderOnRecipientStep({
        supportsDomain: false,
        isContactsFeatureEnabled: false,
      });

      expect(latestVM?.recipientPlaceholder).toBe("Enter address");
    });
  });

  describe("recipient address input value on amount step", () => {
    const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
    const CONTACT = {
      id: "contact-benoit",
      isMe: false,
      name: "Benoit Jean",
      addresses: [{ id: "address-1", currencyId: "ethereum", label: "Eth main", address: ADDRESS }],
    };

    const renderOnAmountStep = () => {
      mockNavigation();
      mockActions();
      mockData({
        account: {
          currency: { type: "CryptoCurrency", ticker: "ETH", id: "ethereum", family: "evm" },
          account: {},
        },
        recipient: { address: ADDRESS },
        transaction: { status: {} },
      });

      renderHook();
    };

    it("shows the contact name when the recipient is a contact", () => {
      (useContactsFeature as jest.Mock).mockReturnValue({
        isEnabled: true,
        eligibleAddressFamilies: ["evm"],
      });
      jest.mocked(useSelector).mockReturnValue([CONTACT] as never);

      renderOnAmountStep();

      expect(latestVM?.recipientContact).toEqual({
        id: "contact-benoit",
        name: "Benoit Jean",
      });
      expect(latestVM?.addressInputValue).toBe("Benoit Jean");
    });

    it("shows the formatted address when the recipient is not a contact", () => {
      (useContactsFeature as jest.Mock).mockReturnValue({
        isEnabled: true,
        eligibleAddressFamilies: ["evm"],
      });
      jest.mocked(useSelector).mockReturnValue([] as never);

      renderOnAmountStep();

      expect(latestVM?.recipientContact).toBeUndefined();
      expect(latestVM?.addressInputValue).toBe("0x123456...12345678");
    });

    it("shows the formatted address when the contacts feature is disabled", () => {
      (useContactsFeature as jest.Mock).mockReturnValue({
        isEnabled: false,
        eligibleAddressFamilies: ["evm"],
      });
      jest.mocked(useSelector).mockReturnValue([CONTACT] as never);

      renderOnAmountStep();

      expect(latestVM?.recipientContact).toBeUndefined();
      expect(latestVM?.addressInputValue).toBe("0x123456...12345678");
    });
  });

  describe("handleBack — floating steps (history-based)", () => {
    it("calls goToPreviousStep when on CUSTOM_FEES step and canGoBack()", () => {
      const { goToStep, goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      const resetViewState = jest.fn();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.CUSTOM_FEES,
        currentStepConfig: {},
        navigation: { goToStep, goToPreviousStep, canGoBack: () => true },
      });

      renderHook("", resetViewState);
      latestVM?.handleBack();

      expect(goToPreviousStep).toHaveBeenCalled();
      expect(goToStep).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it("runs COIN_CONTROL cleanup then calls goToPreviousStep on COIN_CONTROL step", () => {
      const { goToPreviousStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.COIN_CONTROL,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const txWithUtxo = {
        family: "bitcoin",
        utxoStrategy: { strategy: 0, excludeUTXOs: [{ hash: "a", outputIndex: 0 }] },
      };
      expect(updater(txWithUtxo)).toEqual({
        ...txWithUtxo,
        utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      });
      expect(goToPreviousStep).toHaveBeenCalled();
    });

    it("stays on add new contact when the address phase handles back", () => {
      const onAddressPhaseBack = jest.fn();
      const { goToStep, goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      jest.mocked(useAddNewContactHeaderState).mockReturnValue({
        titleKey: "contacts.addAddressEntry.title",
        onAddressPhaseBack,
      });
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.ADD_NEW_CONTACT,
        currentStepConfig: { titleKey: "contacts.addContact", showTitle: true },
        navigation: { goToStep, goToPreviousStep, canGoBack: () => true },
      });

      renderHook();

      expect(latestVM?.title).toBe("Enter address");
      latestVM?.handleBack();

      expect(onAddressPhaseBack).toHaveBeenCalled();
      expect(goToPreviousStep).not.toHaveBeenCalled();
      expect(goToStep).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it("shows the select contact title before the address phase", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT,
        currentStepConfig: {
          titleKey: "newSendFlow.addContact.selectContact",
          showTitle: true,
          showAvailable: false,
        },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook();

      expect(latestVM?.title).toBe("Select contact");
    });

    it("stays on add to existing contact when the address phase handles back", () => {
      const onAddressPhaseBack = jest.fn();
      const { goToStep, goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      jest.mocked(useAddNewContactHeaderState).mockReturnValue({
        titleKey: "contacts.addAddressEntry.title",
        onAddressPhaseBack,
      });
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT,
        currentStepConfig: {
          titleKey: "newSendFlow.addContact.selectContact",
          showTitle: true,
        },
        navigation: { goToStep, goToPreviousStep, canGoBack: () => true },
      });

      renderHook();

      expect(latestVM?.title).toBe("Enter address");
      latestVM?.handleBack();

      expect(onAddressPhaseBack).toHaveBeenCalled();
      expect(goToPreviousStep).not.toHaveBeenCalled();
      expect(goToStep).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });
  });

  describe("handleBack — standard navigation", () => {
    it("calls goToPreviousStep when no backTarget and canGoBack()", () => {
      const { goToPreviousStep } = mockNavigation();
      const { close } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      expect(goToPreviousStep).toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it("calls close when no backTarget and !canGoBack()", () => {
      const { goToPreviousStep } = mockNavigation({ canGoBack: false });
      const { close } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => false },
      });

      renderHook();
      latestVM?.handleBack();

      expect(close).toHaveBeenCalled();
      expect(goToPreviousStep).not.toHaveBeenCalled();
    });
  });

  describe("descriptionText — account summary", () => {
    it("shows the account summary on non-recipient steps too", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.AMOUNT,
        currentStepConfig: { showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("Base 1 · 1 ETH");
    });

    it("hides the account summary when showAvailable is false", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.AMOUNT,
        currentStepConfig: { showTitle: true, showAvailable: false },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("Send ETH");
      expect(latestVM?.descriptionText).toBe("");
    });

    it("uses the per-step titleKey override when defined", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.CUSTOM_FEES,
        currentStepConfig: { showTitle: true, titleKey: "newSendFlow.customFees.title" },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("Custom fees");
    });

    it("hides the summary when the step title is hidden", () => {
      mockNavigation();
      mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.SIGNATURE,
        currentStepConfig: { showTitle: false },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });

      renderHook("1 ETH");

      expect(latestVM?.title).toBe("");
      expect(latestVM?.descriptionText).toBe("");
    });
  });

  describe("QR code scanner", () => {
    const mockRecipientStep = () => {
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.RECIPIENT,
        currentStepConfig: { addressInput: true, showTitle: true },
        navigation: { goToStep: jest.fn(), goToPreviousStep: jest.fn(), canGoBack: () => true },
      });
    };

    const baseState = {
      account: { currency: { ticker: "ETH" }, account: {} },
      recipient: null,
      transaction: {
        status: {},
        transaction: {
          family: "evm",
          amount: { isZero: () => true },
          recipient: "",
          useAllAmount: false,
          userGasLimit: undefined,
          gasPrice: undefined,
        },
      },
    };

    it("is closed by default and toggles open then closed, tracking both", () => {
      mockActions();
      mockData(baseState);
      mockRecipientStep();

      renderHook();
      expect(latestVM?.isScannerOpen).toBe(false);

      act(() => latestVM?.handleQrCodeClick());
      expect(latestVM?.isScannerOpen).toBe(true);
      expect(track).toHaveBeenCalledWith("Send Flow QR Code Opened", expect.any(Object));

      act(() => latestVM?.handleQrCodeClick());
      expect(latestVM?.isScannerOpen).toBe(false);
      expect(track).toHaveBeenCalledWith("Send Flow QR Code Closed", expect.any(Object));
    });

    it("stays closed on steps other than recipient", () => {
      mockNavigation();
      mockActions();
      mockData(baseState);

      renderHook();
      act(() => latestVM?.handleQrCodeClick());

      expect(latestVM?.isScannerOpen).toBe(false);
    });

    it("closes the scanner once the user types in the recipient field", () => {
      mockActions();
      const search = mockData(baseState);
      mockRecipientStep();

      renderHook();
      act(() => latestVM?.handleQrCodeClick());
      act(() => latestVM?.handleRecipientInputChange("0x1"));

      expect(search.setValue).toHaveBeenCalledWith("0x1");
      expect(latestVM?.isScannerOpen).toBe(false);
    });

    it("keeps the scanner open when the field is cleared back to empty", () => {
      mockActions();
      const search = mockData(baseState);
      mockRecipientStep();

      renderHook();
      act(() => latestVM?.handleQrCodeClick());
      act(() => latestVM?.handleRecipientInputChange(""));

      expect(search.setValue).toHaveBeenCalledWith("");
      expect(latestVM?.isScannerOpen).toBe(true);
    });

    it("closes the scanner when navigating back", () => {
      mockActions();
      mockData(baseState);
      mockRecipientStep();

      renderHook();
      act(() => latestVM?.handleQrCodeClick());
      act(() => latestVM?.handleBack());

      expect(latestVM?.isScannerOpen).toBe(false);
    });

    it("sets the decoded address and closes the scanner on a successful scan", () => {
      const { updateTransaction } = mockActions();
      const search = mockData(baseState);
      mockRecipientStep();
      (decodeURIScheme as jest.Mock).mockReturnValue({
        address: "0xAbC",
        currency: { id: "ethereum" },
      });

      renderHook();
      act(() => latestVM?.handleQrCodeClick());
      act(() => latestVM?.handleScanPicked("ethereum:0xAbC"));

      expect(decodeURIScheme).toHaveBeenCalledWith("ethereum:0xAbC");
      expect(search.setValue).toHaveBeenCalledWith("0xAbC");
      expect(search.setValue).toHaveBeenCalledTimes(1);
      expect(updateTransaction).not.toHaveBeenCalled();
      expect(latestVM?.isScannerOpen).toBe(false);
    });

    it("prefills the transaction amount from a BIP21/EIP-681 URI while staying on recipient", () => {
      const amount = new BigNumber(1);
      const { updateTransaction } = mockActions();
      const search = mockData(baseState);
      mockRecipientStep();
      (decodeURIScheme as jest.Mock).mockReturnValue({
        address: "0xAbC",
        amount,
        currency: { id: "ethereum" },
      });

      renderHook();
      act(() => latestVM?.handleQrCodeClick());
      act(() => latestVM?.handleScanPicked("ethereum:0xAbC?value=1"));

      expect(search.setValue).toHaveBeenCalledWith("0xAbC");
      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      expect(updater({ family: "evm", amount: new BigNumber(0), useAllAmount: true })).toEqual(
        expect.objectContaining({
          amount,
          useAllAmount: false,
        }),
      );
      expect(latestVM?.isScannerOpen).toBe(false);
    });
  });

  describe("handleBack — state cleanup", () => {
    it("resets amount-related fields and calls resetViewState when on AMOUNT step then navigates", () => {
      const { goToPreviousStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      const resetViewState = jest.fn();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.AMOUNT,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook("", resetViewState);
      latestVM?.handleBack();

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const tx = { amount: 100, useAllAmount: true, feesStrategy: "fast" };
      const next = updater(tx);
      expect(Number(next.amount)).toBe(0);
      expect(next.useAllAmount).toBe(false);
      expect(next.feesStrategy).toBeNull();
      expect(resetViewState).toHaveBeenCalled();
      expect(goToPreviousStep).toHaveBeenCalled();
    });

    it("leaves transaction unchanged when COIN_CONTROL step but tx has no utxoStrategy", () => {
      const { goToPreviousStep } = mockNavigation();
      const { updateTransaction } = mockActions();
      (useFlowWizard as jest.Mock).mockReturnValue({
        currentStep: SEND_FLOW_STEP.COIN_CONTROL,
        currentStepConfig: {},
        navigation: { goToStep: jest.fn(), goToPreviousStep, canGoBack: () => true },
      });

      renderHook();
      latestVM?.handleBack();

      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const ethTx = { family: "ethereum" };
      expect(updater(ethTx)).toBe(ethTx);
    });
  });
});

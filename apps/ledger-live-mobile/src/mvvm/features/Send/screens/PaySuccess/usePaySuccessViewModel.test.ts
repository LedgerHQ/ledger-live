import { BigNumber } from "bignumber.js";
import { parseAnyAccountId } from "@domain/entity-account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import type { Operation } from "@ledgerhq/types-live";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { usePaySuccessViewModel } from "./usePaySuccessViewModel";

const mockClose = jest.fn();
const mockNavigate = jest.fn();
let mockFlowState: SendFlowState;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({ state: mockFlowState }),
  useSendFlowActions: () => ({ close: mockClose }),
}));

const ADA_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const UNKNOWN_ADDRESS = "0xfeedfacefeedfacefeedfacefeedfacefeedface";
const ACCOUNT_NAME = "Ada's payments";

const ada = mockContactWithAddress({ id: "contact-ada", name: "Ada" });
const account = genAccount("pay-success-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});

function buildFlowState(
  overrides: {
    address?: string;
    signedRecipient?: string;
    optimisticOperation?: Operation | null;
  } = {},
): SendFlowState {
  return {
    account: { account, parentAccount: null, currency: account.currency },
    transaction: {
      transaction: {
        amount: new BigNumber("1500000000000000000"),
        recipient: overrides.signedRecipient ?? overrides.address ?? ADA_ADDRESS,
      } as SendFlowState["transaction"]["transaction"],
      status: {} as SendFlowState["transaction"]["status"],
      bridgeError: null,
      bridgePending: false,
    },
    recipient: { address: overrides.address ?? ADA_ADDRESS },
    operation: {
      optimisticOperation: overrides.optimisticOperation ?? null,
      transactionError: null,
      signed: true,
    },
    isLoading: false,
    flowStatus: FLOW_STATUS.SUCCESS,
  };
}

function renderPaySuccess(state = buildFlowState(), { isContactsEnabled = true } = {}) {
  mockFlowState = state;

  return renderHook(() => usePaySuccessViewModel(), {
    overrideInitialState: withFlagOverrides(
      { lwmContacts: { enabled: isContactsEnabled, params: { newBadge: false } } },
      state => ({
        ...state,
        accounts: { ...state.accounts, active: [account] },
        wallet: {
          ...state.wallet,
          accountNames: new Map([[parseAnyAccountId(account.id), ACCOUNT_NAME]]),
        },
        contacts: { contacts: [ada] },
      }),
    ),
  });
}

describe("usePaySuccessViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should expose the contact as recipient when the address belongs to one", () => {
    const { result } = renderPaySuccess();

    expect(result.current.recipient).toEqual({ id: "contact-ada", name: "Ada" });
    expect(result.current.recipientLabel).toBe("Ada");
  });

  it("should fall back to the input recipient when the signed transaction has no address", () => {
    const { result } = renderPaySuccess(buildFlowState({ signedRecipient: "" }));

    expect(result.current.recipient).toEqual({ id: "contact-ada", name: "Ada" });
    expect(result.current.recipientLabel).toBe("Ada");
  });

  it("should match the contact from the signed transaction address when input was a domain", () => {
    const { result } = renderPaySuccess(
      buildFlowState({ address: "ada.eth", signedRecipient: ADA_ADDRESS }),
    );

    expect(result.current.recipient).toEqual({ id: "contact-ada", name: "Ada" });
    expect(result.current.recipientLabel).toBe("Ada");
  });

  it("should fall back to the input recipient when the signed transaction has no address", () => {
    const { result } = renderPaySuccess(buildFlowState({ signedRecipient: "" }));

    expect(result.current.recipient).toEqual({ id: "contact-ada", name: "Ada", isMe: false });
    expect(result.current.recipientLabel).toBe("Ada");
  });

  it("should match the contact from the signed transaction address when input was a domain", () => {
    const { result } = renderPaySuccess(
      buildFlowState({ address: "ada.eth", signedRecipient: ADA_ADDRESS }),
    );

    expect(result.current.recipient).toEqual({ id: "contact-ada", name: "Ada", isMe: false });
    expect(result.current.recipientLabel).toBe("Ada");
  });

  it("should fall back to the truncated address when no contact matches", () => {
    const { result } = renderPaySuccess(buildFlowState({ address: UNKNOWN_ADDRESS }));

    expect(result.current.recipient).toBeUndefined();
    expect(result.current.recipientLabel).toBe("0xfeedfa...feedface");
  });

  it("should ignore matching contacts when the contacts feature is disabled", () => {
    const { result } = renderPaySuccess(buildFlowState(), { isContactsEnabled: false });

    expect(result.current.recipient).toBeUndefined();
    expect(result.current.recipientLabel).toBe("0x1ad23b...46c53034");
  });

  it("should format the paid amount", () => {
    const { result } = renderPaySuccess();

    expect(result.current.amountFormatted).toMatch(/1\.5/);
  });

  it("should open operation details when viewing the transaction", () => {
    const operation = { id: "op-child", accountId: account.id } as Operation;
    const { result } = renderPaySuccess(
      buildFlowState({
        optimisticOperation: {
          id: "op-root",
          accountId: account.id,
          subOperations: [operation],
        } as Operation,
      }),
    );

    expect(result.current.canViewTransaction).toBe(true);

    result.current.onViewTransaction();

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: undefined,
      operation,
    });
  });

  it("should not expose view transaction when there is no operation to view", () => {
    const { result } = renderPaySuccess();

    expect(result.current.canViewTransaction).toBe(false);

    result.current.onViewTransaction();

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

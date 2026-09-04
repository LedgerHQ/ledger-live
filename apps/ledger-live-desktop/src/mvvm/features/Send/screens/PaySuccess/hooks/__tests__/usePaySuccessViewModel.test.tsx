import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import type { Operation } from "@ledgerhq/types-live";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { usePaySuccessViewModel } from "../usePaySuccessViewModel";

const mockClose = jest.fn();
let mockFlowState: SendFlowState;

jest.mock("~/renderer/drawers/Provider", () => ({
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
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
  overrides: { address?: string; optimisticOperation?: Operation | null } = {},
): SendFlowState {
  return {
    account: { account, parentAccount: null, currency: account.currency },
    transaction: {
      transaction: {
        amount: new BigNumber("1500000000000000000"),
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
    initialState: {
      accounts: [account],
      wallet: { accountNames: new Map([[account.id, ACCOUNT_NAME]]) },
      contacts: { contacts: [ada] },
      ...withFlagOverrides({ lwdContacts: { enabled: isContactsEnabled } }),
    },
  });
}

describe("usePaySuccessViewModel", () => {
  it("should expose the contact as recipient when the address belongs to one", () => {
    const { result } = renderPaySuccess();

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

  it("should summarize the transaction from the account and its network", () => {
    const { result } = renderPaySuccess();

    expect(result.current.amountFormatted).toBe("1.5\u00A0ETH");
    expect(result.current.fromAccountName).toBe(ACCOUNT_NAME);
    expect(result.current.networkIcon).toEqual({ ledgerId: "ethereum", ticker: "ETH" });
    expect(result.current.estimatedTime).toBe("~15s");
  });

  it("should open the operation details drawer on the sub operation when viewing the transaction", () => {
    const { result } = renderPaySuccess(
      buildFlowState({
        optimisticOperation: {
          id: "op-root",
          subOperations: [{ id: "op-child" }],
        } as Operation,
      }),
    );

    result.current.onViewTransaction();

    expect(mockClose).toHaveBeenCalled();
    expect(setDrawer).toHaveBeenCalledWith(
      OperationDetails,
      { operationId: "op-child", accountId: account.id, parentId: undefined },
      expect.objectContaining({ onRequestClose: expect.any(Function) }),
    );
  });

  it("should only close the flow when there is no operation to view", () => {
    const { result } = renderPaySuccess();

    result.current.onViewTransaction();

    expect(mockClose).toHaveBeenCalled();
    expect(setDrawer).not.toHaveBeenCalled();
  });
});

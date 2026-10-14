import React from "react";
import BigNumber from "bignumber.js";
import { useNavigation } from "@react-navigation/native";
import type { HederaAccount, HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import operationDetails from "../operationDetails";
import { HEDERA_ASSOCIATED_SUBACCOUNT, makeHederaAccount } from "../__mocks__/account.mock";
import { htsToken } from "../__mocks__/currency.mock";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

jest.mock("@features/platform-currencies", () => ({
  ...jest.requireActual("@features/platform-currencies"),
  useTokenByAddressInCurrency: jest.fn(() => ({ token: htsToken })),
}));

const { OperationDetailsPostAlert } = operationDetails;
const navigate = jest.fn();

const associateOperation = {
  id: "op-associate",
  hash: "",
  type: "ASSOCIATE_TOKEN",
  value: new BigNumber(0),
  fee: new BigNumber(0),
  senders: [],
  recipients: [],
  blockHeight: null,
  blockHash: null,
  accountId: "",
  date: new Date(),
  extra: { associatedTokenId: htsToken.contractAddress },
} as HederaOperation;

function pressReceiveLink(account: HederaAccount) {
  render(<OperationDetailsPostAlert account={account} operation={associateOperation} />);
  fireEvent.press(screen.getByText("Click here"));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({ navigate } as never);
});

describe("Hedera OperationDetailsPostAlert", () => {
  it("opens the token account's receive flow once the association is synced", () => {
    pressReceiveLink({ ...makeHederaAccount(), subAccounts: [HEDERA_ASSOCIATED_SUBACCOUNT] });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        currency: HEDERA_ASSOCIATED_SUBACCOUNT.token,
        accountId: HEDERA_ASSOCIATED_SUBACCOUNT.id,
        parentId: HEDERA_ASSOCIATED_SUBACCOUNT.parentId,
      },
    });
  });

  it("opens the main account's receive flow while the association is pending", () => {
    const account = { ...makeHederaAccount(), subAccounts: [] };
    pressReceiveLink(account);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: { currency: htsToken, accountId: account.id },
    });
  });
});

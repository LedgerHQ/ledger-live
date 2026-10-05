import React from "react";
import BigNumber from "bignumber.js";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import HederaSendRowsCustom from "./SendRowsCustom";
import { makeHederaAccount } from "./__mocks__/account.mock";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

const account = makeHederaAccount();
const navigate = jest.fn();

const baseTx: HederaGenericTransaction = {
  family: "hedera",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
};

function renderRows(transaction: HederaGenericTransaction) {
  const props = { account, transaction } as unknown as React.ComponentProps<
    typeof HederaSendRowsCustom
  >;
  render(<HederaSendRowsCustom {...props} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({ navigate } as never);
  jest.mocked(useRoute).mockReturnValue({ params: {} } as never);
});

describe("HederaSendRowsCustom", () => {
  it("should show the memo when the transaction has one", () => {
    renderRows({ ...baseTx, memoValue: "ref-42" });

    expect(screen.getByText("ref-42")).toBeVisible();
  });

  it("should open the memo editor when the edit link is pressed", () => {
    renderRows(baseTx);

    fireEvent.press(screen.getByText("Edit"));

    expect(navigate).toHaveBeenCalledWith(
      ScreenName.HederaEditMemo,
      expect.objectContaining({ accountId: account.id, transaction: baseTx }),
    );
  });
});

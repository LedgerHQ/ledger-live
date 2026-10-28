import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import { SendAmountFooterRow } from "../SendAmountFooterRow";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { makeAleoTransaction, makePrivateAleoTransaction } from "../../__mocks__/transaction.mock";

jest.mock("@ledgerhq/live-common/families/aleo/config", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/families/aleo/config");
  return { ...actual, getAleoCurrencyConfigById: jest.fn(actual.getAleoCurrencyConfigById) };
});

const mockGetAleoCurrencyConfigById = jest.mocked(getAleoCurrencyConfigById);

const privateTransaction = makePrivateAleoTransaction(2, "fee-record");

const renderRow = (transaction: AleoTransaction) =>
  render(<SendAmountFooterRow account={ALEO_ACCOUNT_1} transaction={transaction} />);

describe("Aleo SendAmountFooterRow", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockGetAleoCurrencyConfigById.mockImplementation(
      jest.requireActual("@ledgerhq/live-common/families/aleo/config").getAleoCurrencyConfigById,
    );
  });

  it("renders nothing for a public send", () => {
    renderRow(makeAleoTransaction());

    expect(screen.queryByTestId("aleo-send-estimated-time-row")).toBeNull();
  });

  it("renders nothing before any record is picked", () => {
    renderRow(makePrivateAleoTransaction(0, null));

    expect(screen.queryByTestId("aleo-send-estimated-time-row")).toBeNull();
  });

  it("counts the records of a private send with a sponsored fee", () => {
    renderRow(makePrivateAleoTransaction(3, null));

    expect(screen.getByText("Est. time")).toBeVisible();
    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~38 s");
  });

  it("adds the fee record when the fee is not sponsored", () => {
    renderRow(makePrivateAleoTransaction(3, "fee-record"));

    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~50 s");
  });

  it("follows the records picked for a new amount", () => {
    const { rerender } = renderRow(makePrivateAleoTransaction(1, null));
    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~13 s");

    rerender(
      <SendAmountFooterRow
        account={ALEO_ACCOUNT_1}
        transaction={makePrivateAleoTransaction(7, "fee")}
      />,
    );

    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~1.5 min");
  });

  it("renders nothing when records are picked manually", () => {
    const autoConfig = getAleoCurrencyConfigById(ALEO_ACCOUNT_1.currency.id);
    mockGetAleoCurrencyConfigById.mockReturnValue(
      autoConfig && { ...autoConfig, recordPickingStrategy: "manual" },
    );

    renderRow(privateTransaction);

    expect(screen.queryByTestId("aleo-send-estimated-time-row")).toBeNull();
  });

  it("explains the estimate and links to the Aleo support article", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = renderRow(privateTransaction);

    await user.press(screen.getByRole("button", { name: "Est. time" }));

    expect(await screen.findByText("How estimated time works")).toBeVisible();
    expect(
      screen.getByText(
        "Sending more ALEO uses more records, and each one adds processing time. Larger amounts take longer to confirm.",
      ),
    ).toBeVisible();

    await user.press(screen.getByText("Learn more"));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(
      expect.stringContaining("support.ledger.com/article/Aleo-ALEO"),
    );
  });
});

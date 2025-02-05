import React from "react";
import { OperationGroup } from "../components/OperationGroup";
import { act, render, screen } from "tests/testUtils";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

jest.mock("../SectionTitle", () =>
  jest.fn(() => <div data-testid="section-title">SectionTitle</div>),
);
const exampleOperation: Operation = {
  id: "op_123456",
  hash: "0xabcdef1234567890",
  type: "NFT_IN",
  value: new BigNumber(100000000),
  fee: new BigNumber(5000),
  senders: ["0xSenderAddress"],
  recipients: ["0xRecipientAddress"],
  blockHeight: 15000000,
  blockHash: "0xblockhash123456",
  transactionSequenceNumber: 12345,
  accountId: "account_001",
  standard: "ERC721",
  operator: "0xOperatorAddress",
  contract: "0xContractAddress",
  tokenId: "1",
  date: new Date(),
  hasFailed: false,
  subOperations: [],
  internalOperations: [],
  nftOperations: [],
  extra: {},
};

describe("OperationGroup", () => {
  const mockGroup = {
    day: new Date("2023-01-01"),
    data: [exampleOperation],
  };

  it("renders SectionTitle if validOperations contains elements", async () => {
    const validOperations = [<div key="1">Operation 1</div>, <div key="2">Operation 2</div>];

    render(<OperationGroup group={mockGroup} validOperations={validOperations} />);

    expect(screen.getByTestId("section-title")).toBeInTheDocument();
  });

  it("does not render SectionTitle if validOperations is empty", async () => {
    render(<OperationGroup group={mockGroup} validOperations={null} />);

    expect(screen.queryByTestId("section-title")).not.toBeInTheDocument();
  });

  it("updates state when child elements change (adding component)", async () => {
    const { rerender } = render(<OperationGroup group={mockGroup} validOperations={null} />);

    expect(screen.queryByTestId("section-title")).not.toBeInTheDocument();

    await act(async () => {
      rerender(
        <OperationGroup group={mockGroup} validOperations={[<div key="1">New Operation</div>]} />,
      );
    });

    expect(screen.getByTestId("section-title")).toBeInTheDocument();
  });

  it("updates state when child elements change (removing component)", async () => {
    const { rerender } = render(
      <OperationGroup group={mockGroup} validOperations={[<div key="1">New Operation</div>]} />,
    );

    expect(screen.getByTestId("section-title")).toBeInTheDocument();

    await act(async () => {
      rerender(<OperationGroup group={mockGroup} validOperations={null} />);
    });

    expect(screen.queryByTestId("section-title")).not.toBeInTheDocument();
  });
});

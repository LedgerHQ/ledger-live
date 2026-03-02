import React from "react";
import type { TFunction } from "i18next";
import { render, screen } from "tests/testSetup";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { OperationsList } from "~/renderer/components/OperationsList";
import type { AleoOperation } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/contants";

const mockT = jest.fn() as unknown as TFunction;

describe("OperationsList", () => {
  it("should render custom metadata cell with transaction type", () => {
    const mockAccount = {
      ...ALEO_ACCOUNT_1,
      operations: ALEO_ACCOUNT_1.operations.slice(0, 2).map((op, index) => ({
        ...op,
        extra: {
          functionId:
            index === 0 ? TRANSACTION_TYPE.TRANSFER_PRIVATE : TRANSACTION_TYPE.TRANSFER_PUBLIC,
          transactionType: index === 0 ? "private" : "public",
        } satisfies AleoOperation["extra"],
      })),
    };

    render(<OperationsList account={mockAccount} t={mockT} />);

    const metadataCells = screen.getAllByTestId("custom-metadata-cell");

    expect(metadataCells).toHaveLength(2);
    expect(metadataCells[0]).toHaveTextContent("Private");
    expect(metadataCells[1]).toHaveTextContent("Public");
  });

  it("should not render custom metadata cell when transaction type is missing or invalid", () => {
    const mockAccount = {
      ...ALEO_ACCOUNT_1,
      operations: [
        {
          ...ALEO_ACCOUNT_1.operations[0],
          extra: {},
        },
        {
          ...ALEO_ACCOUNT_1.operations[1],
          extra: {
            functionId: TRANSACTION_TYPE.TRANSFER_PRIVATE,
            transactionType: "invalid",
          },
        },
      ],
    };

    render(<OperationsList account={mockAccount} t={mockT} />);

    expect(screen.queryAllByTestId("custom-metadata-cell")).toHaveLength(0);
  });
});

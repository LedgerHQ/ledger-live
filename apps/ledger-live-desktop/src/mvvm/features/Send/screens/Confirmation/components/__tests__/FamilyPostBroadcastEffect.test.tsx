/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { FamilyPostBroadcastEffect } from "../FamilyPostBroadcastEffect";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const account = { id: "acc-1", type: "Account", currency: { family: "bitcoin" } };
const transaction = { family: "bitcoin", amount: 100n };
const operation = { id: "op-1", hash: "0xabc" };

function mockState(overrides: {
  account?: unknown;
  parentAccount?: unknown;
  transaction?: unknown;
  optimisticOperation?: unknown;
}) {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: {
        account: "account" in overrides ? overrides.account : account,
        parentAccount: overrides.parentAccount ?? null,
      },
      transaction: {
        transaction: "transaction" in overrides ? overrides.transaction : transaction,
      },
      operation: {
        optimisticOperation:
          "optimisticOperation" in overrides ? overrides.optimisticOperation : operation,
      },
    },
  } as never);
}

beforeEach(() => jest.clearAllMocks());

describe("FamilyPostBroadcastEffect", () => {
  it("renders the family PostBroadcastEffect once an optimistic operation exists", () => {
    mockState({});
    const PostBroadcastEffect = jest.fn(() => <div data-testid="post-broadcast-effect" />);
    mockedUseLLDCoinFamily.mockReturnValue({ PostBroadcastEffect } as never);

    render(<FamilyPostBroadcastEffect />);

    expect(screen.getByTestId("post-broadcast-effect")).toBeVisible();
    expect(PostBroadcastEffect).toHaveBeenCalledWith(
      { account, transaction, operation },
      undefined,
    );
  });

  it("renders nothing when the family declares no PostBroadcastEffect", () => {
    mockState({});
    mockedUseLLDCoinFamily.mockReturnValue({} as never);

    const { container } = render(<FamilyPostBroadcastEffect />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while no optimistic operation exists yet", () => {
    mockState({ optimisticOperation: null });
    const PostBroadcastEffect = jest.fn(() => <div data-testid="post-broadcast-effect" />);
    mockedUseLLDCoinFamily.mockReturnValue({ PostBroadcastEffect } as never);

    const { container } = render(<FamilyPostBroadcastEffect />);

    expect(container).toBeEmptyDOMElement();
    expect(PostBroadcastEffect).not.toHaveBeenCalled();
  });

  it("renders nothing when there is no account or transaction yet", () => {
    mockState({ account: null, transaction: null });
    const PostBroadcastEffect = jest.fn(() => <div data-testid="post-broadcast-effect" />);
    mockedUseLLDCoinFamily.mockReturnValue({ PostBroadcastEffect } as never);

    const { container } = render(<FamilyPostBroadcastEffect />);

    expect(container).toBeEmptyDOMElement();
    expect(PostBroadcastEffect).not.toHaveBeenCalled();
  });
});

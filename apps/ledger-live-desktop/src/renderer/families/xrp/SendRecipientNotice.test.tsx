import React from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { render } from "tests/testSetup";
import SendRecipientNotice from "./SendRecipientNotice";
import { XRP_ACCOUNT } from "./__mocks__/account.mock";

const transaction = { family: "xrp", amount: new BigNumber(0) } as Transaction;

function makeStatus(errors: TransactionStatus["errors"]) {
  return { errors, warnings: {} } as TransactionStatus;
}

describe("xrp SendRecipientNotice", () => {
  it("blocks the recipient step while the sender can't send the token", () => {
    const onBlockedChange = jest.fn();

    const { container } = render(
      <SendRecipientNotice
        account={XRP_ACCOUNT}
        transaction={transaction}
        status={makeStatus({ sender: new Error("XrpTokenFrozen") })}
        onBlockedChange={onBlockedChange}
      />,
    );

    expect(onBlockedChange).toHaveBeenLastCalledWith(true);
    expect(container).toBeEmptyDOMElement();
  });

  it("doesn't block on a recipient error", () => {
    const onBlockedChange = jest.fn();

    render(
      <SendRecipientNotice
        account={XRP_ACCOUNT}
        transaction={transaction}
        status={makeStatus({ recipient: new Error("XrpRecipientNotActivated") })}
        onBlockedChange={onBlockedChange}
      />,
    );

    expect(onBlockedChange).toHaveBeenLastCalledWith(false);
  });

  it("clears the block once the sender error is gone and when it unmounts", () => {
    const onBlockedChange = jest.fn();
    const props = { account: XRP_ACCOUNT, transaction, onBlockedChange };

    const { rerender, unmount } = render(
      <SendRecipientNotice
        {...props}
        status={makeStatus({ sender: new Error("XrpTokenFrozen") })}
      />,
    );
    rerender(<SendRecipientNotice {...props} status={makeStatus({})} />);
    expect(onBlockedChange).toHaveBeenLastCalledWith(false);

    rerender(
      <SendRecipientNotice
        {...props}
        status={makeStatus({ sender: new Error("XrpTokenFrozen") })}
      />,
    );
    unmount();
    expect(onBlockedChange).toHaveBeenLastCalledWith(false);
  });
});

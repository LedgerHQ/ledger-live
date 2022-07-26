// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import type { SellRequestEvent } from "@ledgerhq/live-common/exchange/sell/types";
import type {
  AccountRaw,
  AccountRawLike,
  TransactionStatusRaw,
  TransactionRaw,
} from "@ledgerhq/live-common/types/index";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import checkSignatureAndPrepare from "@ledgerhq/live-common/exchange/sell/checkSignatureAndPrepare";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { fromAccountRaw, fromAccountLikeRaw } from "@ledgerhq/live-common/account/serialization";
import { fromTransactionStatusRaw } from "@ledgerhq/live-common/transaction/status";
type Input = {
  parentAccount: ?AccountRaw,
  account: AccountRawLike,
  transaction: TransactionRaw,
  status: TransactionStatusRaw,
  binaryPayload: string,
  payloadSignature: string,
  deviceId: string,
};

const cmd = ({
  deviceId,
  transaction,
  binaryPayload,
  payloadSignature,
  account,
  parentAccount,
  status,
}: Input): Observable<SellRequestEvent> => {
  return withDevice(deviceId)(transport =>
    from(
      checkSignatureAndPrepare(transport, {
        binaryPayload,
        account: fromAccountLikeRaw(account),
        parentAccount: parentAccount ? fromAccountRaw(parentAccount) : undefined,
        status: fromTransactionStatusRaw(status),
        payloadSignature,
        transaction: fromTransactionRaw(transaction),
      }),
    ),
  );
};

export default cmd;

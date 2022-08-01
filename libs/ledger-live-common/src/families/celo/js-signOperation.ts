import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Transaction, CeloOperationMode, CeloAccount } from "./types";
import { encodeOperationId } from "../../operation";
import { CeloApp } from "./hw-app-celo";
import buildTransaction from "./js-buildTransaction";
import { rlpEncodedTx, encodeTransaction } from "@celo/wallet-base";
import { tokenInfoByAddressAndChainId } from "@celo/wallet-ledger/lib/tokens";
import { withDevice } from "../../hw/deviceAccess";

const MODE_TO_TYPE: { [key in CeloOperationMode | "default"]: string } = {
  send: "OUT",
  lock: "LOCK",
  unlock: "UNLOCK",
  withdraw: "WITHDRAW",
  vote: "VOTE",
  revoke: "REVOKE",
  activate: "ACTIVATE",
  register: "REGISTER",
  default: "FEE",
};
import type {
  Account,
  Operation,
  OperationType,
  SignOperationEvent,
} from "@ledgerhq/types-live";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber
): Operation => {
  const type = (MODE_TO_TYPE[transaction.mode] ??
    MODE_TO_TYPE.default) as OperationType;

  const value =
    type === "OUT" || type === "LOCK"
      ? new BigNumber(transaction.amount).plus(fee)
      : new BigNumber(transaction.amount);

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  return operation;
};

const trimLeading0x = (input: string) =>
  input.startsWith("0x") ? input.slice(2) : input;

const parseSigningResponse = (
  response: {
    s: string;
    v: string;
    r: string;
  },
  chainId: number
): {
  s: Buffer;
  v: number;
  r: Buffer;
} => {
  // EIP155
  const sigV = parseInt(response.v, 16);
  let eip155V = chainId * 2 + 35;
  if (sigV !== eip155V && (sigV & eip155V) !== sigV) {
    eip155V += 1;
  }

  return {
    s: Buffer.from(response.s, "hex"),
    v: eip155V,
    r: Buffer.from(response.r, "hex"),
  };
};

/**
 * Sign Transaction with Ledger hardware
 */
const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        let cancelled;

        async function main() {
          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          const celo = new CeloApp(transport);
          const unsignedTransaction = await buildTransaction(
            account as CeloAccount,
            transaction
          );
          const { chainId, to } = unsignedTransaction;
          const rlpEncodedTransaction = rlpEncodedTx(unsignedTransaction);

          const tokenInfo = tokenInfoByAddressAndChainId(to!, chainId!);
          if (tokenInfo) {
            await celo.provideERC20TokenInformation(tokenInfo);
          }

          o.next({ type: "device-signature-requested" });

          const response = await celo.signTransaction(
            account.freshAddressPath,
            trimLeading0x(rlpEncodedTransaction.rlpEncode)
          );

          if (cancelled) return;

          const signature = parseSigningResponse(response, chainId!);

          o.next({ type: "device-signature-granted" });

          const encodedTransaction = await encodeTransaction(
            rlpEncodedTransaction,
            signature
          );

          const operation = buildOptimisticOperation(
            account,
            transaction,
            transaction.fees ?? new BigNumber(0)
          );

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: encodedTransaction.raw,
              expirationDate: null,
            },
          });
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );

        return () => {
          cancelled = true;
        };
      })
  );

export default signOperation;

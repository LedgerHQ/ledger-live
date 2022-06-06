import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Transaction } from "./types";
import type { Operation, Account, SignOperationEvent } from "../../types";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction as EthereumTx } from "@ethereumjs/tx";
import buildTransaction from "./js-buildTransaction";
import Avalanche from "./hw-app-avalanche";
import { BN } from "avalanche";
import { encodeOperationId } from "../../operation";
import { bnToUnpaddedBuffer, rlp } from 'ethereumjs-util';

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
            new Observable<SignOperationEvent>((o) => {
                let cancelled;

                async function main() {
                    if (!transaction.fees) {
                        throw new FeeNotLoaded();
                    }

                    const avalanche = new Avalanche(transport);

                    const { tx, chainParams } = await buildTransaction(account, transaction);

                    const rawUnsignedTx = rlp.encode([
                        bnToUnpaddedBuffer(tx.nonce),
                        bnToUnpaddedBuffer(tx.gasPrice),
                        bnToUnpaddedBuffer(tx.gasLimit),
                        tx.to !== undefined ? tx.to.buf : Buffer.from([]),
                        bnToUnpaddedBuffer(tx.value),
                        tx.data,
                        bnToUnpaddedBuffer(new BN(account.currency.ethereumLikeInfo?.chainId as number)),
                        Buffer.from([]),
                        Buffer.from([])
                    ])

                    o.next({ type: "device-signature-requested" });

                    const result = await avalanche.signTransaction(
                        account.freshAddressPath,
                        rawUnsignedTx.toString('hex'),
                    );

                    if (cancelled) return;

                    o.next({ type: "device-signature-granted" });

                    const v = `0x${result.v}`;
                    const r = `0x${result.r}`;
                    const s = `0x${result.s}`;

                    const signedTx = EthereumTx.fromTxData({
                        ...tx,
                        v,
                        r,
                        s
                    },
                        chainParams
                    );

                    const signature = `0x${signedTx.serialize().toString("hex")}`;

                    const operation = buildOptimisticOperation(account, transaction);

                    o.next({
                        type: "signed",
                        signedOperation: {
                            operation,
                            signature,
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

const buildOptimisticOperation = (
    account: Account,
    transaction: Transaction,
): Operation => {
    const type = "OUT";
    const fee = transaction.fees ?? new BigNumber(0)
    const value = new BigNumber(transaction.amount).plus(fee);

    const operation: Operation = {
        id: encodeOperationId(account.id, "", type),
        hash: "",
        type,
        value,
        fee,
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: account.id,
        date: new Date(),
        extra: {}
    };

    return operation;
};

export default signOperation;

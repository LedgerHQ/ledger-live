import type { Transaction } from "./types";
import type { Account } from "../../types";
import { getGasPrice, DEFAULT_GAS_LIMIT } from "./js-getFeesForTransaction";
import { BN } from "avalanche";
import EthereumjsCommon from '@ethereumjs/common';
import { Transaction as EthTransaction } from '@ethereumjs/tx';
import { web3Client } from "./api/client";
import { bnToUnpaddedBuffer, rlp } from 'ethereumjs-util';

const buildTransaction = async (account: Account, transaction: Transaction) => {
    const { amount } = transaction;
    const value = transaction.useAllAmount
        ? account.spendableBalance.minus(transaction.fees || 0)
        : amount;
    const nonce = await web3Client().eth.getTransactionCount(account.freshAddress);
    const gasPrice = new BN((await getGasPrice()).toString());
    const chainId = account.currency.ethereumLikeInfo?.chainId as number;
    const networkId = chainId;
    const chainParams = {
        common: EthereumjsCommon.forCustomChain('mainnet', { networkId, chainId }, 'istanbul'),
    }

    let tx = new EthTransaction({
        nonce,
        gasPrice,
        gasLimit: DEFAULT_GAS_LIMIT,
        to: transaction.recipient,
        value: new BN(value.toString()),
        data: '0x',
    }, chainParams);

    const txBuffer = rlp.encode([
        bnToUnpaddedBuffer(tx.nonce),
        bnToUnpaddedBuffer(tx.gasPrice),
        bnToUnpaddedBuffer(tx.gasLimit),
        tx.to !== undefined ? tx.to.buf : Buffer.from([]),
        bnToUnpaddedBuffer(tx.value),
        tx.data,
        bnToUnpaddedBuffer(new BN(account.currency.ethereumLikeInfo?.chainId as number)),
        Buffer.from([]),
        Buffer.from([])
    ]);

    return { tx, txBuffer, chainParams };
};

export default buildTransaction;

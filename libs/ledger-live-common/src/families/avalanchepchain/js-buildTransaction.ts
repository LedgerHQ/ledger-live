import type { Transaction } from "./types";
import { BN } from "avalanche";
import { avalancheClient } from "./api/client";
import { UnixNow } from "avalanche/dist/utils";
import { HDHelper } from "./hdhelper";

const buildTransaction = async (transaction: Transaction, hdHelper: HDHelper) => {
    const pChain = avalancheClient().PChain();
    const info = avalancheClient().Info();

    const utxos = await hdHelper.fetchUTXOs();
    const returnAddress = hdHelper.getCurrentAddress();
    const pAddresses = hdHelper.getAllDerivedAddresses();
    const changeAddress = hdHelper.getFirstAvailableAddress();
    const nodeId = await info.getNodeID();
    const startTime: BN = UnixNow().add(new BN(60 * 1)); //TODO: probably should be 2 - 5 minutes out
    const endTime: BN = startTime.add(new BN(1814400)); //TODO: get this from UI
    const amount: BN = new BN(transaction.amount.toString());

    const unsignedTx = await pChain.buildAddDelegatorTx(
        utxos,
        [returnAddress],
        pAddresses,
        [changeAddress],
        nodeId,
        startTime,
        endTime,
        amount,
        [returnAddress]
    );

    return unsignedTx;
};

export default buildTransaction;

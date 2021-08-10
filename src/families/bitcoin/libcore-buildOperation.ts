import type { CryptoCurrency, Account, Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";
import { perCoinLogic } from "./transaction";

async function bitcoinBuildOperation(
  {
    coreOperation,
    existingAccount,
    currency,
  }: {
    coreOperation: CoreOperation;
    existingAccount: Account | null | undefined;
    currency: CryptoCurrency;
  },
  partialOp: Operation
): Promise<Partial<Operation>> {
  const bitcoinLikeOperation = await coreOperation.asBitcoinLikeOperation();
  const bitcoinLikeTransaction = await bitcoinLikeOperation.getTransaction();
  const hash = await bitcoinLikeTransaction.getHash();
  const shape: Partial<Operation> = {
    hash,
  };
  const perCoin = perCoinLogic[currency.id];

  if (perCoin && perCoin.syncReplaceAddress) {
    const { syncReplaceAddress } = perCoin;
    shape.senders = partialOp.senders.map((addr) =>
      syncReplaceAddress(existingAccount, addr)
    );
    shape.recipients = partialOp.recipients.map((addr) =>
      syncReplaceAddress(existingAccount, addr)
    );
  }

  return shape;
}

export default bitcoinBuildOperation;

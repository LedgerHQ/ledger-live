import { FeeNotLoaded, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";

export async function genericGetTransactionStatus(network, kind) {
  return async (account, transaction) => {
    const errors: Record<string, Error> = {};
    const warnings: Record<string, Error> = {};

    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    if (!transaction.fees || !transaction.fees.gt(0)) {
      errors.fees = new FeeNotLoaded();
    }

    return Promise.resolve({ errors, warnings });
  };
}

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { validateTopology } from "./getTransactionStatus";
import { prepareTransferInstruction, submitTransferInstruction } from "../network/gateway";
import { signTransaction } from "../common-logic/transaction/sign";
import { isCantonAccount } from "./serialization";
import type { CantonSigner } from "../types";

type TransferInstructionType =
  | "accept-transfer-instruction"
  | "reject-transfer-instruction"
  | "withdraw-transfer-instruction";

export const buildTransferInstruction =
  (signerContext: SignerContext<CantonSigner>) =>
  async (
    currency: CryptoCurrency,
    deviceId: string,
    account: Account,
    partyId: string,
    contractId: string,
    type: TransferInstructionType,
    reason?: string,
  ) => {
    if (isCantonAccount(account)) {
      const topologyError = await validateTopology(account);
      if (topologyError) {
        throw topologyError;
      }
    }

    const preparedTransaction = await prepareTransferInstruction(currency, partyId, {
      type,
      contract_id: contractId,
      ...(reason && { reason }),
    });

    const { signature } = await signerContext(deviceId, async signer => {
      return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
    });

    await submitTransferInstruction(currency, partyId, preparedTransaction.serialized, signature);
  };

import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account } from "@ledgerhq/types-live";
import { signTransaction } from "./sign";
import type { CantonContext } from "../config";
import { prepareTransferInstruction, submitTransferInstruction } from "../network/gateway";
import type { CantonSigner } from "../types";
import { validateTopology } from "./getTransactionStatus";
import { isCantonAccount } from "./serialization";

type TransferInstructionType =
  | "accept-transfer-instruction"
  | "reject-transfer-instruction"
  | "withdraw-transfer-instruction";

export const buildTransferInstruction =
  (signerContext: SignerContext<CantonSigner>, context: CantonContext) =>
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
      const topologyError = await validateTopology(context, account);
      if (topologyError) {
        throw topologyError;
      }
    }

    const config = await context.config(currency.id);
    const preparedTransaction = await prepareTransferInstruction(config, partyId, {
      type,
      contract_id: contractId,
      ...(reason ? { reason } : {}),
    });

    const { signature } = await signerContext(deviceId, async signer => {
      return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
    });

    await submitTransferInstruction(config, partyId, preparedTransaction.serialized, signature);
  };

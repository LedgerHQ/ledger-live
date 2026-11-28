import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account } from "@ledgerhq/types-live";
import { signTransaction } from "./sign";
import type { CantonContext } from "../config";
import { getCurrencyContext } from "./context";
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

    const currencyContext = await getCurrencyContext(context, currency);
    const preparedTransaction = await prepareTransferInstruction(currencyContext, partyId, {
      type,
      contract_id: contractId,
      ...(reason ? { reason } : {}),
    });

    const { signature } = await signerContext(deviceId, async signer => {
      return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
    });

    await submitTransferInstruction(
      currencyContext,
      partyId,
      preparedTransaction.serialized,
      signature,
    );
  };

import { customWrapper } from "@ledgerhq/wallet-api-server";
import { z } from "zod";

const openOperationDetailsSchema = z.object({
  accountId: z.string().min(1),
  transactionHash: z.string().min(1),
});

/** `walletAccountId` is a Wallet API account id, not a Ledger Wallet account id. */
export type OperationDetailsRequest = { walletAccountId: string; transactionHash: string };

export type OperationDetailsUiHooks = {
  /**
   * Opens the details of the account's operation with the hash, confirmed or pending. Throws
   * `OperationDetailsAccountNotFound` or `OperationDetailsOperationNotFound` when there is none.
   */
  "operationDetails.open": (request: OperationDetailsRequest) => void;
};

export const handlers = ({ uiHooks }: { uiHooks: OperationDetailsUiHooks }) => ({
  "custom.openOperationDetails": customWrapper<z.input<typeof openOperationDetailsSchema>, void>(
    async rawParams => {
      // A ZodError reaches the live app as INVALID_PARAMS.
      const { accountId, transactionHash } = openOperationDetailsSchema.parse(rawParams);
      uiHooks["operationDetails.open"]({ walletAccountId: accountId, transactionHash });
    },
  ),
});

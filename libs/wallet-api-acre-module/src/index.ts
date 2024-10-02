import { CustomModule, serializeTransaction, Transaction } from "@ledgerhq/wallet-api-client";
import {
  AcreMessage,
  MessageSignParams,
  MessageSignResult,
  SignOptions,
  TransactionOptions,
  TransactionSignAndBroadcastParams,
  TransactionSignAndBroadcastResult,
  TransactionSignParams,
  TransactionSignResult,
} from "./types";

export * from "./types";

// TODO maybe find a better way to type the available custom requests with correct types
export class AcreModule extends CustomModule {
  /**
   * Let the user sign the provided message.
   * @param accountId - Ledger Live id of the account
   * @param message - Message the user should sign
   * @param derivationPath - Derivation path to sign the message with
   * @param options - Extra parameters
   *
   * @returns Message signed
   * @throws {@link RpcError} if an error occured on server side
   */
  async messageSign(
    accountId: string,
    message: AcreMessage,
    derivationPath?: string,
    options?: SignOptions,
    meta?: Record<string, unknown>,
  ) {
    const result = await this.request<MessageSignParams, MessageSignResult>(
      "custom.acre.messageSign",
      {
        accountId,
        message,
        derivationPath,
        options,
        meta,
      },
    );

    return Buffer.from(result.hexSignedMessage, "hex");
  }

  /**
   * Let the user sign a transaction that won't be broadcasted by the connected wallet
   * @param accountId - id of the account
   * @param transaction - The transaction object in the currency family-specific format
   * @param options - Extra parameters
   *
   * @returns The raw signed transaction
   * @throws {@link RpcError} if an error occured on server side
   */
  async transactionSign(
    accountId: string,
    transaction: Transaction,
    options?: TransactionOptions,
    meta?: Record<string, unknown>,
  ): Promise<Buffer> {
    const result = await this.request<TransactionSignParams, TransactionSignResult>(
      "custom.acre.transactionSign",
      {
        accountId,
        rawTransaction: serializeTransaction(transaction),
        options,
        meta,
      },
    );

    return Buffer.from(result.signedTransactionHex, "hex");
  }

  /**
   * Let the user sign and broadcast a transaction
   * @param accountId - id of the account
   * @param transaction - The transaction object in the currency family-specific format
   * @param options - Extra parameters
   *
   * @returns The transaction hash
   * @throws {@link RpcError} if an error occured on server side
   */
  async transactionSignAndBroadcast(
    accountId: string,
    transaction: Transaction,
    options?: TransactionOptions,
    meta?: Record<string, unknown>,
  ): Promise<string> {
    const result = await this.request<
      TransactionSignAndBroadcastParams,
      TransactionSignAndBroadcastResult
    >("custom.acre.transactionSignAndBroadcast", {
      accountId,
      rawTransaction: serializeTransaction(transaction),
      options,
      meta,
    });

    return result.transactionHash;
  }
}

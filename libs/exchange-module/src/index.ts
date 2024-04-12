import { CustomModule, Transaction, serializeTransaction } from "@ledgerhq/wallet-api-client";
import {
  ExchangeCompleteParams,
  ExchangeCompleteResult,
  ExchangeStartFundParams,
  ExchangeStartResult,
  ExchangeStartSellParams,
  ExchangeStartSwapParams,
  SwapLiveError,
} from "./types";

export * from "./types";

// TODO maybe find a better way to type the available custom requests with correct types
export class ExchangeModule extends CustomModule {
  /**
   * Start the exchange process by generating a nonce on Ledger device
   * @param exchangeType - used by the exchange transport to discern between swap/sell/fund
   *
   * @returns - A transaction ID used to complete the exchange process
   */
  async startFund() {
    const result = await this.request<ExchangeStartFundParams, ExchangeStartResult>(
      "custom.exchange.start",
      {
        exchangeType: "FUND",
      },
    );

    return result.transactionId;
  }

  /**
   * Start the exchange process by generating a nonce on Ledger device
   * @param provider - provider's id
   *
   * @returns - A transaction ID used to complete the exchange process
   */
  async startSell({ provider }: Omit<ExchangeStartSellParams, "exchangeType">) {
    const result = await this.request<ExchangeStartSellParams, ExchangeStartResult>(
      "custom.exchange.start",
      {
        exchangeType: "SELL",
        provider,
      },
    );

    return result.transactionId;
  }

  /**
   * Start the swap process by generating a nonce on Ledger device
   * @param exchangeType - used by the exchange transport to discern between swap/sell/fund
   *
   * @returns - A transaction ID used to complete the exchange process
   */
  async startSwap({
    exchangeType,
    provider,
    fromAccountId,
    toAccountId,
    tokenCurrency,
  }: ExchangeStartSwapParams) {
    const result = await this.request<ExchangeStartSwapParams, ExchangeStartResult>(
      "custom.exchange.start",
      {
        exchangeType,
        provider,
        fromAccountId,
        toAccountId,
        tokenCurrency,
      },
    );

    return result.transactionId;
  }

  /**
   * Complete an exchange swap process by passing by the exchange content and its signature.
   * User will be prompted on its device to approve the swap exchange operation.
   * If the exchange is validated, the transaction is then signed and broadcasted to the network.
   * @param provider - Used to verify the signature
   * @param fromAccountId - Identifier of the account used as a source for the tx or parent account (for "new token")
   * @param toAccountId - Identifier of the account or parent account (for "new token") used as a destination
   * @param swapId - Identifier of the swap used by backend
   * @param tokenCurrency - "new token" used in the transaction, not listed yet in wallet-api list
   * @param transaction - Transaction containing the recipient and amount
   * @param binaryPayload - Blueprint of the data that we'll allow signing
   * @param signature - Ensures the source of the payload
   * @param feesStrategy - Slow / Medium / Fast
   *
   * @returns - The broadcasted transaction hash.
   */
  async completeSwap({
    provider,
    fromAccountId,
    toAccountId,
    swapId,
    transaction,
    binaryPayload,
    signature,
    feeStrategy,
    tokenCurrency,
  }: {
    provider: string;
    fromAccountId: string;
    toAccountId: string;
    swapId: string;
    transaction: Transaction;
    binaryPayload: string;
    signature: string;
    feeStrategy: ExchangeCompleteParams["feeStrategy"];
    tokenCurrency?: string;
  }) {
    const result = await this.request<ExchangeCompleteParams, ExchangeCompleteResult>(
      "custom.exchange.complete",
      {
        exchangeType: "SWAP",
        provider,
        fromAccountId,
        toAccountId,
        swapId,
        rawTransaction: serializeTransaction(transaction),
        hexBinaryPayload: binaryPayload,
        hexSignature: signature,
        feeStrategy,
        tokenCurrency,
      },
    );

    return result.transactionHash;
  }

  /**
   * Complete an exchange sell process by passing by the exchange content and its signature.
   * User will be prompted on its device to approve the sell exchange operation.
   * If the exchange is validated, the transaction is then signed and broadcasted to the network.
   * @param provider - Used to verify the signature
   * @param fromAccountId - Identifier of the account used as a source for the tx
   * @param transaction - Transaction containing the recipient and amount
   * @param binaryPayload - Blueprint of the data that we'll allow signing
   * @param signature - Ensures the source of the payload
   * @param feesStrategy - Slow / Medium / Fast
   *
   * @returns - The broadcasted transaction hash.
   */
  async completeSell({
    provider,
    fromAccountId,
    transaction,
    binaryPayload,
    signature,
    feeStrategy,
  }: {
    provider: string;
    fromAccountId: string;
    transaction: Transaction;
    binaryPayload: Buffer;
    signature: Buffer;
    feeStrategy: ExchangeCompleteParams["feeStrategy"];
  }): Promise<string> {
    const result = await this.request<ExchangeCompleteParams, ExchangeCompleteResult>(
      "custom.exchange.complete",
      {
        exchangeType: "SELL",
        provider,
        fromAccountId,
        rawTransaction: serializeTransaction(transaction),
        hexBinaryPayload: binaryPayload.toString("hex"),
        hexSignature: signature.toString("hex"),
        feeStrategy,
      },
    );

    return result.transactionHash;
  }

  /**
   * open a drawer to display errors that Ledger live can't display itself
   * @param error, the error to display
   * @returns nothing
   */
  async throwExchangeErrorToLedgerLive({
    error,
  }: {
    error: SwapLiveError | undefined;
  }): Promise<void> {
    await this.request<SwapLiveError | undefined, void>("custom.exchange.error", error);
    return;
  }

  /**
   * Complete an exchange fund process by passing by the exchange content and its signature.
   * User will be prompted on its device to approve the fund exchange operation.
   * If the exchange is validated, the transaction is then signed and broadcasted to the network.
   * @param provider - Used to verify the signature
   * @param fromAccountId - Identifier of the account used as a source for the tx
   * @param transaction - Transaction containing the recipient and amount
   * @param binaryPayload - Blueprint of the data that we'll allow signing
   * @param signature - Ensures the source of the payload
   * @param feesStrategy - Slow / Medium / Fast
   *
   * @returns - The broadcasted transaction hash.
   */
  async completeFund({
    provider,
    fromAccountId,
    transaction,
    binaryPayload,
    signature,
    feeStrategy,
    tokenCurrency,
  }: {
    provider: string;
    fromAccountId: string;
    transaction: Transaction;
    binaryPayload: Buffer;
    signature: Buffer;
    feeStrategy: ExchangeCompleteParams["feeStrategy"];
    tokenCurrency?: string;
  }): Promise<string> {
    const result = await this.request<ExchangeCompleteParams, ExchangeCompleteResult>(
      "custom.exchange.complete",
      {
        exchangeType: "FUND",
        provider,
        fromAccountId,
        rawTransaction: serializeTransaction(transaction),
        hexBinaryPayload: binaryPayload.toString("hex"),
        hexSignature: signature.toString("hex"),
        feeStrategy,
        tokenCurrency,
      },
    );

    return result.transactionHash;
  }
}

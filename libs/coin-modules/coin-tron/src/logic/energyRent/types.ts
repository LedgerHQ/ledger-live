import type {
  TronifyUnsignedTransaction,
  TronifySignedTransaction,
} from "../../network/tronify/types";

/** Energy-rent providers integrated in coin-tron. Only Tronify for now. */
export type EnergyProviderId = "tronify";

/** Lifecycle status of an energy-rent order. */
export type EnergyRentStatus = "pending" | "paid" | "delivered" | "failed" | "unknown";

/** Inputs to request a quote / create an order, provider-agnostic. */
export type EnergyRentRequest = {
  /** Address paying for the rent (buyer). */
  payerAddress: string;
  /** Address that receives the delegated energy. */
  receiverAddress: string;
  /** Energy units to rent. */
  energy: bigint;
  /** Desired rental duration in seconds; adapted to the provider's supported windows. */
  durationSeconds: number;
  /** Extra TRX to bundle for bandwidth, in TRX (e.g. 0.8). Defaults to 0. */
  extraTrx?: number;
};

/** Provider-agnostic price quote. Amounts kept as provider-native decimal strings. */
export type EnergyRentQuote = {
  energy: bigint;
  /**
   * Rental window actually quoted. Providers only sell fixed windows, so this is rounded up
   * from the requested duration and may exceed it (the price reflects this window, not the request).
   */
  durationSeconds: number;
  /** Currency the buyer pays in, e.g. "USDT" or "TRX". */
  payCoinCode: string;
  /** Total amount to pay, decimal string in `payCoinCode` units. */
  payCoinAmt: string;
  fees: {
    energy: string;
    trx: string;
    bandwidth: string;
    activateAccount: string;
  };
};

/** A created order plus the unsigned payment the wallet must sign. */
export type EnergyRentOrder = {
  orderId: string;
  /** Unsigned payment transaction to sign (do not broadcast) and pass to `broadcastEnergyRentTransaction`. */
  transaction: EnergyRentUnsignedTransaction;
  payCoinCode: string;
  payCoinAmt: string;
};

// Tron-shaped payment tx; aliased at the logic layer so callers don't import from network/.
export type EnergyRentUnsignedTransaction = TronifyUnsignedTransaction;
export type EnergyRentSignedTransaction = TronifySignedTransaction;

/**
 * An energy-rent marketplace client. `getEnergyRentQuote` / `craftEnergyRentTransaction` /
 * `broadcastEnergyRentTransaction` / `getEnergyRentStatus` in the switch delegate to this.
 */
export interface EnergyProvider {
  id: EnergyProviderId;
  getQuote(request: EnergyRentRequest): Promise<EnergyRentQuote>;
  createOrder(request: EnergyRentRequest): Promise<EnergyRentOrder>;
  submitPayment(payment: {
    orderId: string;
    signedTransaction: EnergyRentSignedTransaction;
  }): Promise<void>;
  getOrderStatus(order: EnergyRentOrderRef): Promise<EnergyRentStatus>;
}

/** Identifies an order to look up. The payer address is required to scope the provider query. */
export type EnergyRentOrderRef = {
  orderId: string;
  payerAddress: string;
};

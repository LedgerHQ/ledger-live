// Wire types for the Tronify energy-rental REST API.
// Endpoints live under `${baseUrl}/api/tronRent/` and all return the envelope below.
// Docs: https://docs-tron.en.tronify.io

/** Standard Tronify response envelope. `resCode` 100 means success. */
export type TronifyResponse<T> = {
  resCode: number;
  resMsg: string;
  data: T;
};

/**
 * Common energy-order parameters shared by `queryPreorderInfo` (quote) and
 * `addTronRentRecord` (create order). `orderType`, `tradeType` and `sourceFlag`
 * are injected by the client and so are omitted here.
 */
export type TronifyEnergyOrderParams = {
  /** Buyer wallet address (base58). */
  fromAddress: string;
  /** Address that receives the delegated energy (base58). */
  pledgeAddress: string;
  /** Energy units to rent; Tronify minimum is 15000. */
  pledgeNum: number;
  /** Rental duration — days (0-30). */
  pledgeDay: string;
  /** Rental duration — hours (0, 1, 3 for fastTrade). */
  pledgeHour: string;
  /** Rental duration — minutes (0, 10 for fastTrade). */
  pledgeMinute: string;
  /** Extra TRX to bundle for bandwidth: "0" (none) or a value in [0.8, 500]. */
  extraTrxNum: string;
  /** Extra bandwidth to rent; "0" or omitted means none. */
  pledgeBandwidthNum?: string;
};

export type QueryPreorderInfoData = {
  fromAddress: string;
  pledgeAddress: string;
  pledgeDay: string;
  pledgeHour: string;
  pledgeMinute: string;
  source: string;
  orderType: string;
  orderPrice: number;
  pledgeNum: number;
  pledgeTrxNum: string;
  /** Whether paying the rent in USDT (Flow 2) is currently available. */
  usdtModeAvailable: boolean;
  /** Currency the buyer pays in, e.g. "USDT" or "TRX". */
  payCoinCode: string;
  /** Total amount to pay, decimal string in `payCoinCode` units. */
  payCoinAmt: string;
  extraTrxNum: string;
  pledgeBandwidthNum: string;
  activeAccountFee: string;
  purchaseTRXFee: string;
  purchaseBandwidthFee: string;
  purchaseEnergyFee: string;
};

/**
 * Unsigned Tron transaction handed back by `addTronRentRecord`. It is the payment
 * the buyer must sign (but NOT broadcast) and return via `uploadHash`; Tronify
 * broadcasts it and delegates the energy.
 */
export type TronifyUnsignedTransaction = {
  visible: boolean;
  txID: string;
  raw_data: Record<string, unknown>;
  raw_data_hex: string;
};

export type TronifySignedTransaction = TronifyUnsignedTransaction & {
  signature: string[];
};

export type AddTronRentRecordData = {
  orderId: string;
  transaction: TronifyUnsignedTransaction;
  payCoinCode: string;
  payCoinAmt: string;
  purchaseEnergyFee: string;
  purchaseTRXFee: string;
  purchaseBandwidthFee: string;
  activeAccountFee: string;
};

export type UploadHashRequest = {
  /** Order id returned by `addTronRentRecord`. */
  orderId: string;
  /** `txID` of the payment transaction returned by `addTronRentRecord`. */
  fromHash: string;
  /** The signed (not broadcast) payment transaction. */
  signedData: TronifySignedTransaction;
};

/** `uploadHash` returns an empty object on success. */
export type UploadHashData = Record<string, never>;

export type TradesRequest = {
  /** 0: by time desc, 1: by energy+bandwidth desc, 2: by amount desc, 3: by energy desc. */
  sort: "0" | "1" | "2" | "3";
  page: number;
  pageSize: number;
};

export type TronifyTradeOrder = {
  orderId: string;
  fromAddress: string;
  pledgeAddress: string;
  pledgeNum: number;
  orderPrice: string;
  orderType: string;
  pledgeDay: string;
  createTime: string;
};

export type TradesData = {
  data: TronifyTradeOrder[];
  pagination: TronifyPagination;
};

export type TronifyPagination = {
  page: number;
  pageSize: number;
  total: number;
};

/** Lifecycle of a purchase order as reported by `mypayorder`. */
export type TronifyOrderStatus = "wait_deposit_send" | "wait_sale" | "complete" | "timeout";

export type MyPayOrderRequest = {
  /** Buyer wallet address whose orders are returned. */
  fromAddress: string;
  /**
   * Order filter — NOT the "ENERGY" order type used elsewhere:
   * "1" active (wait_deposit_send, wait_sale), "0" completed, any other value returns all.
   */
  orderType: string;
  page: number;
  pageSize: number;
};

export type TronifyPurchaseOrder = {
  orderId: string;
  fromAddress: string;
  pledgeAddress: string;
  pledgeNum: number;
  salePledgeNum: number;
  freezePledgeNum: number;
  leftPledgeNum: number;
  orderPrice: string;
  orderType: string;
  pledgeDay: string;
  orderStatus: TronifyOrderStatus;
  createTime: string;
};

export type MyPayOrderData = {
  data: TronifyPurchaseOrder[];
  pagination: TronifyPagination;
};

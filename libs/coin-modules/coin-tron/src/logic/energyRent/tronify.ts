import {
  addTronRentRecord,
  myPayOrder,
  queryPreorderInfo,
  uploadHash,
} from "../../network/tronify";
import type { TronifyEnergyOrderParams, TronifyOrderStatus } from "../../network/tronify/types";
import type { EnergyProvider, EnergyRentRequest, EnergyRentStatus } from "./types";

type TronifyDuration = Pick<TronifyEnergyOrderParams, "pledgeDay" | "pledgeHour" | "pledgeMinute">;

/** Round a desired duration up to the nearest fastTrade window Tronify sells. */
function toTronifyDuration(seconds: number): TronifyDuration {
  if (seconds <= 10 * 60) return { pledgeDay: "0", pledgeHour: "0", pledgeMinute: "10" };
  if (seconds <= 60 * 60) return { pledgeDay: "0", pledgeHour: "1", pledgeMinute: "0" };
  if (seconds <= 3 * 60 * 60) return { pledgeDay: "0", pledgeHour: "3", pledgeMinute: "0" };
  const days = Math.min(30, Math.max(1, Math.ceil(seconds / 86_400)));
  return { pledgeDay: String(days), pledgeHour: "0", pledgeMinute: "0" };
}

function durationToSeconds({ pledgeDay, pledgeHour, pledgeMinute }: TronifyDuration): number {
  return Number(pledgeDay) * 86_400 + Number(pledgeHour) * 3_600 + Number(pledgeMinute) * 60;
}

// [assumption] Mapping of Tronify's purchase-order lifecycle onto our status; to be confirmed
// with Tronify (reconciliation Q7). `wait_sale` means the payment landed and the order is
// waiting to be filled by a seller, i.e. energy not yet delegated.
const ORDER_STATUS: Record<TronifyOrderStatus, EnergyRentStatus> = {
  wait_deposit_send: "pending",
  wait_sale: "paid",
  complete: "delivered",
  timeout: "failed",
};

/** Any value other than "0" (completed) or "1" (active) makes Tronify return every order. */
const ALL_ORDERS = "2";

// A just-created order is among the most recent, so a single page suffices in practice.
const ORDER_LOOKUP_PAGE_SIZE = 50;

function toOrderParams(request: EnergyRentRequest): TronifyEnergyOrderParams {
  return {
    fromAddress: request.payerAddress,
    pledgeAddress: request.receiverAddress,
    pledgeNum: Number(request.energy),
    extraTrxNum: request.extraTrx ? String(request.extraTrx) : "0",
    ...toTronifyDuration(request.durationSeconds),
  };
}

export const tronifyProvider: EnergyProvider = {
  id: "tronify",

  async getQuote(request) {
    const params = toOrderParams(request);
    const data = await queryPreorderInfo(params);
    return {
      energy: BigInt(data.pledgeNum),
      durationSeconds: durationToSeconds(params),
      payCoinCode: data.payCoinCode,
      payCoinAmt: data.payCoinAmt,
      fees: {
        energy: data.purchaseEnergyFee,
        trx: data.purchaseTRXFee,
        bandwidth: data.purchaseBandwidthFee,
        activateAccount: data.activeAccountFee,
      },
    };
  },

  async createOrder(request) {
    const data = await addTronRentRecord(toOrderParams(request));
    return {
      orderId: data.orderId,
      transaction: data.transaction,
      payCoinCode: data.payCoinCode,
      payCoinAmt: data.payCoinAmt,
    };
  },

  async submitPayment({ orderId, signedTransaction }) {
    await uploadHash({
      orderId,
      fromHash: signedTransaction.txID,
      signedData: signedTransaction,
    });
  },

  async getOrderStatus({ orderId, payerAddress }) {
    // `mypayorder` has no orderId filter, so we page through the payer's orders and match.
    const { data } = await myPayOrder({
      fromAddress: payerAddress,
      orderType: ALL_ORDERS,
      page: 1,
      pageSize: ORDER_LOOKUP_PAGE_SIZE,
    });

    const order = data.find(entry => entry.orderId === orderId);
    return order ? (ORDER_STATUS[order.orderStatus] ?? "unknown") : "unknown";
  },
};

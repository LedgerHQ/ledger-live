import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import coinConfig, { type TronifyProviderConfig } from "../../config";
import { EnergyRentProviderNotConfigured, TronifyApiError } from "../../types/errors";
import type {
  AddTronRentRecordData,
  MyPayOrderData,
  MyPayOrderRequest,
  QueryPreorderInfoData,
  TronifyEnergyOrderParams,
  TronifyResponse,
  UploadHashData,
  UploadHashRequest,
} from "./types";

const TRONIFY_SUCCESS = 100;

const ENERGY_ORDER_DEFAULTS = {
  orderType: "ENERGY",
  tradeType: "fastTrade",
} as const;

function getTronifyConfig(): TronifyProviderConfig {
  const tronify = coinConfig.getCoinConfig().energyRent?.tronify;
  if (!tronify) {
    throw new EnergyRentProviderNotConfigured("Tronify provider is not configured in coin-config");
  }
  return tronify;
}

async function post<Body extends object, Data>(endpoint: string, body: Body): Promise<Data> {
  const { url } = getTronifyConfig();
  const { data } = await network<TronifyResponse<Data>, Body>({
    method: "POST",
    url: `${url}/api/tronRent/${endpoint}`,
    data: body,
  });

  if (data.resCode !== TRONIFY_SUCCESS) {
    log("tronify-error", data.resMsg, { endpoint, resCode: data.resCode });
    throw new TronifyApiError(data.resMsg, { resCode: data.resCode });
  }

  return data.data;
}

/** Query a price quote for an energy rental. No order is created. */
export async function queryPreorderInfo(
  params: TronifyEnergyOrderParams,
): Promise<QueryPreorderInfoData> {
  const { sourceFlag } = getTronifyConfig();
  return post("queryPreorderInfo", { ...ENERGY_ORDER_DEFAULTS, ...params, sourceFlag });
}

/** Create an energy-rent order; returns the order id and an unsigned payment transaction. */
export async function addTronRentRecord(
  params: TronifyEnergyOrderParams,
): Promise<AddTronRentRecordData> {
  const { sourceFlag } = getTronifyConfig();
  return post("addTronRentRecord", { ...ENERGY_ORDER_DEFAULTS, ...params, sourceFlag });
}

/** Submit the signed (not broadcast) payment; Tronify broadcasts it and delegates energy. */
export async function uploadHash(request: UploadHashRequest): Promise<UploadHashData> {
  return post("uploadHash", request);
}

/** List a buyer's own purchase orders, including each order's `orderStatus`. */
export async function myPayOrder(request: MyPayOrderRequest): Promise<MyPayOrderData> {
  const { sourceFlag } = getTronifyConfig();
  return post("mypayorder", { ...request, sourceFlag });
}

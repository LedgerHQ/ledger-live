import type { Logger } from "@ledgerhq/coin-module-framework/config";
import network from "@ledgerhq/live-network";
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

/**
 * The single "Tronify is actually configured" accessor. Remote coin-config is unvalidated, so the
 * provider name alone is not proof of configuration: require the fields every request needs (url,
 * sourceFlag) rather than mere presence, or an empty `tronify: {}` would slip through here and later
 * build requests against an `undefined` URL. Also the gate `getEnergyProvider` uses before opening
 * raw-signing (craftRawTransaction).
 */
export function getTronifyConfig(): TronifyProviderConfig {
  const tronify = coinConfig.getCoinConfig().energyRent?.tronify;
  if (!tronify?.url || !tronify.sourceFlag) {
    throw new EnergyRentProviderNotConfigured(
      "Tronify provider url/sourceFlag is missing in coin-config",
    );
  }
  return tronify;
}

async function post<Body extends object, Data>(
  logger: Logger,
  endpoint: string,
  body: Body,
): Promise<Data> {
  const { url } = getTronifyConfig();
  const { data } = await network<TronifyResponse<Data>, Body>({
    method: "POST",
    url: `${url}/api/tronRent/${endpoint}`,
    data: body,
  });

  if (data.resCode !== TRONIFY_SUCCESS) {
    logger("tronify-error", data.resMsg, { endpoint, resCode: data.resCode });
    throw new TronifyApiError(data.resMsg, { resCode: data.resCode });
  }

  return data.data;
}

/** Query a price quote for an energy rental. No order is created. */
export async function queryPreorderInfo(
  logger: Logger,
  params: TronifyEnergyOrderParams,
): Promise<QueryPreorderInfoData> {
  const { sourceFlag } = getTronifyConfig();
  return post(logger, "queryPreorderInfo", { ...ENERGY_ORDER_DEFAULTS, ...params, sourceFlag });
}

/** Create an energy-rent order; returns the order id and an unsigned payment transaction. */
export async function addTronRentRecord(
  logger: Logger,
  params: TronifyEnergyOrderParams,
): Promise<AddTronRentRecordData> {
  const { sourceFlag } = getTronifyConfig();
  return post(logger, "addTronRentRecord", { ...ENERGY_ORDER_DEFAULTS, ...params, sourceFlag });
}

/** Submit the signed (not broadcast) payment; Tronify broadcasts it and delegates energy. */
export async function uploadHash(
  logger: Logger,
  request: UploadHashRequest,
): Promise<UploadHashData> {
  return post(logger, "uploadHash", request);
}

/** List a buyer's own purchase orders, including each order's `orderStatus`. */
export async function myPayOrder(
  logger: Logger,
  request: MyPayOrderRequest,
): Promise<MyPayOrderData> {
  const { sourceFlag } = getTronifyConfig();
  return post(logger, "mypayorder", { ...request, sourceFlag });
}

import type { Logger } from "@ledgerhq/coin-module-framework/config";
import coinConfig from "../../config";
import { EnergyRentProviderNotConfigured } from "../../types/errors";
import { tronifyProvider } from "./tronify";
import type {
  EnergyProvider,
  EnergyRentOrder,
  EnergyRentOrderRef,
  EnergyRentQuote,
  EnergyRentRequest,
  EnergyRentSignedTransaction,
  EnergyRentStatus,
} from "./types";

export * from "./types";

/** Resolve the energy-rent provider selected in coin-config (the single-file switch). */
export function getEnergyProvider(): EnergyProvider {
  const energyRent = coinConfig.getCoinConfig().energyRent;
  if (!energyRent) {
    throw new EnergyRentProviderNotConfigured("No energy-rent provider configured");
  }
  switch (energyRent.provider) {
    case "tronify":
      return tronifyProvider;
    default:
      // `provider` comes from remote coin-config, so guard against an unknown value at runtime.
      throw new EnergyRentProviderNotConfigured(
        `Unsupported energy-rent provider: ${energyRent.provider}`,
      );
  }
}

export function getEnergyRentQuote(
  logger: Logger,
  request: EnergyRentRequest,
): Promise<EnergyRentQuote> {
  return getEnergyProvider().getQuote(logger, request);
}

export function craftEnergyRentTransaction(
  logger: Logger,
  request: EnergyRentRequest,
): Promise<EnergyRentOrder> {
  return getEnergyProvider().createOrder(logger, request);
}

export function broadcastEnergyRentTransaction(
  logger: Logger,
  payment: { orderId: string; signedTransaction: EnergyRentSignedTransaction },
): Promise<void> {
  return getEnergyProvider().submitPayment(logger, payment);
}

export function getEnergyRentStatus(
  logger: Logger,
  order: EnergyRentOrderRef,
): Promise<EnergyRentStatus> {
  return getEnergyProvider().getOrderStatus(logger, order);
}

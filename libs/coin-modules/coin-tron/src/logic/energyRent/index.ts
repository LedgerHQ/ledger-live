import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../../config";
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
export function getEnergyProvider(config: TronCoinConfig): EnergyProvider {
  const energyRent = config.energyRent;
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
  config: TronCoinConfig,
  request: EnergyRentRequest,
): Promise<EnergyRentQuote> {
  return getEnergyProvider(config).getQuote(logger, config, request);
}

export function craftEnergyRentTransaction(
  logger: Logger,
  config: TronCoinConfig,
  request: EnergyRentRequest,
): Promise<EnergyRentOrder> {
  return getEnergyProvider(config).createOrder(logger, config, request);
}

export function broadcastEnergyRentTransaction(
  logger: Logger,
  config: TronCoinConfig,
  payment: { orderId: string; signedTransaction: EnergyRentSignedTransaction },
): Promise<void> {
  return getEnergyProvider(config).submitPayment(logger, config, payment);
}

export function getEnergyRentStatus(
  logger: Logger,
  config: TronCoinConfig,
  order: EnergyRentOrderRef,
): Promise<EnergyRentStatus> {
  return getEnergyProvider(config).getOrderStatus(logger, config, order);
}

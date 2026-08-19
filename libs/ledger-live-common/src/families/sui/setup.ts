// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { SuiAccount, TransactionStatus, createBridges, type Transaction } from "@ledgerhq/coin-sui";
import Transport from "@ledgerhq/hw-transport";
import Sui from "@ledgerhq/hw-app-sui";
import type { Bridge } from "@ledgerhq/types-live";
import { SuiCoinConfig, SuiTransport } from "@ledgerhq/coin-sui/config";
import { type SuiSigner } from "@ledgerhq/coin-sui/types";
import { getAddress as suiResolver } from "@ledgerhq/coin-sui/signer/index";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<SuiSigner> = (transport: Transport) => {
  return new Sui(transport, "default_sui_scramble_key");
};

/**
 * Module-level transport selection. Set by the app at startup (via `useFeature` →
 * `setSuiTransport`); read by every `getCurrencyConfig` call. Mirrors the
 * `ldmkCosmosSigner` pattern.
 */
let _suiTransport: SuiTransport = "json";

export const setSuiTransport = (transport: SuiTransport): void => {
  _suiTransport = transport;
};

const SUI_TRANSPORTS: readonly SuiTransport[] = ["json", "grpc", "graphql"];

type SuiTransportFeature = { enabled?: boolean; params?: { transport?: string } } | null;

/**
 * Resolves the `suiTransport` feature flag to a transport, defaulting to `json`.
 *
 * Remote flag payloads reach the app unparsed — the registry's zod schemas supply defaults but do not
 * validate the fetched config — so neither field is trusted to hold its declared type. `enabled` must
 * be exactly `true`, because a truthiness test would let `"false"` switch a transport on, and an
 * unrecognised `params.transport` falls back rather than being returned as a `SuiTransport`.
 */
export const resolveSuiTransport = (suiTransportFeature?: SuiTransportFeature): SuiTransport => {
  if (suiTransportFeature?.enabled !== true) return "json";
  const transport = suiTransportFeature.params?.transport;
  return SUI_TRANSPORTS.find(candidate => candidate === transport) ?? "json";
};

const getCurrencyConfig = (currencyId?: string): SuiCoinConfig => {
  if (!currencyId) throw new Error("sui: currency not defined");
  const base = getCurrencyConfiguration<SuiCoinConfig>(currencyId);
  // `features.transport` is owned by the central feature flag, not LiveConfig.
  return { ...base, features: { transport: _suiTransport } };
};

const bridge: Bridge<Transaction, SuiAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, suiResolver);

export { bridge, resolver };

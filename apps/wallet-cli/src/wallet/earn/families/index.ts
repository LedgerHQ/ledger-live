/**
 * Earn family adapter registry.
 *
 * The `earn deposit` / `earn withdraw` commands resolve a currency's `family` to one adapter here
 * instead of switching on family details inline. Each adapter owns the family-specific argument
 * mapping and required-flag validation (EVM withdraw needs `--product`, Solana withdraw needs
 * `--stake-account`, etc.) and forwards to the existing pipeline functions, so the command layer
 * only has to look up an adapter and dispatch.
 */

import type { CommandOutput } from "../../../output";
import type { WalletAdapter } from "../../index";
import type { AccountDescriptor } from "../../models";
import type { EarnDeviceContext } from "../device-context";
import type { EarnDepositResult, EarnWithdrawResult } from "../types";
import { evmEarnAdapter } from "./evm";
import { solanaEarnAdapter } from "./solana";

export type { EarnDeviceContext } from "../device-context";

/** Arguments the `earn deposit` command hands to a family adapter. */
export type EarnDepositArgs = {
  /** Resolved source account. */
  descriptor: AccountDescriptor;
  /** Canonical network string, e.g. "ethereum:main". */
  network: string;
  /** `--product`: ETH vault id or Solana validator vote account (required by the deposit command). */
  product: string;
  /** `--amount`: human deposit amount (required by the deposit command). */
  amount: string;
  /** When true, prepare/validate only — never sign or broadcast. */
  dryRun: boolean;
  /** Wallet adapter used to build/sign/broadcast intents. */
  wallet: WalletAdapter;
  /** Output sink for progress + final result. */
  out: CommandOutput;
  /** Device context. Omitted only when `dryRun` is true. */
  device?: EarnDeviceContext;
};

/** Arguments the `earn withdraw` command hands to a family adapter. */
export type EarnWithdrawArgs = {
  /** Resolved source account. */
  descriptor: AccountDescriptor;
  /** Canonical network string, e.g. "ethereum:main". */
  network: string;
  /** `--product`: ETH vault id (required by the EVM adapter). */
  product?: string;
  /** `--stake-account`: Solana stake account address (required by the Solana adapter). */
  stakeAccount?: string;
  /** `--amount`: human amount; semantics are family-specific (EVM partial vs full exit, Solana reject). */
  amount?: string;
  /** `--finalize`: Solana two-phase control (deactivate vs withdraw). */
  finalize: boolean;
  /** When true, prepare/validate only — never sign or broadcast. */
  dryRun: boolean;
  /** Wallet adapter used to build/sign/broadcast intents. */
  wallet: WalletAdapter;
  /** Output sink for progress + final result. */
  out: CommandOutput;
  /** Device context. Omitted only when `dryRun` is true. */
  device?: EarnDeviceContext;
};

/** Family-specific earn deposit/withdraw entry points behind a uniform interface. */
export type EarnFamilyAdapter = {
  deposit(args: EarnDepositArgs): Promise<EarnDepositResult>;
  withdraw(args: EarnWithdrawArgs): Promise<EarnWithdrawResult>;
};

const EARN_FAMILY_ADAPTERS: Record<string, EarnFamilyAdapter> = {
  evm: evmEarnAdapter,
  solana: solanaEarnAdapter,
};

/** Adapter for a currency `family`, or undefined when earn does not support that family. */
export function getEarnFamilyAdapter(family: string): EarnFamilyAdapter | undefined {
  return EARN_FAMILY_ADAPTERS[family];
}

/** Families the earn commands can act on (used to build the "Supported: …" error hint). */
export function supportedEarnFamilies(): string[] {
  return Object.keys(EARN_FAMILY_ADAPTERS);
}

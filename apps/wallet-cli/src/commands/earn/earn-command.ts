import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { networkStringFromCurrencyId } from "../../shared/accountDescriptor";
import { buildEarnDeviceContext } from "../../wallet/earn/device-context";
import {
  getEarnFamilyAdapter,
  supportedEarnFamilies,
  type EarnDeviceContext,
  type EarnFamilyAdapter,
} from "../../wallet/earn/families";
import type { AccountDescriptor } from "../../wallet/models";
import { resolveAccountArg, resolveAccountDescriptor } from "../inputs";

/** Mutable analytics context the earn commands thread through their output sink. */
type EarnCommandCtx = { network: string; account: string };

/** Everything the deposit/withdraw handlers need once the shared prologue has resolved. */
export type ResolvedEarnCommand = {
  descriptor: AccountDescriptor;
  network: string;
  family: string;
  adapter: EarnFamilyAdapter;
  device: EarnDeviceContext | undefined;
};

/**
 * Shared prologue for the `earn deposit` / `earn withdraw` handlers: resolve the account
 * descriptor, derive its network (updating `ctx` for analytics), select the family earn adapter
 * (throwing a consistent "unsupported family for earn <action>" error), and build the device
 * context. Extracted so the two command files don't duplicate this boilerplate.
 */
export async function resolveEarnCommand(params: {
  action: "deposit" | "withdraw";
  account: string | undefined;
  positional: readonly string[];
  ctx: EarnCommandCtx;
  dryRun: boolean;
  deviceTimeoutMs: number;
}): Promise<ResolvedEarnCommand> {
  const { action, account, positional, ctx, dryRun, deviceTimeoutMs } = params;

  const descriptor = await resolveAccountDescriptor(resolveAccountArg(account, positional));
  const network = networkStringFromCurrencyId(descriptor.currencyId);
  ctx.network = network;
  ctx.account = descriptor.id;

  const { family } = getCryptoCurrencyById(descriptor.currencyId);
  const adapter = getEarnFamilyAdapter(family);
  if (!adapter) {
    throw new Error(
      `Unsupported family for earn ${action}: ${family}. Supported: ${supportedEarnFamilies().join(
        ", ",
      )}.`,
    );
  }

  const device = buildEarnDeviceContext({ descriptor, dryRun, deviceTimeoutMs });

  return { descriptor, network, family, adapter, device };
}

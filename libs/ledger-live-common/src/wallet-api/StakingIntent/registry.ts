import type { Account, AccountLike } from "@ledgerhq/types-live";
import { isAccount } from "../../account/index";
import type { FamilyIntentConfig, StakingIntentDescriptor } from "./types";

const familyRegistries = new Map<string, FamilyIntentConfig[]>();

export function registerFamily(family: string, intents: FamilyIntentConfig[]): void {
  familyRegistries.set(family, intents);
}

export function getFamilyIntentConfigs(family: string): FamilyIntentConfig[] | undefined {
  return familyRegistries.get(family);
}

function toDescriptors(account: Account, configs: FamilyIntentConfig[]): StakingIntentDescriptor[] {
  return configs.map(config => ({
    intent: config.intent,
    label: config.label,
    enabled: config.isEnabled(account),
    params: config.params,
  }));
}

export function resolveIntents(account: AccountLike): StakingIntentDescriptor[] {
  if (!isAccount(account)) {
    return [];
  }
  const configs = familyRegistries.get(account.currency.family);
  if (!configs) {
    return [];
  }
  return toDescriptors(account, configs);
}

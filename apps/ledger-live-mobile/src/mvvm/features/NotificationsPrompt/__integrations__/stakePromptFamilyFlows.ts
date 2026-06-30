import type { ComponentType } from "react";
import type { MobileFamilyFlowExport, StakePromptCase } from "./stakePromptFixtures";

type MobileFamilyFlow = {
  component: ComponentType;
};

const familyModuleNameByAccountKey: Record<StakePromptCase["accountKey"], string> = {
  algorand: "algorand",
  cardano: "cardano",
  celo: "celo",
  cosmos: "cosmos",
  ethereum: "evm",
  hedera: "hedera",
  multiversx: "multiversx",
  near: "near",
  polkadot: "polkadot",
  solana: "solana",
  sui: "sui",
  tezos: "tezos",
};

const stakePromptFlowNamePattern =
  /(Activate|Bond|ClaimRewards|Delegation|Lock|Nominate|Rebond|Redelegation|Registration|Revoke|SimpleOperation|Staking|Unbond|Undelegation|Undelegate|Unlock|Unstaking|Vote|Withdraw|Withdrawing)Flow$/;

const nonStakePromptFlowExports = new Set<MobileFamilyFlowExport>(["TronVoteFlow"]);

const hasComponent = (familyExport: unknown): familyExport is MobileFamilyFlow => {
  const component = (familyExport as { component?: unknown } | null)?.component;
  return component !== null && (typeof component === "function" || typeof component === "object");
};

export const getMobileFamilyFlow = (stakePromptCase: StakePromptCase): MobileFamilyFlow => {
  const moduleName = familyModuleNameByAccountKey[stakePromptCase.accountKey];
  // Load only the family module under test instead of the full ~/families barrel.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const familyModule = require(`~/families/${moduleName}`) as Record<string, unknown>;
  const familyExport = familyModule[stakePromptCase.familyExportKey];

  if (!hasComponent(familyExport)) {
    throw new Error(`${stakePromptCase.familyExportKey} is not a registered mobile family flow`);
  }

  return familyExport;
};

export const findRegisteredStakePromptFlowExports = (): MobileFamilyFlowExport[] => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mobileFamilies = require("~/families") as Record<string, unknown>;

  return Object.entries(mobileFamilies)
    .filter(
      ([familyExportKey, familyExport]) =>
        stakePromptFlowNamePattern.test(familyExportKey) &&
        !nonStakePromptFlowExports.has(familyExportKey) &&
        hasComponent(familyExport),
    )
    .map(([familyExportKey]) => familyExportKey)
    .sort();
};

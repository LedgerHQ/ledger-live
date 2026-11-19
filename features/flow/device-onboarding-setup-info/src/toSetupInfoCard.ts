import type { SetupInfoCard } from "./SetupInfo.types";

const cardByState = new Map<string, SetupInfoCard>([
  ["deviceSetup.setupChoice", "setupChoice"],
  ["deviceSetup.newSeed", "recoveryPhrase"],
  ["deviceSetup.backupRecoveryKey", "recoveryKey"],
  ["deviceSetup.restoreChoice", "restoreChoice"],
  ["deviceSetup.restoreWords", "recoveryPhrase"],
  ["deviceSetup.restoreRecoveryKey", "restoreRecoveryKey"],
]);

const recoveryKeyCards = new Set<SetupInfoCard>(["recoveryKey", "restoreRecoveryKey"]);

export function toSetupInfoCard(
  machineState: string,
  reportsRecoveryKey: boolean,
): SetupInfoCard | undefined {
  const card = cardByState.get(machineState);
  if (card && recoveryKeyCards.has(card) && !reportsRecoveryKey) return undefined;
  return card;
}

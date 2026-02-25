/*
 * Types
 */
export enum SEED_STATE {
  NEW_SEED = "new_seed",
  RESTORE = "restore",
}

export enum COMPANION_STATE {
  SETUP = "setup",
  EXIT = "exit",
}

export type CompanionStep = SEED_STATE | COMPANION_STATE;

export type SeedPathStatus =
  | "choice_new_or_restore"
  | "new_seed"
  | "choice_restore_direct_or_recover"
  | "restore_seed"
  | "recover_seed"
  | "backup_charon"
  | "restore_charon";

// Because of https://github.com/typescript-eslint/typescript-eslint/issues/1197
export enum FirstStepCompanionStepKey {
  EarlySecurityCheckCompleted = 0,
  Pin,
  Seed,
  Ready,
  Sync,
  Exit,
}

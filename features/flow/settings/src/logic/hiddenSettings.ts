import { z } from "zod";

export const SETTING_IDS = ["myLedgerProvider", "mockAppUpdate"] as const;

const SettingIdSchema = z.enum(SETTING_IDS);

export type SettingId = z.infer<typeof SettingIdSchema>;

export function isSettingId(value: unknown): value is SettingId {
  return SettingIdSchema.safeParse(value).success;
}

export function getHiddenSettings(rowsToHide: unknown): ReadonlySet<SettingId> {
  if (!Array.isArray(rowsToHide)) return new Set();
  return new Set(rowsToHide.filter(isSettingId));
}

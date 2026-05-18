import { z } from "zod";

export type EarnUiVersion = `v${number}`;

const coercedString = z.coerce.string();

function parseEarnUiVersionStringOrNull(raw: string): EarnUiVersion | null {
  const bare = raw.startsWith("v") ? raw.slice(1) : raw;
  const n = z.coerce.number().int().positive().safeParse(bare);
  return n.success ? `v${n.data}` : null;
}

export function normalizeEarnUiVersionOrNull(
  raw: string | number | null | undefined,
): EarnUiVersion | null {
  if (raw == null) return null;
  return parseEarnUiVersionStringOrNull(coercedString.parse(raw));
}

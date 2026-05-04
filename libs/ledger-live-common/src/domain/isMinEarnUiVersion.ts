import { z } from "zod";

type EarnUiVersion = `v${number}`;

const DEFAULT: EarnUiVersion = "v1";

function parseEarnUiVersionOrNull(raw: string): EarnUiVersion | null {
  const bare = raw.startsWith("v") ? raw.slice(1) : raw;
  const n = z.coerce.number().int().positive().safeParse(bare);
  return n.success ? `v${n.data}` : null;
}

const coercedString = z.coerce.string();

/**
 * Integer-based minimum version check for the ptxEarnUi feature flag.
 * Coerces inputs — accepts "v2", "2", or the number 2. Invalid or nullish `actual` is treated as "v1"
 * (same as the ptxEarnUi flag schema). Invalid `minimum` yields false.
 */
export function isMinEarnUiVersion(
  actual: string | number | null | undefined,
  minimum: string | number,
): boolean {
  const actualRaw = actual == null ? DEFAULT : coercedString.parse(actual);
  const a = parseEarnUiVersionOrNull(actualRaw) ?? DEFAULT;

  const minimumRaw = coercedString.parse(minimum);
  const b = parseEarnUiVersionOrNull(minimumRaw);
  if (b === null) return false;

  return Number.parseInt(a.slice(1), 10) >= Number.parseInt(b.slice(1), 10);
}

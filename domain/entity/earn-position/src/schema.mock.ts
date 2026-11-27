import type { z } from "zod";
import { EarnPositionSchema, EarnPositionsSchema } from "./schema";
import type { EarnPosition, EarnPositions } from "./types";

/** The vote account of Ledger by Figment, a public validator. */
const LEDGER_BY_FIGMENT_VOTE_ACCOUNT = "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx";

export function mockEarnPosition(
  overrides?: Partial<z.input<typeof EarnPositionSchema>>,
): EarnPosition {
  return EarnPositionSchema.parse({
    id: "StakeAccountA1111111111111111111111111111111",
    network: "solana",
    ownerAddress: "Wa11etTestAddress1111111111111111111111111111",
    validatorAddress: LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
    validatorName: "Ledger by Figment",
    validatorLogoUrl: "https://example.com/validators/ledger-by-figment.png",
    status: "activated",
    balance: "10000000000",
    deposited: "9750000000",
    totalRewards: "250000000",
    interest: { type: "APY", value: 0.0712 },
    updatedAt: "2026-11-18T12:00:00Z",
    ...overrides,
  });
}

export function mockEarnPositions(
  overrides?: Partial<z.input<typeof EarnPositionsSchema>>,
): EarnPositions {
  return EarnPositionsSchema.parse({
    positions: [mockEarnPosition()],
    failures: [],
    isStale: false,
    respondedAt: "2026-11-18T12:00:01Z",
    ...overrides,
  });
}

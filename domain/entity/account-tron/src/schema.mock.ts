import { TronResourcesSchema, type TronResources } from "./schema";

type TronResourcesInput = {
  energy: string;
  bandwidth: { freeUsed: string; freeLimit: string; gainedUsed: string; gainedLimit: string };
  tronPower: number;
};

/** An account with some energy, part of its free bandwidth used and nothing frozen for bandwidth. */
export function mockTronResources(overrides: Partial<TronResourcesInput> = {}): TronResources {
  return TronResourcesSchema.parse({
    energy: "1200",
    bandwidth: { freeUsed: "100", freeLimit: "600", gainedUsed: "0", gainedLimit: "0" },
    tronPower: 10,
    ...overrides,
  });
}

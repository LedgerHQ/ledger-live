import { NetworkValidatorSchema, type NetworkValidator } from "./schema";

export function mockNetworkValidator(overrides?: Partial<NetworkValidator>): NetworkValidator {
  return NetworkValidatorSchema.parse({
    id: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
    name: "Ledger",
    address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
    commission: 0.05,
    apy: 0.12,
    totalStaked: "1000000000",
    ...overrides,
  });
}

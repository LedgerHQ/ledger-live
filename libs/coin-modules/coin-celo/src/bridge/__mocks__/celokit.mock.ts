import { ZERO_ADDRESS } from "../../constants";

export const lockedGold = jest.fn();
export const nonVoting = jest.fn();
export const electionConfig = jest.fn();

const LOCKED_GOLD_ADDRESS = "0x0000000000000000000000000000000000001d00";
const ELECTION_ADDRESS = "0x000000000000000000000000000000000000ce10";

jest.mock("../../network/registry", () => ({
  getRegistryAddressFor: jest.fn(async (name: string) => {
    if (name === "LockedGold") return LOCKED_GOLD_ADDRESS;
    if (name === "Election") return ELECTION_ADDRESS;
    return ZERO_ADDRESS;
  }),
}));

jest.mock("../../network/client", () => ({
  getCeloClient: jest.fn(() => ({
    readContract: jest.fn(async ({ functionName }: { functionName: string }) => {
      if (functionName === "getAccountTotalLockedGold") return lockedGold();
      if (functionName === "getAccountNonvotingLockedGold") return nonVoting();
      if (functionName === "maxNumGroupsVotedFor") {
        const cfg = await electionConfig();
        return cfg?.maxNumGroupsVotedFor ?? BigInt(10);
      }
      return BigInt(0);
    }),
  })),
}));

jest.mock("../../network/sdk", () => ({
  getAccountRegistrationStatus: () => Promise.resolve(true),
  getPendingWithdrawals: () => Promise.resolve([]),
  getVotes: () => Promise.resolve([]),
}));

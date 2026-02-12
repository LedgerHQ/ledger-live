export const mockCeloKit = jest.fn();

export const lockedGold = jest.fn();
export const nonVoting = jest.fn();
export const electionConfig = jest.fn();

jest.mock("../../network/sdk", () => {
  return {
    celoKit: () => mockCeloKit(),
    getAccountRegistrationStatus: () => Promise.resolve(true),
    getPendingWithdrawals: () => Promise.resolve([]),
    getVotes: () => Promise.resolve([]),
  };
});

mockCeloKit.mockReturnValue({
  contracts: {
    getLockedGold: jest.fn().mockReturnValue({
      getAccountTotalLockedGold: () => lockedGold(),
      getAccountNonvotingLockedGold: () => nonVoting(),
      address: "0x0000000000000000000000000000000000001d00",
    }),
    getElection: jest.fn().mockReturnValue({
      getConfig: () => electionConfig(),
      address: "0x000000000000000000000000000000000000ce10",
    }),
  },
});

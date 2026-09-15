export const mockSignedInCardApis = {
  useGetCardStatusQuery: jest.fn(() => ({ data: { status: "ACTIVE" }, isLoading: false })),
  useFreezeCardMutation: jest.fn(() => [jest.fn()]),
  useUnfreezeCardMutation: jest.fn(() => [jest.fn()]),
  useGetUserQuery: jest.fn(() => ({ data: { id: "user-1" } })),
};

export const mockSignedInCardAuth = {
  useIsCardSignedIn: jest.fn(() => true),
  useCardLogout: jest.fn(() => jest.fn()),
};

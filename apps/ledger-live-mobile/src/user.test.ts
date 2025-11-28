import getOrCreateUser from "./user";
import * as db from "./db";

jest.mock("./db", () => ({
  getUser: jest.fn(),
  setUser: jest.fn(),
  updateUser: jest.fn(),
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("User IDs", () => {
  it("should have different id and datadogId", async () => {
    // @ts-expect-error mock
    mockDb.getUser.mockResolvedValue(undefined);
    mockDb.setUser.mockResolvedValue(undefined);

    const { user } = await getOrCreateUser();

    expect(user?.id).not.toBe(user?.datadogId);
  });
});

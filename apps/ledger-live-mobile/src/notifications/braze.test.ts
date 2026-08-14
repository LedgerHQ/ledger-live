import Braze from "@braze/react-native-sdk";
import { UserId, DUMMY_USER_ID } from "@domain/entity-client-identity";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";
import { start } from "./braze";

jest.mock("@braze/react-native-sdk", () => ({
  __esModule: true,
  default: {
    changeUser: jest.fn(),
  },
}));

jest.mock("@ledgerhq/live-common/braze/anonymousUsers", () => ({
  generateAnonymousId: jest.fn(() => "anonymous_id_1"),
}));

const mockedChangeUser = jest.mocked(Braze.changeUser);
const mockedGenerateAnonymousId = jest.mocked(generateAnonymousId);

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

describe("start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when brazeOptOutIdentityCleanup is off (legacy)", () => {
    it("should call changeUser with real id when user is tracked", () => {
      start(true, REAL_USER_ID);
      expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
      expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
    });

    it("should call changeUser with anonymous id when user is opted out", () => {
      start(false, REAL_USER_ID);
      expect(mockedGenerateAnonymousId).toHaveBeenCalled();
      expect(mockedChangeUser).toHaveBeenCalledWith("anonymous_id_1");
    });

    it("should skip changeUser when user id is dummy", () => {
      start(true, DUMMY_USER_ID);
      expect(mockedChangeUser).not.toHaveBeenCalled();
      expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
    });
  });

  describe("when brazeOptOutIdentityCleanup is on", () => {
    const options = { brazeOptOutIdentityCleanup: true };

    it("should call changeUser with real id when user is tracked", () => {
      start(true, REAL_USER_ID, options);
      expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
      expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
    });

    it("should skip changeUser when user is opted out", () => {
      start(false, REAL_USER_ID, options);
      expect(mockedChangeUser).not.toHaveBeenCalled();
      expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
    });

    it("should skip changeUser when user id is dummy", () => {
      start(false, DUMMY_USER_ID, options);
      expect(mockedChangeUser).not.toHaveBeenCalled();
      expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
    });
  });
});

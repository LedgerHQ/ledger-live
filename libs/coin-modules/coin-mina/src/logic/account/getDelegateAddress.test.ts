jest.mock("../../api");

import { getDelegateAccount } from "../../api";
import { getDelegateAddress } from "./getDelegateAddress";

const mockGetDelegateAccount = getDelegateAccount as jest.MockedFunction<
  typeof getDelegateAccount
>;

describe("getDelegateAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return delegate public key", async () => {
    mockGetDelegateAccount.mockResolvedValue({
      data: {
        account: {
          delegateAccount: { publicKey: "B62qdelegate" },
        },
      },
    });

    const result = await getDelegateAddress("B62qtest");

    expect(result).toBe("B62qdelegate");
  });

  it("should return undefined when account is null", async () => {
    mockGetDelegateAccount.mockResolvedValue({
      data: { account: null },
    });

    const result = await getDelegateAddress("B62qtest");

    expect(result).toBeUndefined();
  });
});

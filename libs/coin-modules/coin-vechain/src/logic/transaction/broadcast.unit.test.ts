import { submit } from "../../network";
import { broadcast } from "./broadcast";

jest.mock("../../network", () => ({ submit: jest.fn() }));

describe("broadcast", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("decodes the hex raw transaction and delegates to submit", async () => {
    jest.mocked(submit).mockResolvedValueOnce("0xtxid");

    const id = await broadcast("0xaabbcc");

    expect(id).toBe("0xtxid");
    const [passed] = jest.mocked(submit).mock.calls[0];
    expect(Array.from(passed.encoded as Uint8Array)).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it("propagates an error from submit", async () => {
    jest.mocked(submit).mockRejectedValueOnce(new Error("vechain: broadcast rejected"));

    await expect(broadcast("0xaabbcc")).rejects.toThrow("vechain: broadcast rejected");
  });
});

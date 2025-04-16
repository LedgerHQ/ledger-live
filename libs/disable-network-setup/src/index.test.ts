import axios from "axios";

describe("Per client tests", () => {
  it("should block requests through axios", async () => {
    await expect(axios.get("https://google.com")).rejects.toThrow(/Nock: Disallowed net connect/);
  });
});

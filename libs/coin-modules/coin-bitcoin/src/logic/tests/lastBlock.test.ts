import { lastBlock } from "../lastBlock";
import { currentBlockHandler, makeBlock, server, testContext, useMswServer } from "./helpers/msw";

useMswServer();

describe("lastBlock (explorer wire format)", () => {
  it("reads the object payload of block/current", async () => {
    server.use(
      currentBlockHandler(
        makeBlock(969589, {
          hash: "00000000000000000000a9750b66ceb2a63bf0eedf6a4404f050a4c769f32deb",
          time: "2026-10-02T12:28:56Z",
        }),
      ),
    );
    expect(await lastBlock(testContext(), "bitcoin")).toEqual({
      height: 969589,
      hash: "00000000000000000000a9750b66ceb2a63bf0eedf6a4404f050a4c769f32deb",
      time: new Date("2026-10-02T12:28:56Z"),
    });
  });
});

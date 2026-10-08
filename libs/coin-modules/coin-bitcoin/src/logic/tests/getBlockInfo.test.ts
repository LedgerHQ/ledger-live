import { http } from "msw";
import { getBlockInfo } from "../getBlockInfo";
import {
  blockHandler,
  explorerUrl,
  makeBlock,
  notFound,
  server,
  testContext,
  useMswServer,
} from "./helpers/msw";

useMswServer();

describe("getBlockInfo (explorer wire format)", () => {
  it("reads the first element of the array payload", async () => {
    server.use(
      blockHandler(170, [
        makeBlock(170, {
          hash: "00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee",
          time: "2009-01-12T03:30:25Z",
          prevHash: "000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55",
        }),
      ]),
    );
    expect(await getBlockInfo(testContext(), "bitcoin", 170)).toEqual({
      height: 170,
      hash: "00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee",
      time: new Date("2009-01-12T03:30:25Z"),
      parent: {
        height: 169,
        hash: "000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55",
      },
    });
  });

  it("throws on an empty array (height above the tip)", async () => {
    server.use(blockHandler(99_999_999, []));
    await expect(getBlockInfo(testContext(), "bitcoin", 99_999_999)).rejects.toThrow(
      "block 99999999 not found",
    );
  });

  it("throws on the explorer's 404 for a height above the tip", async () => {
    server.use(http.get(`${explorerUrl()}/block/99999999`, () => notFound("99999999")));
    await expect(getBlockInfo(testContext(), "bitcoin", 99_999_999)).rejects.toThrow(
      "Not found: 99999999",
    );
  });
});

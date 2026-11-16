import { GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE } from "./fixtures";
import { toBlockInfo } from "./utils";

const HASH = GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE.block_id.hash;
const TIME = new Date("2026-11-04T10:24:57.711662460Z");

describe("utils", () => {
  describe("toBlockInfo", () => {
    it("maps the height, hash and time from the sdk_block attribute", () => {
      expect(toBlockInfo(GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE)).toEqual({
        height: 33721700,
        hash: HASH,
        time: TIME,
      });
    });

    it("prefers sdk_block over the deprecated block attribute", () => {
      const { block } = GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE;
      const response = {
        ...GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE,
        block: { ...block, header: { ...block.header, height: "1" } },
      };

      expect(toBlockInfo(response).height).toBe(33721700);
    });

    it("maps from the block attribute when sdk_block is not available", () => {
      const { sdk_block: _sdkBlock, ...response } = GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE;

      expect(toBlockInfo(response)).toEqual({ height: 33721700, hash: HASH, time: TIME });
    });
  });
});

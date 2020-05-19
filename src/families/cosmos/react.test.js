// @flow
import { renderHook, act } from "@testing-library/react-hooks";
import * as hooks from "./react";
import {
  getCurrentCosmosPreloadData,
  setCosmosPreloadData,
} from "./preloadedData";

describe("cosmos/react", () => {
  describe("useCosmosPreloadData", () => {
    it("should return Cosmos preload data and updates", async () => {
      const { result } = renderHook(() => hooks.useCosmosPreloadData());
      const data = getCurrentCosmosPreloadData();
      expect(result.current).toStrictEqual(data);
      const newData = {
        ...data,
        rewardsState: { ...data.rewardsState, targetBondedRatio: 1 },
      };
      act(() => {
        setCosmosPreloadData(newData);
      });
      expect(result.current).toStrictEqual(newData);
    });
  });
});

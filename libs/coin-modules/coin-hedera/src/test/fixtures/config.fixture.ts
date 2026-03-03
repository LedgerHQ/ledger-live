import type { HederaCoinConfig } from "../../config";

export const getMockedConfig = (): HederaCoinConfig => {
  return {
    status: { type: "active" },
    useHgraphForErc20: false,
  };
};

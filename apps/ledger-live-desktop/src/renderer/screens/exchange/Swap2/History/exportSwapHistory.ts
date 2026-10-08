import { files } from "~/renderer/bridge";
import type { SaveRequest } from "~/bridge/contract";

export const exportSwapHistory = async (
  request: SaveRequest,
  csv: string,
  callback?: () => void,
) => {
  try {
    const res = await files.exportOperations(request, csv);
    if (res === "saved" && callback) {
      callback();
    } else if (res === "failed") {
      console.warn("Could not write the swap history CSV");
    }
  } catch {
    // ignore
  }
};

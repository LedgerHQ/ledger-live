import { rosettaGetBlockInfo, RosettaBlockInfoResponse } from "../../network";

export const getBlockInfo = async (
  blockHeight: number,
  timeout?: number,
): Promise<RosettaBlockInfoResponse> => {
  const data = await rosettaGetBlockInfo(blockHeight, timeout);
  return data;
};

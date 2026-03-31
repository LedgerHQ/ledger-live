import { rosettaGetBlockInfo, RosettaBlockInfoResponse } from "../../network";

export const getBlockInfo = async (blockHeight: number): Promise<RosettaBlockInfoResponse> => {
  const data = await rosettaGetBlockInfo(blockHeight);
  return data;
};

import { rosettaGetBlockInfo, RosettaBlockInfoResponse } from "../../api";

export const getBlockInfo = async (blockHeight: number): Promise<RosettaBlockInfoResponse> => {
  const data = await rosettaGetBlockInfo(blockHeight);
  return data;
};

import { DappInfos } from "../model/DappInfos";

export type GetDappInfos = {
  address: string;
  selector: `0x${string}`;
  chainId: number;
};

export interface ExternalPluginDataSource {
  getDappInfos(params: GetDappInfos): Promise<DappInfos | undefined>;
}

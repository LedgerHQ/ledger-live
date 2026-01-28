import type { Api, MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
import type { FilecoinFeeEstimation } from "../types/model";

/**
 * Filecoin API type extending the base Api interface.
 * Uses MemoNotSupported since Filecoin doesn't support transaction memos.
 * Overrides estimateFees to return FilecoinFeeEstimation with gas parameters.
 */
export type FilecoinApi = Omit<Api<MemoNotSupported>, "estimateFees"> & {
  estimateFees: (
    ...args: Parameters<Api<MemoNotSupported>["estimateFees"]>
  ) => Promise<FilecoinFeeEstimation>;
};

/**
 * Filecoin API configuration
 */
export interface FilecoinApiConfig {
  /**
   * Base URL for the Filecoin API
   * If not provided, uses the API_FILECOIN_ENDPOINT environment variable
   */
  endpointUrl?: string;
}

import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLedgerEnd as nodeGetLedgerEnd } from "../../network/node";
import { getLedgerEnd } from "../../network/gateway";
import coinConfig from "../../config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import crypto from "node:crypto";

const useGateway = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).useGateway === true;

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  const height = useGateway(currency) ? await getLedgerEnd(currency) : await nodeGetLedgerEnd();
  const hash = crypto.createHash("sha256").update(`canton-block-${height}`).digest("hex");
  return {
    height,
    hash: `0x${hash}`,
    time: new Date(),
  };
}

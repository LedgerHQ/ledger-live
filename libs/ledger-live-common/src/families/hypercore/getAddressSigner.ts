import { DmkSignerEth, LegacySignerEth, type EvmSigner } from "@ledgerhq/live-signer-evm";
import type { CreateSigner } from "../../bridge/setup";
import { isDmkTransport } from "../../hw/dmkUtils";

// Eth device signer, getAddress only — HyperCore derives an eth-format address and never signs.
export const createGetAddressSigner: CreateSigner<Pick<EvmSigner, "getAddress">> = transport =>
  isDmkTransport(transport)
    ? new DmkSignerEth(transport.dmk, transport.sessionId)
    : new LegacySignerEth(transport);

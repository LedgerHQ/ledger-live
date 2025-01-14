import {
  post,
  PostRequestOptions,
  TransactionResponse,
  MimeType,
  AptosApiType,
} from "@aptos-labs/ts-sdk";
import { node } from "../network";

export async function broadcast(signature: string): Promise<string> {
  const client = await node();

  const txBytes = Uint8Array.from(Buffer.from(signature, "hex"));
  const pendingTx = await post<PostRequestOptions, TransactionResponse>({
    contentType: MimeType.BCS_SIGNED_TRANSACTION,
    aptosConfig: client.config,
    body: txBytes,
    path: "transactions",
    type: AptosApiType.FULLNODE,
    originMethod: "",
  });
  return pendingTx.data.hash;
}

import {
  post,
  PostRequestOptions,
  TransactionResponse,
  MimeType,
  AptosApiType,
} from "@aptos-labs/ts-sdk";

export async function broadcast(signature: string): Promise<string> {
  const txBytes = Uint8Array.from(Buffer.from(signature, "hex"));
  const pendingTx = await post<PostRequestOptions, TransactionResponse>({
    contentType: MimeType.BCS_SIGNED_TRANSACTION,
    aptosConfig: this.aptosClient.config,
    body: txBytes,
    path: "transactions",
    type: AptosApiType.FULLNODE,
    originMethod: "",
  });
  return pendingTx.data.hash;
}

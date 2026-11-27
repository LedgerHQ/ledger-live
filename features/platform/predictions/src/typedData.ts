import { verifyTypedData } from "ethers";

export type TypedDataField = { name: string; type: string };

/** An EIP-712 message, in the JSON form the Ethereum app signs. */
export type PredictionsTypedData = {
  domain: { name: string; version: string; chainId: number; verifyingContract?: string };
  types: { EIP712Domain: TypedDataField[]; [type: string]: TypedDataField[] };
  primaryType: string;
  message: Record<string, unknown>;
};

export type PredictionsSignedTypedData = {
  typedData: PredictionsTypedData;
  /** 0x-prefixed hex. */
  signature: string;
};

export function isTypedDataSigner(
  address: string,
  typedData: PredictionsTypedData,
  signature: string,
): boolean {
  const { EIP712Domain: _domainType, ...types } = typedData.types;
  try {
    const signer = verifyTypedData(typedData.domain, types, typedData.message, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch {
    // A signature that can't be recovered proves nothing, like one from another account.
    return false;
  }
}

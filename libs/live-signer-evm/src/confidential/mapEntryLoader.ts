import {
  ClearSignContextType,
  type ClearSignContext,
  type ContextLoader,
} from "@ledgerhq/context-module";

/**
 * Calls of an ERC-7984 confidential wrapper whose amount is an encrypted handle, keyed by
 * selector: the index of the `bytes32` handle among the call's static arguments.
 *   confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof)
 *   unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof)
 */
const HANDLE_ARGUMENT_INDEX: Record<string, number> = {
  "0x2fb74e62": 1,
  "0x5bf4ef06": 2,
};

type MapEntryLoaderInput = {
  chainId: number;
  data: string;
  deviceModelId: string;
};

type MapEntryResponse = {
  payload: string;
  certificate?: { keyUsageNumber: number; payload: string } | null;
};

type FetchFn = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const hexToBytes = (hex: string): Uint8Array =>
  Uint8Array.from(Buffer.from(hex.replace(/^0x/, ""), "hex"));

/** The encrypted handle of a confidential wrapper call, or `undefined` for any other call. */
export function getConfidentialHandle(data: string): string | undefined {
  const selector = data.slice(0, 10).toLowerCase();
  const index = HANDLE_ARGUMENT_INDEX[selector];
  if (index === undefined) return undefined;
  const start = 10 + index * 64;
  const word = data.slice(start, start + 64);
  return word.length === 64 ? `0x${word.toLowerCase()}` : undefined;
}

function isInput(input: unknown): input is MapEntryLoaderInput {
  if (typeof input !== "object" || input === null) return false;
  const { chainId, data, deviceModelId } = input as Record<string, unknown>;
  return (
    typeof chainId === "number" &&
    typeof data === "string" &&
    typeof deviceModelId === "string" &&
    getConfidentialHandle(data) !== undefined
  );
}

/**
 * Loads the signed MAP_ENTRY that gives the device the cleartext amount behind the encrypted
 * handle of a confidential wrapper call. The entry comes from the confidential transaction
 * service that encrypted the amount. When it has none, no context is returned and the device
 * refuses to display the amount rather than showing an unattested value.
 */
export function createMapEntryLoader(serviceUrl: string, fetchFn: FetchFn = fetch): ContextLoader {
  const baseUrl = serviceUrl.replace(/\/+$/, "");
  return {
    canHandle: (input: unknown, expectedTypes: ClearSignContextType[]): input is unknown =>
      expectedTypes.includes(ClearSignContextType.ETHEREUM_MAP_ENTRY) && isInput(input),

    load: async (input: unknown): Promise<ClearSignContext[]> => {
      if (!isInput(input)) return [];
      const { chainId, data, deviceModelId } = input;
      const handle = getConfidentialHandle(data);
      if (handle === undefined) return [];
      const query = new URLSearchParams({ chainId: String(chainId), device: deviceModelId });
      try {
        const response = await fetchFn(`${baseUrl}/map-entry/${handle}?${query}`);
        if (!response.ok) return [];
        const entry = (await response.json()) as MapEntryResponse;
        if (typeof entry?.payload !== "string") return [];
        return [
          {
            type: ClearSignContextType.ETHEREUM_MAP_ENTRY,
            payload: entry.payload,
            certificate: entry.certificate
              ? {
                  keyUsageNumber: entry.certificate.keyUsageNumber,
                  payload: hexToBytes(entry.certificate.payload),
                }
              : undefined,
          },
        ];
      } catch {
        return [];
      }
    },
  };
}

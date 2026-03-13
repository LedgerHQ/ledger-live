import network from "@ledgerhq/live-network";
import { DEFAULT_OPTION, getCALDomain, type ServiceOption } from "./common";
import { getEnv } from "@ledgerhq/live-env";

const DeviceModel = {
  blue: "blue",
  nanoS: "nanos",
  nanoSP: "nanosp",
  nanoX: "nanox",
  stax: "stax",
  /** Ledger Flex ("europa" is the internal name) */
  europa: "flex",
  flex: "flex",
  apex: "apexp",
} as const;
export type Device = keyof typeof DeviceModel;

type PublicKeyId = "domain_metadata_key" | "token_metadata_key" | "yield";
type PublicKeyUsage = "trusted_name" | "coin_meta" | "perps_data";

type CertificateResponse = {
  id: string;
  certificate_version: {
    major: number;
    minor: number;
    patch: number;
  };
  target_device: Device;
  not_valid_after: {
    major: number;
    minor: number;
    patch: number;
  };
  public_key_usage: PublicKeyUsage;
  descriptor: {
    data: string;
    signatures: {
      prod: string;
      test: string;
    };
  };
};
export type CertificateInfo = {
  descriptor: string;
  signature: string;
};
function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: expected even length, got ${hex.length}`);
  }
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error("Invalid hex string content: only [0-9a-fA-F] characters are allowed");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const SIGNATURE_TAG = 0x15;
const MAX_SIGNATURE_LENGTH = 0xff;
export function convertCertificateToDeviceData(info: CertificateInfo): Uint8Array {
  const descriptorBytes = hexToUint8Array(info.descriptor);
  const signatureBytes = hexToUint8Array(info.signature);

  if (signatureBytes.length > MAX_SIGNATURE_LENGTH) {
    throw new Error(
      `Signature too long: ${signatureBytes.length} bytes (maximum ${MAX_SIGNATURE_LENGTH})`,
    );
  }

  const result = new Uint8Array(descriptorBytes.length + 2 + signatureBytes.length);
  let offset = 0;
  result.set(descriptorBytes, offset);
  offset += descriptorBytes.length;
  result[offset++] = SIGNATURE_TAG;
  result[offset++] = signatureBytes.length;
  result.set(signatureBytes, offset);
  return result;
}

function publicKeyIdOf(usage: PublicKeyUsage): PublicKeyId {
  switch (usage) {
    case "perps_data":
      return "yield";
    case "trusted_name":
      return "domain_metadata_key";
    case "coin_meta":
      return "token_metadata_key";
  }
}
/**
 * Retrieve PKI certificate
 * @param device
 */
export async function getCertificate(
  device: Device,
  usage: PublicKeyUsage,
  version: string | "latest" = "latest",
  {
    env = "prod",
    signatureKind = "prod",
    ref = getEnv("CAL_REF") || undefined,
  }: ServiceOption = DEFAULT_OPTION,
): Promise<CertificateInfo> {
  let params: Record<string, string | boolean | number | undefined> = {
    output: "id,target_device,not_valid_after,public_key_usage,certificate_version,descriptor",
    target_device: DeviceModel[device],
    public_key_usage: usage,
    public_key_id: publicKeyIdOf(usage),
    ref,
  };
  if (version === "latest") {
    params = {
      ...params,
      latest: true,
    };
  } else {
    params = {
      ...params,
      not_valid_after: version,
    };
  }

  const { data } = await network<CertificateResponse[]>({
    method: "GET",
    url: `${getCALDomain(env)}/v1/certificates`,
    params,
  });

  if (data.length === 0) {
    throw new Error("Empty result");
  }

  return {
    descriptor: data[0].descriptor.data,
    signature: data[0].descriptor.signatures[signatureKind],
  };
}

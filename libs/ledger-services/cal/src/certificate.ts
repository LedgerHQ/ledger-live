import network from "@ledgerhq/live-network";
import { DEFAULT_OPTION, getCALDomain, type ServiceOption } from "./common";

const DeviceModel = {
  blue: "blue",
  nanoS: "nanos",
  nanoSP: "nanosp",
  nanoX: "nanox",
  stax: "stax",
  /** Ledger Flex ("europa" is the internal name) */
  europa: "flex",
  flex: "flex",
} as const;
export type Device = keyof typeof DeviceModel;

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
  public_key_usage: "trusted_name";
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
/**
 * Retrieve PKI certificate
 * @param device
 */
export async function getCertificate(
  device: Device,
  version: string | "latest" = "latest",
  { env = "prod", signatureKind = "prod", ref = undefined }: ServiceOption = DEFAULT_OPTION,
): Promise<CertificateInfo> {
  let params: Record<string, string | boolean | number | undefined> = {
    output: "id,target_device,not_valid_after,public_key_usage,certificate_version,descriptor",
    target_device: DeviceModel[device],
    public_key_usage: "trusted_name",
    public_key_id: "domain_metadata_key",
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

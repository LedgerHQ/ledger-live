import network from "@ledgerhq/live-network";
import { getCALDomain } from "./common";

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
 * @param version semver
 */
export async function getCertificate(
  device: Device,
  version: string,
  env: "prod" | "test" = "prod",
  signatureKind: "prod" | "test" = "prod",
): Promise<CertificateInfo> {
  const { data } = await network<CertificateResponse[]>({
    method: "GET",
    url: `${getCALDomain(env)}/v1/certificates`,
    params: {
      output: "id,target_device,not_valid_after,public_key_usage,certificate_version,descriptor",
      target_device: DeviceModel[device],
      public_key_usage: "trusted_name",
      note_valid_after: version,
    },
  });

  if (data.length === 0) {
    throw new Error("Empty result");
  }

  return {
    descriptor: data[0].descriptor.data,
    signature: data[0].descriptor.signatures[signatureKind],
  };
}

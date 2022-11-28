import os from "os";
import semverSatisfies from "semver/functions/satisfies";

export type SupportStatus =
  | {
      supported: false;
      criteria: string;
      type: string;
      release: string;
    }
  | {
      supported: true;
      type: string;
      release: string;
    };

const minVersions: { [_: string]: string } = {
  Windows_NT: ">= 8.1",
  Darwin: ">= 18", // this is a darwin version corresponding roughly to mac os 10.14
};

export function supportStatusForOS(type: string, release: string): SupportStatus {
  const criteria = minVersions[type];
  if (criteria && !semverSatisfies(release, criteria)) {
    return { supported: false, criteria, type, release };
  }
  return { supported: true, type, release };
}

export function getOperatingSystemSupportStatus(): SupportStatus {
  const type = os.type();
  const release = os.release();
  return supportStatusForOS(type, release);
}

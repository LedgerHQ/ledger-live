import os from "os";
import semverSatisfies from "semver/functions/satisfies";
import { getEnv } from "@ledgerhq/live-common/env";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";

type OperatingSystemOutdatedInfos = {
  type: string;
  release: string;
  criteria: string;
};

export const OperatingSystemOutdated = createCustomErrorClass<
  OperatingSystemOutdatedInfos,
  LedgerErrorConstructor<OperatingSystemOutdatedInfos>
>("OperatingSystemOutdated");

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
  const m = getEnv("MOCK_OS_VERSION");
  let type;
  let release;
  if (m) {
    const splits = m.split("@");
    if (splits.length !== 2) {
      throw new Error("MOCK_OS_VERSION format should be 'os@version'");
    }
    type = splits[0];
    release = splits[1];
  } else {
    type = os.type();
    release = os.release();
  }
  return supportStatusForOS(type, release);
}

// throw a OperatingSystemOutdated error if conditions aren't met
export function expectOperatingSystemSupportStatus() {
  const support = getOperatingSystemSupportStatus();
  if (!support.supported) {
    throw new OperatingSystemOutdated("Your Operating System version is not supported", {
      type: support.type,
      release: support.release,
      criteria: support.criteria,
    });
  }
}

import { from, Observable, of } from "rxjs";
import { switchMap, finalize } from "rxjs/operators";
import { DeviceModelId, identifyTargetId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import type { FirmwareInfo } from "@ledgerhq/types-live";
import { satisfies as versionSatisfies, coerce as semverCoerce } from "semver";
import { isDeviceLocalizationSupported } from "../../manager/localization";
import { UnresponsiveCmdEvent } from "./core";

export type GetVersionCmdEvent =
  | { type: "data"; firmwareInfo: FirmwareInfo }
  | UnresponsiveCmdEvent;

export type GetVersionCmdArgs = { transport: Transport };

export function getVersion({
  transport,
}: GetVersionCmdArgs): Observable<GetVersionCmdEvent> {
  return new Observable((subscriber) => {
    // TODO: defines actual value
    const oldTimeout = transport.unresponsiveTimeout;
    transport.setExchangeUnresponsiveTimeout(1000);

    const unresponsiveCallback = () => {
      // Needs to push a value and not an error to allow the command to continue once
      // the device is not unresponsive anymore. Pushing an error would stop the command.
      subscriber.next({ type: "unresponsive" });
    };

    transport.on("unresponsive", unresponsiveCallback);

    return from(transport.send(0xe0, 0x01, 0x00, 0x00))
      .pipe(
        switchMap((value: Buffer) => {
          transport.off("unresponsive", unresponsiveCallback);

          const data = value.slice(0, value.length - 2);
          let i = 0;

          // parse the target id of either BL or SE
          const targetId = data.readUIntBE(0, 4);
          i += 4;

          // parse the version of either BL or SE
          const rawVersionLength = data[i++];
          let rawVersion = data.slice(i, i + rawVersionLength).toString();
          i += rawVersionLength;

          // flags. gives information about manager allowed in SE mode.
          const flagsLength = data[i++];
          let flags = data.slice(i, i + flagsLength);
          i += flagsLength;

          if (!rawVersionLength) {
            // To support old firmware like bootloader of 1.3.1
            rawVersion = "0.0.0";
            flags = Buffer.allocUnsafeSlow(0);
          }

          let mcuVersion = "";
          let mcuBlVersion: string | undefined;
          let seVersion: string | undefined;
          let bootloaderVersion: string | undefined;
          let hardwareVersion: number | undefined;
          let mcuTargetId: number | undefined;
          let seTargetId: number | undefined;
          let languageId: number | undefined;

          const isBootloader = (targetId & 0xf0000000) !== 0x30000000;

          if (isBootloader) {
            mcuBlVersion = rawVersion;
            mcuTargetId = targetId;

            if (i < data.length) {
              // se part 1
              const part1Length = data[i++];
              const part1 = data.slice(i, i + part1Length);
              i += part1Length;

              // at this time, this is how we branch old & new format
              if (part1Length >= 5) {
                seVersion = part1.toString();
                // se part 2
                const part2Length = data[i++];
                const part2 = data.slice(i, i + part2Length);
                i += flagsLength;
                seTargetId = part2.readUIntBE(0, 4);
              } else {
                seTargetId = part1.readUIntBE(0, 4);
              }
            }
          } else {
            seVersion = rawVersion;
            seTargetId = targetId;

            // if SE: mcu version
            const mcuVersionLength = data[i++];
            let mcuVersionBuf: Buffer = Buffer.from(
              data.slice(i, i + mcuVersionLength)
            );
            i += mcuVersionLength;

            if (mcuVersionBuf[mcuVersionBuf.length - 1] === 0) {
              mcuVersionBuf = mcuVersionBuf.slice(0, mcuVersionBuf.length - 1);
            }
            mcuVersion = mcuVersionBuf.toString();

            const isOSU = rawVersion.includes("-osu");

            if (!isOSU) {
              const deviceModel = identifyTargetId(targetId);

              if (isBootloaderVersionSupported(seVersion, deviceModel?.id)) {
                const bootloaderVersionLength = data[i++];
                let bootloaderVersionBuf: Buffer = Buffer.from(
                  data.slice(i, i + bootloaderVersionLength)
                );
                i += bootloaderVersionLength;

                if (
                  bootloaderVersionBuf[bootloaderVersionBuf.length - 1] === 0
                ) {
                  bootloaderVersionBuf = bootloaderVersionBuf.slice(
                    0,
                    bootloaderVersionBuf.length - 1
                  );
                }
                bootloaderVersion = bootloaderVersionBuf.toString();
              }

              if (isHardwareVersionSupported(seVersion, deviceModel?.id)) {
                const hardwareVersionLength = data[i++];
                hardwareVersion = data
                  .slice(i, i + hardwareVersionLength)
                  .readUIntBE(0, 1); // ?? string? number?
                i += hardwareVersionLength;
              }

              if (isDeviceLocalizationSupported(seVersion, deviceModel?.id)) {
                const languageIdLength = data[i++];
                languageId = data
                  .slice(i, i + languageIdLength)
                  .readUIntBE(0, 1);
              }
            }
          }

          return of({
            type: "data" as const,
            firmwareInfo: {
              isBootloader,
              rawVersion,
              targetId,
              seVersion,
              mcuVersion,
              mcuBlVersion,
              mcuTargetId,
              seTargetId,
              flags,
              bootloaderVersion,
              hardwareVersion,
              languageId,
            },
          });
        }),
        finalize(() => transport.setExchangeUnresponsiveTimeout(oldTimeout))
      )
      .subscribe(subscriber);
  });
}

const deviceVersionRangesForBootloaderVersion: {
  [key in DeviceModelId]?: string;
} = {
  nanoS: ">=2.0.0",
  nanoX: ">=2.0.0",
  nanoSP: ">=1.0.0",
  stax: ">=1.0.0",
};

/**
 * @returns whether the Bootloader Version bytes are included in the result of the
 * getVersion APDU
 **/
export const isBootloaderVersionSupported = (
  seVersion: string,
  modelId?: DeviceModelId
): boolean =>
  !!modelId &&
  !!deviceVersionRangesForBootloaderVersion[modelId] &&
  !!versionSatisfies(
    semverCoerce(seVersion) || seVersion,
    deviceVersionRangesForBootloaderVersion[modelId] as string
  );

const deviceVersionRangesForHardwareVersion: {
  [key in DeviceModelId]?: string;
} = {
  nanoX: ">=2.0.0",
};

/**
 * @returns whether the Hardware Version bytes are included in the result of the
 * getVersion APDU
 **/
export const isHardwareVersionSupported = (
  seVersion: string,
  modelId?: DeviceModelId
): boolean =>
  !!modelId &&
  !!deviceVersionRangesForHardwareVersion[modelId] &&
  !!versionSatisfies(
    semverCoerce(seVersion) || seVersion,
    deviceVersionRangesForHardwareVersion[modelId] as string
  );

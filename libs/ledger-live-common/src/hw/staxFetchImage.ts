import { Observable, from, of, throwError } from "rxjs";
import { catchError, concatMap, delay, mergeMap } from "rxjs/operators";
import {
  DeviceOnDashboardExpected,
  TransportError,
  TransportStatusError,
  StatusCodes,
} from "@ledgerhq/errors";

import { ungzip } from "pako";

import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import staxFetchImageHash from "./staxFetchImageHash";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";
import { ImageDoesNotExistOnDevice } from "../errors";

const MAX_APDU_SIZE = 240;

export type FetchImageEvent =
  | AttemptToQuitAppEvent
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "currentImageHash";
      imgHash: string;
    }
  | {
      type: "imageFetched";
      hexImage: string;
    }
  | {
      type: "imageAlreadyBackedUp";
    };

export type FetchImageRequest = {
  deviceId: string;
  backupHash?: string; // When provided, will skip the backup if it matches the hash.
};

export default function fetchImage({
  deviceId,
  backupHash,
}: FetchImageRequest): Observable<FetchImageEvent> {
  const sub = withDevice(deviceId)(
    (transport) =>
      new Observable((subscriber) => {
        const timeoutSub = of<FetchImageEvent>({
          type: "unresponsiveDevice",
        })
          .pipe(delay(1000))
          .subscribe((e) => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async () => {
              timeoutSub.unsubscribe();
              // Fetch the image hash from the device
              const imgHash = await staxFetchImageHash(transport);
              subscriber.next({ type: "currentImageHash", imgHash });
              // We don't have an image to backup
              if (imgHash === "") {
                return subscriber.error(new ImageDoesNotExistOnDevice());
              } else if (backupHash === imgHash) {
                subscriber.next({ type: "imageAlreadyBackedUp" });
                subscriber.complete();
                return;
              }

              // If we are here, either we didn't provide a backupHash or we are
              // not up to date with the device, in either case, continue to fetch
              const imageLengthResponse = await transport.send(
                0xe0,
                0x64,
                0x00,
                0x00
              );

              const imageLengthStatus = imageLengthResponse.readUInt16BE(
                imageLengthResponse.length - 2
              );

              if (imageLengthStatus !== StatusCodes.OK) {
                // this answer success even when no image is set, but the length of the image is 0
                return subscriber.error(
                  new TransportError(
                    "Unexpected device response",
                    imageLengthStatus.toString(16)
                  )
                );
              }

              const imageLength = imageLengthResponse.readUInt32BE(0);

              if (imageLength === 0) {
                // It should never happen since we fetched the hash earlier but hey.
                return subscriber.error(new ImageDoesNotExistOnDevice());
              }

              let imageBuffer = Buffer.from([]);

              let currentOffset = 0;
              while (currentOffset < imageLength) {
                subscriber.next({
                  type: "progress",
                  progress: (currentOffset + 1) / imageLength,
                });
                // 253 bytes for data, 2 for status
                const chunkSize = Math.min(
                  MAX_APDU_SIZE - 2,
                  imageLength - currentOffset
                );

                const chunkRequest = Buffer.alloc(5);
                chunkRequest.writeUInt32BE(currentOffset);
                chunkRequest.writeUInt8(chunkSize, 4);

                const imageChunk = await transport.send(
                  0xe0,
                  0x65,
                  0x00,
                  0x00,
                  chunkRequest
                );

                const chunkStatus = imageChunk.readUInt16BE(
                  imageChunk.length - 2
                );

                if (chunkStatus !== StatusCodes.OK) {
                  // TODO: map all proper errors
                  return subscriber.error(
                    new TransportError(
                      "Unexpected device response",
                      chunkStatus.toString(16)
                    )
                  );
                }

                imageBuffer = Buffer.concat([
                  imageBuffer,
                  imageChunk.slice(0, imageChunk.length - 2),
                ]);

                currentOffset += chunkSize;
              }

              const hexImage = await parseStaxImageFormat(imageBuffer);

              subscriber.next({ type: "imageFetched", hexImage });

              subscriber.complete();
            }),
            catchError((e: unknown) => {
              if (
                e instanceof DeviceOnDashboardExpected ||
                (e &&
                  e instanceof TransportStatusError &&
                  [0x6e00, 0x6d00, 0x6e01, 0x6d01, 0x6d02].includes(
                    // @ts-expect-error typescript not checking against the instanceof
                    e.statusCode
                  ))
              ) {
                return from(getAppAndVersion(transport)).pipe(
                  concatMap((appAndVersion) => {
                    return !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of<FetchImageEvent>({
                          type: "appDetected",
                        });
                  })
                );
              }
              return throwError(e);
            })
          )
          .subscribe(subscriber);

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      })
  );

  return sub as Observable<FetchImageEvent>;
}

// transforms from a Stax binary image format to an LLM hex string format
const parseStaxImageFormat: (staxImageBuffer: Buffer) => Promise<string> =
  async (staxImageBuffer) => {
    // const width = staxImageBuffer.readUint16LE(0); // always 400
    // const height = staxImageBuffer.readUint16LE(2); // always 672
    const bppCompressionByte = staxImageBuffer.readUInt8(4);

    // const bpp = bppCompressionByte >> 4; // always 2
    const compression = bppCompressionByte & 0x0f;

    const dataLengthBuffer = Buffer.from([
      staxImageBuffer.readUInt8(5),
      staxImageBuffer.readUInt8(6),
      staxImageBuffer.readUInt8(7),
      0x00,
    ]);

    const dataLength = dataLengthBuffer.readUInt32LE();
    const imageData = staxImageBuffer.slice(8);

    if (compression === 0) {
      return imageData.toString("hex");
    }

    let uncompressedImageData = Buffer.from([]);

    let offset = 0;
    while (offset < dataLength) {
      const currentChunkSize = imageData.readUInt16LE(offset);
      offset += 2;

      const chunk = imageData.slice(offset, offset + currentChunkSize);
      const uncompressedChunk = await ungzip(chunk);

      uncompressedImageData = Buffer.concat([
        uncompressedImageData,
        uncompressedChunk,
      ]);
      offset += currentChunkSize;
    }

    return uncompressedImageData.toString("hex");
  };

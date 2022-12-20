import { Observable, from, of, throwError } from "rxjs";
import { catchError, concatMap, delay, mergeMap } from "rxjs/operators";
import {
  DeviceOnDashboardExpected,
  TransportError,
  TransportStatusError,
} from "@ledgerhq/errors";

import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import {
  ImageLoadRefusedOnDevice,
  ImageCommitRefusedOnDevice,
} from "../errors";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";
import staxFetchImageSize from "./staxFetchImageSize";
import staxFetchImageHash from "./staxFetchImageHash";
import { gzip } from "pako";

const MAX_APDU_SIZE = 255;
const COMPRESS_CHUNK_SIZE = 2048;

export type LoadImageEvent =
  | AttemptToQuitAppEvent
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "loadImagePermissionRequested";
    }
  | {
      type: "commitImagePermissionRequested";
    }
  | {
      type: "imageLoaded";
      imageSize: number;
      imageHash: string;
    };

export type LoadImageRequest = {
  deviceId: string;
  hexImage: string;
};

export default function loadImage({
  deviceId,
  hexImage,
}: LoadImageRequest): Observable<LoadImageEvent> {
  const sub = withDevice(deviceId)(
    (transport) =>
      new Observable((subscriber) => {
        const timeoutSub = of<LoadImageEvent>({
          type: "unresponsiveDevice",
        })
          .pipe(delay(1000))
          .subscribe((e) => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async () => {
              timeoutSub.unsubscribe();

              const imageData = await generateStaxImageFormat(hexImage, true);
              const imageLength = imageData.length;

              const imageSize = Buffer.alloc(4);
              imageSize.writeUIntBE(imageLength, 0, 4);

              subscriber.next({ type: "loadImagePermissionRequested" });
              const createImageResponse = await transport.send(
                0xe0,
                0x60,
                0x00,
                0x00,
                imageSize,
                [0x9000, 0x5501]
              );

              const createImageStatus = createImageResponse.readUInt16BE(
                createImageResponse.length - 2
              );
              const createImageStatusStr = createImageStatus.toString(16);
              // reads last 2 bytes which correspond to the status

              if (createImageStatus === 0x5501) {
                return subscriber.error(
                  new ImageLoadRefusedOnDevice(createImageStatusStr)
                );
              } else if (createImageStatus !== 0x9000) {
                return subscriber.error(
                  new TransportError(
                    "Unexpected device response",
                    createImageStatusStr
                  )
                );
              }

              let currentOffset = 0;
              // offset in number of charaters
              while (currentOffset < imageLength) {
                subscriber.next({
                  type: "progress",
                  progress: (currentOffset + 1) / imageLength,
                });

                // chunkSize in number of bytes
                const chunkSize = Math.min(
                  MAX_APDU_SIZE - 4,
                  imageLength - currentOffset
                );
                // we subtract 4 because the first 4 bytes of the data part of the apdu are used for
                // passing the offset of the chunk

                const chunkDataBuffer = imageData.slice(
                  currentOffset,
                  currentOffset + chunkSize
                );
                const chunkOffsetBuffer = Buffer.alloc(4);
                chunkOffsetBuffer.writeUIntBE(currentOffset, 0, 4);

                const apduData = Buffer.concat([
                  chunkOffsetBuffer,
                  chunkDataBuffer,
                ]);
                await transport.send(0xe0, 0x61, 0x00, 0x00, apduData);
                currentOffset += chunkSize;
              }

              subscriber.next({ type: "commitImagePermissionRequested" });

              const commitResponse = await transport.send(
                0xe0,
                0x62,
                0x00,
                0x00,
                Buffer.from([]),
                [0x9000, 0x5501]
              );

              const commitStatus = commitResponse.readUInt16BE(
                commitResponse.length - 2
              );
              const commitStatusStr = commitStatus.toString(16);
              // reads last 2 bytes which correspond to the status

              if (commitStatus === 0x5501) {
                return subscriber.error(
                  new ImageCommitRefusedOnDevice(commitStatusStr)
                );
              } else if (commitStatus !== 0x9000) {
                return subscriber.error(
                  new TransportError(
                    "Unexpected device response",
                    commitStatusStr
                  )
                );
              }

              // Fetch image size
              const imageBytes = await staxFetchImageSize(transport);

              // Fetch image hash
              const imageHash = await staxFetchImageHash(transport);

              subscriber.next({
                type: "imageLoaded",
                imageSize: imageBytes,
                imageHash,
              });

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
                      : of<LoadImageEvent>({
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

  return sub as Observable<LoadImageEvent>;
}

export const generateStaxImageFormat: (
  hexImage: string,
  compressImage: boolean
) => Promise<Buffer> = async (hexImage, compressImage) => {
  const width = 400;
  const height = 672;
  const bpp = 2; // value for 4 bits per pixel
  const compression = compressImage ? 1 : 0;

  const header = Buffer.alloc(8);

  header.writeUInt16LE(width, 0); // width
  header.writeUInt16LE(height, 2); // height
  header.writeUInt8((bpp << 4) | compression, 4);

  const imgData = Buffer.from(hexImage, "hex");

  if (!compressImage) {
    const dataLength = imgData.length;
    header.writeUInt8(dataLength & 0xff, 5); // lowest byte
    header.writeUInt8((dataLength >> 8) & 0xff, 6); // middle byte
    header.writeUInt8((dataLength >> 16) & 0xff, 7); // biggest byte

    return Buffer.concat([header, imgData]);
  }

  const chunkedImgData: Buffer[] = [];

  for (let i = 0; i < imgData.length; i += COMPRESS_CHUNK_SIZE) {
    chunkedImgData.push(imgData.slice(i, i + COMPRESS_CHUNK_SIZE));
  }

  const compressedChunkedImgData = await Promise.all(
    chunkedImgData.map(async (chunk) => {
      const compressedChunk = await gzip(chunk);

      const compressedChunkSize = Buffer.alloc(2);
      compressedChunkSize.writeUInt16LE(compressedChunk.length);

      return Buffer.concat([compressedChunkSize, compressedChunk]);
    })
  );

  const compressedData = Buffer.concat(compressedChunkedImgData);

  const dataLength = compressedData.length;

  header.writeUInt8(dataLength & 0xff, 5); // lowest byte
  header.writeUInt8((dataLength >> 8) & 0xff, 6); // middle byte
  header.writeUInt8((dataLength >> 16) & 0xff, 7); // biggest byte

  return Buffer.concat([header, Buffer.concat(compressedChunkedImgData)]);
};

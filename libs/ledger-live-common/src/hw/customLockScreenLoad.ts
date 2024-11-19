import { Observable, from, of, throwError } from "rxjs";
import { catchError, concatMap, delay, mergeMap, timeout } from "rxjs/operators";
import {
  DeviceOnDashboardExpected,
  ManagerNotEnoughSpaceError,
  StatusCodes,
  TransportError,
  TransportStatusError,
  DisconnectedDevice,
} from "@ledgerhq/errors";
import { getDeviceModel } from "@ledgerhq/devices";

import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import { ImageLoadRefusedOnDevice, ImageCommitRefusedOnDevice } from "../errors";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";
import attemptToQuitApp, { AttemptToQuitAppEvent } from "./attemptToQuitApp";
import customLockScreenFetchSize from "./customLockScreenFetchSize";
import customLockScreenFetchHash from "./customLockScreenFetchHash";
import { gzip } from "pako";
import { CLSSupportedDeviceModelId } from "../device/use-cases/isCustomLockScreenSupported";
import { getScreenSpecs } from "../device/use-cases/screenSpecs";

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

export type LoadimageResult = {
  imageHash: string;
  imageSize: number;
};

type ScreenSpecs = {
  width: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
};

export type LoadImageRequest = {
  hexImage: string; // When provided, will skip the backup if it matches the hash.
  padImage?: boolean;
  deviceModelId: CLSSupportedDeviceModelId;
};

export type Input = {
  deviceId: string;
  request: LoadImageRequest;
};

export default function loadImage({ deviceId, request }: Input): Observable<LoadImageEvent> {
  const { hexImage, padImage = true, deviceModelId } = request;
  const screenSpecs = getScreenSpecs(deviceModelId);

  const sub = withDevice(deviceId)(
    transport =>
      new Observable(subscriber => {
        const timeoutSub = of<LoadImageEvent>({ type: "unresponsiveDevice" })
          .pipe(delay(1000))
          .subscribe(e => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async () => {
              timeoutSub.unsubscribe();

              const imageData = await generateCustomLockScreenImageFormat(
                hexImage,
                true,
                !!padImage,
                screenSpecs,
              );
              const imageLength = imageData.length;

              const imageSize = Buffer.alloc(4);
              imageSize.writeUIntBE(imageLength, 0, 4);

              subscriber.next({ type: "loadImagePermissionRequested" });
              const createImageResponse = await transport.send(0xe0, 0x60, 0x00, 0x00, imageSize, [
                StatusCodes.NOT_ENOUGH_SPACE,
                StatusCodes.USER_REFUSED_ON_DEVICE,
                StatusCodes.OK,
              ]);

              const createImageStatus = createImageResponse.readUInt16BE(
                createImageResponse.length - 2,
              );
              const createImageStatusStr = createImageStatus.toString(16);
              // reads last 2 bytes which correspond to the status

              if (createImageStatus === StatusCodes.USER_REFUSED_ON_DEVICE) {
                return subscriber.error(
                  new ImageLoadRefusedOnDevice(createImageStatusStr, {
                    productName: getDeviceModel(deviceModelId).productName,
                  }),
                );
              } else if (createImageStatus === StatusCodes.NOT_ENOUGH_SPACE) {
                return subscriber.error(new ManagerNotEnoughSpaceError());
              } else if (createImageStatus !== StatusCodes.OK) {
                return subscriber.error(
                  new TransportError("Unexpected device response", createImageStatusStr),
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
                const chunkSize = Math.min(MAX_APDU_SIZE - 4, imageLength - currentOffset);
                // we subtract 4 because the first 4 bytes of the data part of the apdu are used for
                // passing the offset of the chunk

                const chunkDataBuffer = imageData.slice(currentOffset, currentOffset + chunkSize);
                const chunkOffsetBuffer = Buffer.alloc(4);
                chunkOffsetBuffer.writeUIntBE(currentOffset, 0, 4);

                const apduData = Buffer.concat([chunkOffsetBuffer, chunkDataBuffer]);
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
                [0x9000, 0x5501],
              );

              const commitStatus = commitResponse.readUInt16BE(commitResponse.length - 2);
              const commitStatusStr = commitStatus.toString(16);
              // reads last 2 bytes which correspond to the status

              if (commitStatus === 0x5501) {
                return subscriber.error(
                  new ImageCommitRefusedOnDevice(commitStatusStr, {
                    productName: getDeviceModel(deviceModelId).productName,
                  }),
                );
              } else if (commitStatus !== 0x9000) {
                return subscriber.error(
                  new TransportError("Unexpected device response", commitStatusStr),
                );
              }

              // Fetch image size
              const imageBytes = await customLockScreenFetchSize(transport);

              // Fetch image hash
              const imageHash = await customLockScreenFetchHash(transport);

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
                  [0x6e00, 0x6d00, 0x6e01, 0x6d01, 0x6d02].includes(e.statusCode))
              ) {
                return from(getAppAndVersion(transport)).pipe(
                  concatMap(appAndVersion => {
                    return !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of<LoadImageEvent>({
                          type: "appDetected",
                        });
                  }),
                );
              }
              return throwError(() => e);
            }),
          )
          .subscribe(subscriber);

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      }),
  ).pipe(
    timeout(5000),
    catchError(err => {
      if (err.name === "TimeoutError") {
        return throwError(() => new DisconnectedDevice());
      }
      return throwError(() => err);
    }),
  );

  return sub as Observable<LoadImageEvent>;
}

function padHexImage(hexImage: string, screenSpecs: ScreenSpecs): string {
  // hexImage is a string that is a hex representation of the image data
  // each character is a pixel (between 0 and 15) and it starts from the top right
  // corner, goes down the column and then to the next column, until the bottom left
  // We need to pad the image on the edges to match the screen specs.
  const sourceWidth = screenSpecs.width - screenSpecs.paddingLeft - screenSpecs.paddingRight;
  const sourceHeight = screenSpecs.height - screenSpecs.paddingTop - screenSpecs.paddingBottom;

  const destHeight = screenSpecs.height;

  let result = "";

  // add right padding
  result += "0".repeat(screenSpecs.paddingRight * destHeight);

  // add the image data
  for (let columnIndex = 0; columnIndex < sourceWidth; columnIndex++) {
    const column = hexImage.slice(columnIndex * sourceHeight, (columnIndex + 1) * sourceHeight);
    const topPadding = "0".repeat(screenSpecs.paddingTop);
    const paddingBottom = "0".repeat(screenSpecs.paddingBottom);
    result += topPadding + column + paddingBottom;
  }

  // add left padding
  result += "0".repeat(screenSpecs.paddingLeft * destHeight);

  return result;
}

export async function generateCustomLockScreenImageFormat(
  hexImage: string,
  compressImage: boolean,
  padImage: boolean,
  screenSpecs: ScreenSpecs,
) {
  const width = screenSpecs.width;
  const height = screenSpecs.height;
  const bpp = 2; // value for 4 bits per pixel
  const compression = compressImage ? 1 : 0;

  const header = Buffer.alloc(8);

  header.writeUInt16LE(width, 0); // width
  header.writeUInt16LE(height, 2); // height
  header.writeUInt8((bpp << 4) | compression, 4);

  const paddedHexImage = padImage ? padHexImage(hexImage, screenSpecs) : hexImage;
  const imgData = Buffer.from(paddedHexImage, "hex");

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
    chunkedImgData.map(async chunk => {
      const compressedChunk = await gzip(chunk);

      const compressedChunkSize = Buffer.alloc(2);
      compressedChunkSize.writeUInt16LE(compressedChunk.length);

      return Buffer.concat([compressedChunkSize, compressedChunk]);
    }),
  );

  const compressedData = Buffer.concat(compressedChunkedImgData);

  const dataLength = compressedData.length;

  header.writeUInt8(dataLength & 0xff, 5); // lowest byte
  header.writeUInt8((dataLength >> 8) & 0xff, 6); // middle byte
  header.writeUInt8((dataLength >> 16) & 0xff, 7); // biggest byte

  return Buffer.concat([header, Buffer.concat(compressedChunkedImgData)]);
}

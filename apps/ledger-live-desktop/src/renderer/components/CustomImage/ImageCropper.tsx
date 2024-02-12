import React, { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import { ImageBase64Data, ImageDimensions } from "./types";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { Button, Flex, IconsLegacy } from "@ledgerhq/react-ui";
import Cropper, { Area, CropperProps } from "react-easy-crop";
import { createCanvas, getRadianAngle, rotateSize } from "./imageUtils";
import { ImageCropError } from "@ledgerhq/live-common/customImage/errors";
import { useTrack } from "~/renderer/analytics/segment";

export type CropResult = ImageDimensions & ImageBase64Data;

type Crop = Area;

const MAX_ZOOM = 10;

export type CropParams = {
  crop: Crop;
  rotationIncrements: number;
  zoom: number;
  imageUuid: string;
};

export type Props = ImageBase64Data & {
  targetDimensions: { width: number; height: number };
  onResult: (_: CropResult) => void;
  onError: (_: Error) => void;
  setCropParams: (_: CropParams) => void;
  setLoading: (_: boolean) => void;
  withButton?: boolean;
  initialCropParams?: CropParams;
};

/**
 * Crops & resizes an image given some cropping & rotation parameters,
 * and a target dimensions.
 *
 * This function can work with an image that is already loaded but loads it if
 * needed.
 * The proper use case is to mount the image in the React component tree so its
 * loading is triggered automatically, and pass the ref of that image component
 * to this function, so it won't have to reload the image in most cases.
 *
 * @param imageRef ref of an HTMLImageElement
 * @param targetDimensions dimensions to resize the image to after cropping
 * @param pixelCrop coordinates of the cropping
 * @param rotationIncrements increments of 90° angle
 * @returns a promise with the image data & dimensions
 */
async function cropAndResizeImage(
  imageRef: React.RefObject<HTMLImageElement>,
  targetDimensions: ImageDimensions,
  pixelCrop: Crop,
  /** increments of 90° */
  rotationIncrements: number,
): Promise<CropResult> {
  const image = imageRef?.current;
  if (!image) throw new Error("imageRef.current is nullish");
  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
  }

  const { canvas, context: ctx } = createCanvas(image);
  if (!ctx) throw Error('Context "ctx" is null');

  const rotDeg = rotationIncrements * 90;
  const rotRad = getRadianAngle(rotationIncrements * 90);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.naturalWidth,
    image.naturalHeight,
    rotDeg,
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // new canvas used to resize to the target dimensions
  const { context: resizedCtx, canvas: resizedCanvas } = createCanvas();
  if (resizedCtx === null) throw new Error('Context "croppedCtx" is null');
  resizedCanvas.width = targetDimensions.width;
  resizedCanvas.height = targetDimensions.height;
  resizedCtx.drawImage(
    canvas,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetDimensions.width,
    targetDimensions.height,
  );

  return {
    imageBase64DataUri: resizedCanvas.toDataURL(),
    height: resizedCanvas.height,
    width: resizedCanvas.width,
  };
}

type CropState = {
  x: number;
  y: number;
};

const ImageCropper: React.FC<Props> = props => {
  const {
    imageBase64DataUri,
    targetDimensions,
    onResult,
    onError,
    initialCropParams,
    setCropParams,
    setLoading,
  } = props;

  const track = useTrack();

  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0 });
  const [completeCropPixel, setCompleteCropPixel] = useState<Crop>();

  const imageUuid = imageBase64DataUri;
  const shouldUseInitialCropParams = initialCropParams && initialCropParams.imageUuid === imageUuid;
  const [initialCroppedAreaPixels] = useState(
    shouldUseInitialCropParams ? initialCropParams?.crop : undefined,
  );
  /** increments of 90° */
  const [rotationIncrements, setRotationIncrements] = useState<number>(
    shouldUseInitialCropParams ? initialCropParams.rotationIncrements : 0,
  );
  const [zoom, setZoom] = React.useState(shouldUseInitialCropParams ? initialCropParams.zoom : 1);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const aspect = targetDimensions.width / targetDimensions.height;
  const debouncedCompleteCropPixel = useDebounce(completeCropPixel, 500);

  useEffect(() => {
    let dead = false;
    if (!imageRef.current) return;
    if (!debouncedCompleteCropPixel) return;
    setLoading(true);
    cropAndResizeImage(imageRef, targetDimensions, debouncedCompleteCropPixel, rotationIncrements)
      .then(res => {
        setLoading(false);
        if (dead) return;
        onResult(res);
      })
      .catch(e => {
        if (dead) return;
        console.error(e);
        onError(new ImageCropError());
      });
    return () => {
      dead = true;
    };
    /**
     * rotationIncrements is not a dependency as a change of its value causes
     * a rerender of the cropping view (with that new rotation) which in turns
     * triggers a new completeCropPixel (debouncedCompleteCropPixel)
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCompleteCropPixel, targetDimensions, onResult, setLoading]);

  const rotateCounterClockwise: () => void = useCallback(() => {
    track("button_clicked2", { button: "Rotate" });
    setLoading(true);
    /** the increments are of 90° so 360°/4 */
    setRotationIncrements((rotationIncrements - 1) % 4);
  }, [track, setLoading, rotationIncrements]);

  const handleCropChange = useCallback(
    (crop: CropState) => {
      setCrop(crop);
    },
    [setCrop],
  );

  const handleInteractionStart = useCallback(() => {
    setLoading(true);
  }, [setLoading]);

  const handleWheelRequest: CropperProps["onWheelRequest"] = useCallback(
    /**
     * Deny wheel request corresponding to a zoom out (resp. zoom in) in case
     * the image is zoomed out (resp. zoomed in) to the maximum, as otherwise
     * it will trigger onInteractionStart (which turns on the loading state) but
     * then it will never trigger onCropComplete, so until further interaction
     * the loading state will be kept on (infinite loading).
     */
    (e: WheelEvent) => !((zoom === 1 && e.deltaY > 0) || (zoom === MAX_ZOOM && e.deltaY < 0)),
    [zoom],
  );

  const handleCropComplete = useCallback(
    (_: unknown, cropPixel: Crop) => {
      setCompleteCropPixel(cropPixel);
      setCropParams({ crop: cropPixel, imageUuid, rotationIncrements, zoom });
    },
    [setCompleteCropPixel, imageUuid, rotationIncrements, setCropParams, zoom],
  );

  const handleError = useCallback(
    (e: SyntheticEvent) => {
      console.error(e);
      onError(new ImageCropError());
    },
    [onError],
  );

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <Flex position="relative" height={330} width={330} data-test-id="custom-image-crop-view">
        <img
          src={imageBase64DataUri}
          ref={imageRef}
          style={{ height: 10, opacity: 0 }}
          onError={handleError}
        />
        <Cropper
          image={imageBase64DataUri}
          crop={crop}
          zoom={zoom}
          maxZoom={MAX_ZOOM}
          rotation={rotationIncrements * 90}
          aspect={aspect}
          onWheelRequest={handleWheelRequest}
          onInteractionStart={handleInteractionStart}
          onCropChange={handleCropChange}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
          initialCroppedAreaPixels={initialCroppedAreaPixels}
          objectFit="vertical-cover"
        />
      </Flex>
      <Button
        mt={10}
        variant="shade"
        outline
        backgroundColor="transparent"
        onClick={rotateCounterClockwise}
        Icon={IconsLegacy.ReverseMedium}
        data-test-id="custom-image-crop-rotate-button"
      >
        Rotate
      </Button>
    </Flex>
  );
};

export default ImageCropper;

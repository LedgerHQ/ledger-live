import React, { useEffect, useState } from "react";
import { Alert, Flex, Text } from "@ledgerhq/react-ui";
import { ProcessorResult } from "~/renderer/components/CustomImage/ImageGrayscalePreview";
import { targetDimensions } from "~/renderer/components/CustomImage/shared";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { createCanvas } from "~/renderer/components/CustomImage/imageUtils";
import { ImageProcessingError } from "@ledgerhq/live-common/customImage/errors";

function reconstructImage({
  hexData,
  width,
  height,
}: ProcessorResult["rawResult"]): ImageBase64Data {
  const { canvas, context } = createCanvas();
  canvas.height = height;
  canvas.width = width;
  if (context === null) throw new Error("Context is null");

  const numLevelsOfGray = 16;
  const rgbStep = 255 / (numLevelsOfGray - 1);

  const pixels = Array.from(Array(height), () => Array(width));
  hexData.split("").forEach((char, index) => {
    const y = index % height;
    const x = width - 1 - (index - y) / height;
    const numericVal16 = Number.parseInt(char, 16);
    const numericVal256 = numericVal16 * rgbStep;
    pixels[y][x] = numericVal256;
  });

  const imageData = [];
  // Raw data -> by column, from right to left, from top to bottom
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = pixels[y][x];
      imageData.push(val); // R
      imageData.push(val); // G
      imageData.push(val); // B
      imageData.push(255); // alpha
    }
  }
  context.putImageData(
    new ImageData(Uint8ClampedArray.from(imageData), width, height), // eslint-disable-line no-undef
    0,
    0,
  );
  return { imageBase64DataUri: canvas.toDataURL() };
}

const infoMessage = `This is meant as a data validation. We want to validate \
that the raw data above (that is eventually what will be transfered) allows to \
reconstruct exactly the image previewed on the previous screen.
We take this raw data and use it to rebuild the image from scratch, then \
we try to match the binary value of the "previewed" image and the \
"reconstructed" image.`;
const successMessage =
  "Raw data is valid. Image is 100% matching the preview displayed on the preview screen.";
const errorMessage = `\
Raw data is invalid.
The reconstructed image is not matching the preview \
displayed on the preview screen.
This should NOT happen, it means that some data has been lost.`;

type Props = {
  onError: (error: Error) => void;
  result?: ProcessorResult;
};

const TestImage: React.FC<Props> = props => {
  const { result, onError } = props;
  const [reconstructedImage, setReconstructedImage] = useState<ImageBase64Data>();

  const { rawResult } = result || {};

  useEffect(() => {
    try {
      if (result) setReconstructedImage(reconstructImage(result?.rawResult));
    } catch (e) {
      console.error(e);
      onError(new ImageProcessingError());
    }
  }, [result, setReconstructedImage, onError]);

  const isDataMatching =
    result?.previewResult.imageBase64DataUri === reconstructedImage?.imageBase64DataUri;
  return (
    <Flex flexDirection="column">
      {isDataMatching ? (
        <Alert showIcon={false} title={successMessage} />
      ) : (
        <Alert showIcon={false} type="error" title={errorMessage} />
      )}
      <Flex flex={1} alignItems="center" flexDirection="column">
        <Text>Reconstructed image:</Text>
        {reconstructedImage ? (
          <img
            src={reconstructedImage?.imageBase64DataUri}
            style={{ height: targetDimensions.height }}
          />
        ) : null}
      </Flex>
      {rawResult?.hexData && (
        <>
          <Text alignSelf="flex-start" variant="paragraph" py={4}>
            Raw data (200 first characters):
          </Text>
          <Flex backgroundColor="neutral.c30" flexDirection="column" width="100%">
            <Text>width: {rawResult?.width}</Text>
            <Text>height: {rawResult?.height}</Text>
            <Text style={{ overflowWrap: "break-word" }}>{rawResult?.hexData.slice(0, 200)}</Text>
          </Flex>
        </>
      )}
      <Alert showIcon={false} title={infoMessage} />
    </Flex>
  );
};

export default TestImage;

import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, Image, Pressable } from "react-native";
import Alert from "../Alert";
import { ProcessorPreviewResult, ProcessorRawResult } from "./ImageProcessor";
import { fitImageContain } from "./imageUtils";
import ResultDataTester from "./ResultDataTester";

type Props = {
  rawData: ProcessorRawResult;
  previewData: ProcessorPreviewResult;
  onError: (e: Error) => void;
};

const boxToFitDimensions = {
  height: (Dimensions.get("screen").height * 2) / 3,
  width: (Dimensions.get("screen").width * 2) / 3,
};

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

const TestImage: React.FC<Props> = props => {
  const { rawData, previewData, onError } = props;
  const [reconstructedPreviewResult, setReconstructedPreviewResult] =
    useState<ProcessorPreviewResult | null>(null);

  const handlePreviewResult = useCallback((res: ProcessorPreviewResult) => {
    setReconstructedPreviewResult(res);
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      onError(error);
    },
    [onError],
  );

  const previewDimensions = useMemo(
    () =>
      fitImageContain(
        {
          width: reconstructedPreviewResult?.width ?? 200,
          height: reconstructedPreviewResult?.height ?? 200,
        },
        boxToFitDimensions,
      ),
    [reconstructedPreviewResult?.height, reconstructedPreviewResult?.width],
  );

  const [showReconstructed, setShowReconstructed] = useState(true);
  const handlePressIn = useCallback(
    () => setShowReconstructed(false),
    [setShowReconstructed],
  );
  const handlePressOut = useCallback(
    () => setShowReconstructed(true),
    [setShowReconstructed],
  );

  const isDataMatching =
    reconstructedPreviewResult?.imageBase64DataUri ===
    previewData?.imageBase64DataUri;

  return (
    <Flex flex={1} pt={6} flexDirection="column" alignItems="center">
      {rawData?.hexData && (
        <>
          <Text variant="h3" py={4}>
            Raw data (200 first characters):
          </Text>
          <Flex backgroundColor="neutral.c30">
            <Text>width: {rawData?.width}</Text>
            <Text>height: {rawData?.height}</Text>
            <Text>{rawData?.hexData.slice(0, 200)}</Text>
          </Flex>
        </>
      )}
      <Text variant="h3" py={4} alignSelf="flex-start">
        Image reconstructed from raw data:
      </Text>
      {rawData && (
        <ResultDataTester
          {...rawData}
          onPreviewResult={handlePreviewResult}
          onError={handleError}
        />
      )}
      {reconstructedPreviewResult?.imageBase64DataUri ? (
        <Flex mb={5} alignItems="center">
          {isDataMatching ? (
            <Alert type="success" title={successMessage} />
          ) : (
            <Alert type="error" title={errorMessage} />
          )}
          <Text textAlign="center">
            {"Press the image below to see the difference.\n"}
            {showReconstructed ? "Reconstructed image:" : "Previewed image:"}
          </Text>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={{
              ...previewDimensions,
            }}
          >
            <Flex position="absolute">
              <Image
                resizeMode="contain"
                source={{
                  uri: previewData.imageBase64DataUri,
                }}
                style={previewDimensions}
              />
            </Flex>
            <Flex position="absolute" opacity={showReconstructed ? 1 : 0}>
              <Image
                resizeMode="contain"
                source={{
                  uri: reconstructedPreviewResult.imageBase64DataUri,
                }}
                style={previewDimensions}
              />
            </Flex>
          </Pressable>
        </Flex>
      ) : (
        <InfiniteLoader />
      )}
      <Alert type="primary" title={infoMessage} />
    </Flex>
  );
};

export default TestImage;

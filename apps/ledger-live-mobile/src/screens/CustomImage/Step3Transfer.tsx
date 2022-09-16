import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView } from "react-native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProcessorPreviewResult } from "../../components/CustomImage/ImageProcessor";
import ResultDataTester from "../../components/CustomImage/ResultDataTester";
import { fitImageContain } from "../../components/CustomImage/imageUtils";
import { PreviewImage } from "./Step2Preview";
import Alert from "../../components/Alert";
import { ScreenName } from "../../const";
import { ParamList } from "./types";

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

/**
 * UI component that reconstructs an image from the raw hex data received as a
 * route param, and compares it to the preview base64 URI data received as a
 * route param.
 *
 * This is meant as a data validation. We want to validate that the raw data
 * (that is eventually what will be transfered) allows to reconstruct exactly
 * the image previewed on the previous screen.
 *
 * We take this raw data and use it to rebuild the image from scratch, then
 * we try to match the binary value of the "previewed" image and the "reconstructed"
 * image.
 */
const Step3Transfer: React.FC<
  StackScreenProps<ParamList, "CustomImageStep3Transfer">
> = ({ route, navigation }) => {
  const [reconstructedPreviewResult, setReconstructedPreviewResult] =
    useState<ProcessorPreviewResult | null>(null);

  const { rawData, previewData } = route.params;

  const handlePreviewResult = useCallback((res: ProcessorPreviewResult) => {
    setReconstructedPreviewResult(res);
  }, []);

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(
        ScreenName.CustomImageErrorScreen as "CustomImageErrorScreen",
        { error },
      );
    },
    [navigation],
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

  const insets = useSafeAreaInsets();

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
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
      <Flex p={6}>
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
        <Flex
          flex={1}
          pt={6}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
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
                {showReconstructed
                  ? "Reconstructed image:"
                  : "Previewed image:"}
              </Text>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                  ...previewDimensions,
                }}
              >
                <Flex position="absolute">
                  <PreviewImage
                    source={{
                      uri: previewData.imageBase64DataUri,
                    }}
                    style={previewDimensions}
                  />
                </Flex>
                <Flex position="absolute" opacity={showReconstructed ? 1 : 0}>
                  <PreviewImage
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
      </Flex>
    </ScrollView>
  );
};

export default Step3Transfer;

import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, ScrollView } from "react-native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
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

  return (
    <ScrollView>
      <Flex p={6}>
        {rawData?.hexData && (
          <>
            <Text variant="h3" py={4}>
              Raw data (500 first characters):
            </Text>
            <Flex backgroundColor="neutral.c30">
              <Text>width: {rawData?.width}</Text>
              <Text>height: {rawData?.height}</Text>
              <Text>{rawData?.hexData.slice(0, 500)}</Text>
            </Flex>
          </>
        )}
        {rawData && (
          <ResultDataTester
            {...rawData}
            onPreviewResult={handlePreviewResult}
            onError={handleError}
          />
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
          <Alert type="primary" title={infoMessage} />
          {reconstructedPreviewResult?.imageBase64DataUri ? (
            <Flex mt={5}>
              {reconstructedPreviewResult?.imageBase64DataUri ===
              previewData?.imageBase64DataUri ? (
                <Alert type="success" title={successMessage} />
              ) : (
                <Alert type="error" title={errorMessage} />
              )}
              <PreviewImage
                source={{
                  uri: reconstructedPreviewResult.imageBase64DataUri,
                }}
                style={{
                  height: previewDimensions?.height,
                  width: previewDimensions?.width,
                }}
              />
            </Flex>
          ) : (
            <InfiniteLoader />
          )}
        </Flex>
      </Flex>
    </ScrollView>
  );
};

export default Step3Transfer;

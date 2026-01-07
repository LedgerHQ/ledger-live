import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { ImageProcessingError } from "@ledgerhq/live-common/customImage/errors";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { ImageBase64Data } from "./types";
import ContrastChoice from "./ContrastChoice";
import FramedPicture from "./FramedPicture";
import { getScreenSpecs } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import {
  DitheringConfigKey,
  ProcessorResult,
  ProcessorPreviewResult,
  DitheringAlgorithm,
} from "./dithering/types";
import {
  mapDitheringConfigKeyToConfig,
  mapDitheringConfigKeyToAppearance,
  getAvailableDitheringConfigKeys,
} from "./dithering/config";
import { processImage } from "./dithering/processImage";

export type Props = ImageBase64Data & {
  onError: (_: Error) => void;
  onResult: (_: ProcessorResult) => void;
  setLoading: (_: boolean) => void;
  onDitheringConfigChanged: (_: {
    index: number;
    contrastValue: number;
    ditheringAlgorithm: DitheringAlgorithm;
  }) => void;
  deviceModelId: CLSSupportedDeviceModelId;
};

const ImageDithering: React.FC<Props> = props => {
  const {
    onError,
    imageBase64DataUri,
    onResult,
    setLoading,
    onDitheringConfigChanged,
    deviceModelId,
  } = props;

  const bitsPerPixel = getScreenSpecs(deviceModelId).bitsPerPixel;

  const [ditheringConfigKey, setDitheringConfigKey] = useState<DitheringConfigKey>(
    bitsPerPixel === 1 ? DitheringConfigKey.OneBPPFirst : DitheringConfigKey.FourBPPFirst,
  );

  const [sourceUriLoaded, setSourceUriLoaded] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ProcessorPreviewResult | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  const availableDitheringConfigKeys = useMemo(
    () => getAvailableDitheringConfigKeys(bitsPerPixel),
    [bitsPerPixel],
  );

  useEffect(() => {
    onDitheringConfigChanged({
      index: ditheringConfigKey,
      contrastValue: mapDitheringConfigKeyToConfig[ditheringConfigKey].contrastValue,
      ditheringAlgorithm: mapDitheringConfigKeyToConfig[ditheringConfigKey].algorithm,
    });
  }, [ditheringConfigKey, onDitheringConfigChanged]);

  useEffect(() => {
    if (sourceImageRef.current && sourceUriLoaded && sourceUriLoaded === imageBase64DataUri) {
      try {
        const { previewResult, rawResult } = processImage({
          image: sourceImageRef.current,
          contrast: mapDitheringConfigKeyToConfig[ditheringConfigKey].contrastValue,
          ditheringAlgorithm: mapDitheringConfigKeyToConfig[ditheringConfigKey].algorithm,
          bitsPerPixel: bitsPerPixel,
        });
        setPreviewResult(previewResult);
        onResult({ previewResult, rawResult });
        setLoading(false);
      } catch (e) {
        console.error(e);
        onError(new ImageProcessingError());
      }
    }
  }, [
    sourceUriLoaded,
    imageBase64DataUri,
    ditheringConfigKey,
    onResult,
    sourceImageRef,
    setLoading,
    onError,
    deviceModelId,
    bitsPerPixel,
  ]);

  const handleSourceLoaded: React.ReactEventHandler<HTMLImageElement> = useCallback(
    e => {
      // @ts-expect-error why is src not on target even though we give it HTMLImageElement
      setSourceUriLoaded(e.target.src);
    },
    [setSourceUriLoaded],
  );

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <img
        ref={sourceImageRef}
        src={props.imageBase64DataUri}
        style={{ opacity: 0, position: "absolute", pointerEvents: "none" }}
        onLoad={handleSourceLoaded}
      />
      {previewResult ? (
        <FramedPicture deviceModelId={deviceModelId} source={previewResult?.imageBase64DataUri} />
      ) : null}
      <Flex alignSelf="center" flexDirection="row" mt={8} columnGap={2}>
        {availableDitheringConfigKeys.map((key, index) => (
          <ContrastChoice
            key={key}
            onClick={() => setDitheringConfigKey(key)}
            appearance={mapDitheringConfigKeyToAppearance[key]}
            selected={ditheringConfigKey === key}
            index={index}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export default React.memo(ImageDithering);

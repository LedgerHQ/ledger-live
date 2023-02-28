import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NFTMetadata } from "@ledgerhq/types-live";
import { getMetadataMediaTypes } from "~/helpers/nft";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import ImportImage from "~/renderer/components/CustomImage/ImportImage";
import ImportNFTButton from "~/renderer/components/CustomImage/ImportNFTButton";
import NFTGallerySelector from "~/renderer/components/CustomImage/NFTGallerySelector";
import { StepProps } from "./types";
import StepContainer from "./StepContainer";
import { Flex } from "@ledgerhq/react-ui";
import StepFooter from "./StepFooter";
import {
  ImageLoadFromNftError,
  ImageDownloadError,
} from "@ledgerhq/live-common/customImage/errors";
import { urlContentToDataUri } from "~/renderer/components/CustomImage/shared";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";

type Props = StepProps & {
  onResult: (res: ImageBase64Data) => void;
  setLoading: (_: boolean) => void;
  isShowingNftGallery?: boolean;
  setIsShowingNftGallery: (_: boolean) => void;
};

const defaultMediaTypes = ["original", "big", "preview"];

const extractNftBase64 = (metadata: NFTMetadata) => {
  const mediaTypes = metadata ? getMetadataMediaTypes(metadata) : null;
  const mediaSizeForCustomImage = mediaTypes
    ? defaultMediaTypes.find(size => mediaTypes[size] === "image")
    : null;
  const customImageUri =
    (mediaSizeForCustomImage && metadata?.medias?.[mediaSizeForCustomImage]?.uri) || null;
  return customImageUri;
};

const StepChooseImage: React.FC<Props> = props => {
  const { setLoading, onResult, onError, isShowingNftGallery, setIsShowingNftGallery } = props;
  const isMounted = useIsMounted();
  const { t } = useTranslation();

  const [selectedNftId, setSelectedNftId] = useState<string>();
  const [selectedNftBase64Data, setSelectedNftBase64] = useState<ImageBase64Data | null>(null);

  const handleClickNext = useCallback(() => {
    if (!selectedNftBase64Data) {
      onError(new ImageLoadFromNftError());
    } else onResult(selectedNftBase64Data);
  }, [selectedNftBase64Data, onError, onResult]);

  const handleClickPrevious = useCallback(() => {
    setSelectedNftBase64(null);
    setSelectedNftId(undefined);
    setIsShowingNftGallery(false);
  }, [setIsShowingNftGallery]);

  const handlePickNft = useCallback(
    (id: string, nftMetadata: NFTMetadata) => {
      if (selectedNftId === id) {
        setSelectedNftId(undefined);
        setSelectedNftBase64(null);
        return;
      } else if (selectedNftId) {
        setSelectedNftBase64(null);
      }
      setSelectedNftId(id);
      const uri = extractNftBase64(nftMetadata);
      const t1 = Date.now();
      urlContentToDataUri(uri)
        .then(res => {
          /**
           * virtual delay to ensure showing loading state at least 400ms so
           * it doesn't look glitchy if it's too fast
           */
          setTimeout(() => {
            if (!isMounted()) return;
            setSelectedNftBase64({ imageBase64DataUri: res as string });
          }, Math.max(0, 400 - (Date.now() - t1)));
        })
        .catch(() => {
          onError(new ImageDownloadError());
        });
    },
    [isMounted, onError, selectedNftId],
  );

  return (
    <StepContainer
      footer={
        isShowingNftGallery ? (
          <StepFooter
            nextDisabled={!selectedNftBase64Data}
            nextLoading={Boolean(selectedNftId && !selectedNftBase64Data)}
            nextLabel={t("customImage.steps.choose.selectNft")}
            previousLabel={t("common.previous")}
            onClickNext={handleClickNext}
            onClickPrevious={handleClickPrevious}
            previousTestId="custom-image-nft-previous-button"
            nextTestId="custom-image-nft-continue-button"
          />
        ) : null
      }
    >
      {!isShowingNftGallery ? (
        <Flex flexDirection="column" rowGap={6} px={12}>
          <ImportImage setLoading={setLoading} onResult={onResult} onError={onError} />
          <ImportNFTButton onClick={() => setIsShowingNftGallery(true)} />
        </Flex>
      ) : (
        <NFTGallerySelector handlePickNft={handlePickNft} selectedNftId={selectedNftId} />
      )}
    </StepContainer>
  );
};

export default StepChooseImage;

import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NFTMetadata } from "@ledgerhq/types-live";
import { getMetadataMediaTypes } from "~/helpers/nft";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import ImportImage from "~/renderer/components/CustomImage/ImportImage";
import ImportNFT from "~/renderer/components/CustomImage/ImportNFT";
import NFTGallerySelector from "~/renderer/components/CustomImage/NFTGallerySelector";
import { StepProps } from "./types";
import StepContainer from "./StepContainer";
import { Box } from "@ledgerhq/react-ui";
import StepFooter from "./StepFooter";
import {
  ImageLoadFromNftError,
  ImageDownloadError,
} from "@ledgerhq/live-common/customImage/errors";

type Props = StepProps & {
  onResult: (res: ImageBase64Data) => void;
  setLoading: (_: boolean) => void;
};

const extractNftBase64 = (metadata: NFTMetadata) => {
  const mediaTypes = metadata ? getMetadataMediaTypes(metadata) : null;
  const mediaSizeForCustomImage = mediaTypes
    ? ["original", "big", "preview"].find(size => mediaTypes[size] === "image")
    : null;
  const customImageUri =
    (mediaSizeForCustomImage && metadata?.medias?.[mediaSizeForCustomImage]?.uri) || null;
  return customImageUri;
};

const StepChooseImage: React.FC<Props> = props => {
  const { setLoading, onResult, onError } = props;
  const { t } = useTranslation();

  const [isShowingNftGallery, setIsShowingNftGallery] = useState<boolean>(false);
  const [currentBase64, setCurrentBase64] = useState<ImageBase64Data | null>(null);

  const handleClickNext = useCallback(() => {
    if (!currentBase64) {
      onError(new ImageLoadFromNftError());
    } else onResult(currentBase64);
  }, [currentBase64, onError, onResult]);

  const handleClickPrevious = useCallback(() => {
    setCurrentBase64(null);
    setIsShowingNftGallery(false);
  }, []);

  const handlePickNft = useCallback(
    (nftMetadata: NFTMetadata) => {
      const uri = extractNftBase64(nftMetadata);
      fetch(uri)
        .then(response => response.blob())
        .then(
          blob =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            }),
        )
        .then(res => setCurrentBase64({ imageBase64DataUri: res as string }))
        .catch(() => {
          onError(new ImageDownloadError());
        });
    },
    [onError],
  );

  return (
    <StepContainer
      footer={
        isShowingNftGallery ? (
          <StepFooter
            nextDisabled={!currentBase64}
            nextLabel={t("customImage.steps.choose.selectNft")}
            previousLabel={t("customImage.steps.choose.previousSelectNft")}
            onClickNext={handleClickNext}
            onClickPrevious={handleClickPrevious}
            nextTestId="custom-image-select-nft-button"
          />
        ) : null
      }
    >
      {!isShowingNftGallery ? (
        <>
          <ImportImage setLoading={setLoading} onResult={onResult} onError={onError} />
          <Box mt={6} onClick={() => setIsShowingNftGallery(true)}>
            <ImportNFT />
          </Box>
        </>
      ) : (
        <NFTGallerySelector handlePickNft={handlePickNft} />
      )}
    </StepContainer>
  );
};

export default StepChooseImage;

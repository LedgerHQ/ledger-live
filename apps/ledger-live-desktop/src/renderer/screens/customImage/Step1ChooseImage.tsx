import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NFTMetadata, NFTMedias } from "@ledgerhq/types-live";
import { getMetadataMediaTypes } from "~/helpers/nft";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import ImportImage from "~/renderer/components/CustomImage/ImportImage";
import ImportNFTButton from "~/renderer/components/CustomImage/ImportNFTButton";
import NFTGallerySelector from "~/renderer/components/CustomImage/NFTGallerySelector";
import { StepProps } from "./types";
import StepContainer from "./StepContainer";
import { Flex, IconsLegacy, InfiniteLoader, Link } from "@ledgerhq/react-ui";
import StepFooter from "./StepFooter";
import {
  ImageLoadFromNftError,
  ImageDownloadError,
} from "@ledgerhq/live-common/customImage/errors";
import { urlContentToDataUri } from "~/renderer/components/CustomImage/shared";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsPageNames, analyticsFlowName } from "./shared";
import { useTrack } from "~/renderer/analytics/segment";
import { setDrawer } from "~/renderer/drawers/Provider";
import RemoveCustomImage from "../manager/DeviceDashboard/DeviceInformationSummary/RemoveCustomImage";
import { useSelector } from "react-redux";
import { lastSeenCustomImageSelector } from "~/renderer/reducers/settings";

type Props = StepProps & {
  onResult: (res: ImageBase64Data) => void;
  setLoading: (_: boolean) => void;
  isShowingNftGallery?: boolean;
  setIsShowingNftGallery: (_: boolean) => void;
  loading?: boolean;
};

const defaultMediaTypes = ["original", "big", "preview"];

const extractNftBase64 = (metadata: NFTMetadata) => {
  const mediaTypes = metadata ? getMetadataMediaTypes(metadata) : null;
  const mediaSizeForCustomImage = mediaTypes
    ? defaultMediaTypes.find(size => mediaTypes[size] === "image")
    : null;
  const customImageUri =
    (mediaSizeForCustomImage &&
      metadata?.medias?.[mediaSizeForCustomImage as keyof NFTMedias]?.uri) ||
    null;
  return customImageUri;
};

const StepChooseImage: React.FC<Props> = props => {
  const { loading, setLoading, onResult, onError, isShowingNftGallery, setIsShowingNftGallery } =
    props;
  const isMounted = useIsMounted();
  const { t } = useTranslation();
  const track = useTrack();

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
      if (uri) {
        urlContentToDataUri(uri)
          .then(res => {
            /**
             * virtual delay to ensure showing loading state at least 400ms so
             * it doesn't look glitchy if it's too fast
             */
            setTimeout(
              () => {
                if (!isMounted()) return;
                setSelectedNftBase64({ imageBase64DataUri: res as string });
              },
              Math.max(0, 400 - (Date.now() - t1)),
            );
          })
          .catch(() => {
            onError(new ImageDownloadError());
          });
      }
    },
    [isMounted, onError, selectedNftId],
  );

  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);

  const onRemove = useCallback(() => {
    setDrawer(RemoveCustomImage, {});
  }, []);

  return (
    <StepContainer
      footer={
        loading ? null : isShowingNftGallery ? (
          <StepFooter
            nextDisabled={!selectedNftBase64Data}
            nextLoading={Boolean(selectedNftId && !selectedNftBase64Data)}
            nextLabel={t("customImage.steps.choose.selectNft")}
            previousLabel={t("common.back")}
            onClickNext={handleClickNext}
            onClickPrevious={handleClickPrevious}
            previousTestId="custom-image-nft-previous-button"
            nextTestId="custom-image-nft-continue-button"
          />
        ) : null
      }
    >
      <TrackPage
        category={
          isShowingNftGallery ? analyticsPageNames.chooseNftGallery : analyticsPageNames.chooseImage
        }
        type="drawer"
        flow={analyticsFlowName}
        refreshSource={false}
      />
      {loading ? (
        <Flex flex={1} justifyContent="center" alignItems="center">
          <InfiniteLoader />
        </Flex>
      ) : !isShowingNftGallery ? (
        <Flex flexDirection="column" rowGap={6} px={12}>
          <ImportImage
            setLoading={setLoading}
            onResult={onResult}
            onError={onError}
            onClick={() =>
              track("button_clicked", {
                button: "Choose from my picture gallery",
              })
            }
          />
          <ImportNFTButton
            onClick={() => {
              setIsShowingNftGallery(true);
              track("button_clicked", {
                button: "Choose from NFT gallery",
              });
            }}
          />
          {lastSeenCustomImage?.size ? (
            <Link
              size="medium"
              color="error.c60"
              mt={10}
              onClick={onRemove}
              Icon={IconsLegacy.TrashMedium}
            >
              {t("removeCurrentPicture.cta")}
            </Link>
          ) : null}
        </Flex>
      ) : (
        <NFTGallerySelector handlePickNft={handlePickNft} selectedNftId={selectedNftId} />
      )}
    </StepContainer>
  );
};

export default StepChooseImage;

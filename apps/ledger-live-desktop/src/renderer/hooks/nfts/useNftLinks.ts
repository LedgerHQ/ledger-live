import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Account, ProtoNFT, NFTMetadata, NFTMedias } from "@ledgerhq/types-live";
import { isCustomLockScreenSupported } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { openModal } from "~/renderer/actions/modals";
import IconOpensea from "~/renderer/icons/Opensea";
import IconRarible from "~/renderer/icons/Rarible";
import { openURL } from "~/renderer/linking";
import { getMetadataMediaTypes } from "~/helpers/nft";
import { setDrawer } from "../../drawers/Provider";
import CustomImage from "~/renderer/screens/customImage";
import NFTViewerDrawer from "~/renderer/drawers/NFTViewerDrawer";
import { ContextMenuItemType } from "../../components/ContextMenu/ContextMenuWrapper";
import { devicesModelListSelector } from "~/renderer/reducers/settings";

function safeList(items: (ContextMenuItemType | "" | undefined)[]): ContextMenuItemType[] {
  return items.filter(Boolean) as ContextMenuItemType[];
}

const linksPerCurrency: Record<
  string,
  (t: TFunction, links: NFTMetadata["links"]) => ContextMenuItemType[]
> = {
  ethereum: (t, links) =>
    safeList([
      links?.opensea && {
        id: "opensea",
        label: t("NFT.viewer.actions.open", {
          viewer: "Opensea.io",
        }),
        Icon: IconOpensea,
        type: "external",
        callback: () => openURL(links.opensea),
      },
      links?.rarible && {
        id: "rarible",
        label: t("NFT.viewer.actions.open", {
          viewer: "Rarible",
        }),
        Icon: IconRarible,
        type: "external",
        callback: () => openURL(links.rarible),
      },
      {
        id: "sep2",
        type: "separator",
        label: "",
      },
      links?.explorer && {
        id: "explorer",
        label: t("NFT.viewer.actions.open", {
          viewer: "Explorer",
        }),
        Icon: IconsLegacy.GlobeMedium,
        type: "external",
        callback: () => openURL(links.explorer),
      },
    ]),
  polygon: (t: TFunction, links: NFTMetadata["links"]) =>
    safeList([
      links?.opensea && {
        id: "opensea",
        label: t("NFT.viewer.actions.open", {
          viewer: "Opensea.io",
        }),
        Icon: IconOpensea,
        type: "external",
        callback: () => openURL(links.opensea),
      },
      links?.rarible && {
        id: "rarible",
        label: t("NFT.viewer.actions.open", {
          viewer: "Rarible",
        }),
        Icon: IconRarible,
        type: "external",
        callback: () => openURL(links.rarible),
      },
      {
        id: "sep2",
        type: "separator",
        label: "",
      },
      links?.explorer && {
        id: "explorer",
        label: t("NFT.viewer.actions.open", {
          viewer: "Explorer",
        }),
        Icon: IconsLegacy.GlobeMedium,
        type: "external",
        callback: () => openURL(links.explorer),
      },
    ]),
};

export default (
  account: Account,
  nft: ProtoNFT,
  metadata: NFTMetadata,
  onClose?: () => void,
  isInsideDrawer?: boolean,
): ContextMenuItemType[] => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const hideCollection = useMemo(
    () => ({
      id: "hide-collection",
      label: t("hideNftCollection.hideCTA"),
      Icon: IconsLegacy.NoneMedium,
      callback: () => {
        return dispatch(
          openModal("MODAL_HIDE_NFT_COLLECTION", {
            collectionName: metadata?.tokenName ?? nft.contract,
            collectionId: `${account.id}|${nft.contract}`,
            onClose,
            blockchain: account.currency.id,
          }),
        );
      },
    }),
    [account.currency.id, account.id, dispatch, metadata?.tokenName, nft.contract, onClose, t],
  );
  const customImageUri = useMemo(() => {
    const mediaTypes = metadata ? getMetadataMediaTypes(metadata) : null;
    const mediaSizeForCustomImage = mediaTypes
      ? ["original", "big", "preview"].find(size => mediaTypes[size] === "image")
      : null;
    const customImageUri =
      (mediaSizeForCustomImage &&
        metadata?.medias?.[mediaSizeForCustomImage as keyof NFTMedias]?.uri) ||
      null;
    return customImageUri;
  }, [metadata]);

  const devicesModelList = useSelector(devicesModelListSelector);
  const customImageDeviceModelIds = devicesModelList.filter(deviceModelId =>
    isCustomLockScreenSupported(deviceModelId),
  );
  // if user previously connected e.g. a Stax and a Europa we don't pre-select a device model
  const customImageDeviceModelId =
    customImageDeviceModelIds.length === 1 ? customImageDeviceModelIds[0] : null;
  const showCustomImageButton = Boolean(customImageUri) && customImageDeviceModelIds.length > 0;

  const customImage = useMemo(() => {
    const img: ContextMenuItemType = {
      id: "custom-image",
      label: t("customImage.cta"),
      Icon: IconsLegacy.PhotographMedium,
      callback: () => {
        if (customImageUri)
          setDrawer(
            CustomImage,
            {
              imageUri: customImageUri,
              deviceModelId: customImageDeviceModelId,
              isFromNFTEntryPoint: true,
              reopenPreviousDrawer: isInsideDrawer
                ? () =>
                    setDrawer(
                      NFTViewerDrawer,
                      {
                        account,
                        nftId: nft.id,
                        isOpen: true,
                      },
                      { forceDisableFocusTrap: true },
                    )
                : undefined,
            },
            { forceDisableFocusTrap: true },
          );
      },
    };
    return img;
  }, [account, customImageDeviceModelId, customImageUri, isInsideDrawer, nft.id, t]);

  const links = useMemo(() => {
    const metadataLinks = linksPerCurrency[account.currency.id]?.(t, metadata?.links) || [];
    return [...metadataLinks, ...(showCustomImageButton ? [customImage] : []), hideCollection];
  }, [account.currency.id, t, metadata?.links, showCustomImageButton, customImage, hideCollection]);
  return links;
};

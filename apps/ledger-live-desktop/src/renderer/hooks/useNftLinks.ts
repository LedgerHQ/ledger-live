import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Account, ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Icons } from "@ledgerhq/react-ui";
import { openModal } from "~/renderer/actions/modals";
import IconOpensea from "~/renderer/icons/Opensea";
import IconRarible from "~/renderer/icons/Rarible";
import IconGlobe from "~/renderer/icons/Globe";
import { openURL } from "~/renderer/linking";
import IconBan from "~/renderer/icons/Ban";
import { getMetadataMediaTypes } from "~/helpers/nft";
import { setDrawer } from "../drawers/Provider";
import CustomImage from "~/renderer/screens/customImage";
import NFTViewerDrawer from "~/renderer/drawers/NFTViewerDrawer";
const linksPerCurrency = {
  ethereum: (t, links) => [
    links?.opensea && {
      key: "opensea",
      id: "opensea",
      label: t("NFT.viewer.actions.open", {
        viewer: "Opensea.io",
      }),
      Icon: IconOpensea,
      type: "external",
      callback: () => openURL(links.opensea),
    },
    links?.rarible && {
      key: "rarible",
      id: "rarible",
      label: t("NFT.viewer.actions.open", {
        viewer: "Rarible",
      }),
      Icon: IconRarible,
      type: "external",
      callback: () => openURL(links.rarible),
    },
    {
      key: "sep2",
      id: "sep2",
      type: "separator",
      label: "",
    },
    links?.explorer && {
      key: "explorer",
      id: "explorer",
      label: t("NFT.viewer.actions.open", {
        viewer: "Explorer",
      }),
      Icon: IconGlobe,
      type: "external",
      callback: () => openURL(links.explorer),
    },
  ],
  polygon: (t, links, dispatch) => [
    links?.opensea && {
      key: "opensea",
      id: "opensea",
      label: t("NFT.viewer.actions.open", {
        viewer: "Opensea.io",
      }),
      Icon: IconOpensea,
      type: "external",
      callback: () => openURL(links.opensea),
    },
    links?.rarible && {
      key: "rarible",
      id: "rarible",
      label: t("NFT.viewer.actions.open", {
        viewer: "Rarible",
      }),
      Icon: IconRarible,
      type: "external",
      callback: () => openURL(links.rarible),
    },
    {
      key: "sep2",
      id: "sep2",
      type: "separator",
      label: "",
    },
    links?.explorer && {
      key: "explorer",
      id: "explorer",
      label: t("NFT.viewer.actions.open", {
        viewer: "Explorer",
      }),
      Icon: IconGlobe,
      type: "external",
      callback: () => openURL(links.explorer),
    },
  ],
};
export default (
  account: Account,
  nft: ProtoNFT,
  metadata: NFTMetadata,
  onClose?: () => void,
  isInsideDrawer?: boolean,
) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const hideCollection = useMemo(
    () => ({
      key: "hide-collection",
      id: "hide-collection",
      label: t("hideNftCollection.hideCTA"),
      Icon: IconBan,
      type: null,
      callback: () => {
        return dispatch(
          openModal("MODAL_HIDE_NFT_COLLECTION", {
            collectionName: metadata?.tokenName ?? nft.contract,
            collectionId: `${account.id}|${nft.contract}`,
            onClose,
          }),
        );
      },
    }),
    [account.id, dispatch, metadata?.tokenName, nft.contract, onClose, t],
  );
  const customImageUri = useMemo(() => {
    const mediaTypes = metadata ? getMetadataMediaTypes(metadata) : null;
    const mediaSizeForCustomImage = mediaTypes
      ? ["original", "big", "preview"].find(size => mediaTypes[size] === "image")
      : null;
    const customImageUri =
      (mediaSizeForCustomImage && metadata?.medias?.[mediaSizeForCustomImage]?.uri) || null;
    return customImageUri;
  }, [metadata]);
  const customImage = useMemo(
    () => ({
      key: "custom-image",
      id: "custom-image",
      label: "Custom image",
      // TODO: get proper wording for this
      Icon: Icons.ToolsMedium,
      type: null,
      callback: () => {
        if (customImageUri)
          setDrawer(CustomImage, {
            imageUri: customImageUri,
            isFromNFTEntryPoint: true,
            reopenPreviousDrawer: isInsideDrawer
              ? () =>
                  setDrawer(NFTViewerDrawer, {
                    account,
                    nftId: nft.id,
                    isOpen: true,
                  })
              : undefined,
          });
      },
    }),
    [account, customImageUri, isInsideDrawer, nft.id],
  );
  const customImageEnabled = useFeature("customImage")?.enabled;
  const links = useMemo(() => {
    const metadataLinks =
      linksPerCurrency?.[account.currency.id]?.(t, metadata?.links).filter(x => x) || [];
    return [
      ...metadataLinks,
      ...(customImageEnabled && customImageUri ? [customImage] : []),
      hideCollection,
    ];
  }, [
    account.currency.id,
    hideCollection,
    metadata?.links,
    customImageUri,
    customImageEnabled,
    customImage,
    t,
  ]);
  return links;
};

import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { Account } from "@ledgerhq/types-live";
import { decodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { track, TrackScreen } from "~/analytics";
import { accountSelector } from "~/reducers/accounts";
import { State } from "~/reducers/types";
import QueuedDrawer from "../QueuedDrawer";
import { updateNftStatus } from "~/actions/settings";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";

type Props = {
  nftId?: string;
  nftContract?: string;
  collection?: string;
  isOpened: boolean;
  onClose: () => void;
};
const HideNftDrawer = ({ nftId, nftContract, collection, isOpened, onClose }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { accountId } = decodeNftId(nftId ?? "");
  const account = useSelector<State, Account | undefined>(state =>
    accountSelector(state, { accountId }),
  );

  const onClickContinue = useCallback(() => {
    track("button_clicked", {
      button: "Hide NFT Collection",
      drawer: "Hide NFT Confirmation",
    });

    const collectionId = `${account?.id}|${nftContract}`;

    dispatch(
      updateNftStatus({
        collection: collectionId,
        status: NftStatus.blacklisted,
        blockchain: account?.currency.id as SupportedBlockchain,
      }),
    );
    onClose();
    navigation.goBack();
  }, [account?.currency.id, account?.id, dispatch, navigation, nftContract, onClose]);

  const onPressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: "Hide NFT Confirmation",
    });
    onClose();
  }, [onClose]);

  const onPressCancel = useCallback(() => {
    track("button_clicked", {
      button: "Cancel",
      drawer: "Hide NFT Confirmation",
    });
    onClose();
  }, [onClose]);
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpened}
      onClose={onPressClose}
      Icon={IconsLegacy.EyeNoneMedium}
      title={t("wallet.nftGallery.hideNftModal.title")}
      description={t("wallet.nftGallery.hideNftModal.desc", {
        collectionName: collection,
      })}
    >
      <TrackScreen category="Hide NFT Confirmation" type="drawer" refreshSource={false} />

      <Button type="main" size="large" alignSelf="stretch" onPress={onClickContinue} mt={4} mb={2}>
        {t("wallet.nftGallery.hideNftModal.cta")}
      </Button>

      <Button type="default" size="large" alignSelf="stretch" onPress={onPressCancel}>
        {t("common.cancel")}
      </Button>
    </QueuedDrawer>
  );
};

export default memo(HideNftDrawer);

import React, { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Text, IconsLegacy, BoxedIcon, Button, Flex } from "@ledgerhq/native-ui";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { hideNftCollection, unwhitelistNftCollection } from "~/actions/settings";
import QueuedDrawer from "../QueuedDrawer";
import { whitelistedNftCollectionsSelector } from "~/reducers/settings";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  collection: ProtoNFT[];
  account: Account;
};

const NftCollectionOptionsMenu = ({ isOpen, onClose, collection, account }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const whitelistedNftCollections = useSelector(whitelistedNftCollectionsSelector);

  const onConfirm = useCallback(() => {
    const collectionId = `${account.id}|${collection?.[0]?.contract}`;
    if (whitelistedNftCollections.includes(collectionId)) {
      dispatch(unwhitelistNftCollection(collectionId));
    }

    dispatch(hideNftCollection(collectionId));
    onClose();
  }, [account.id, collection, whitelistedNftCollections, dispatch, onClose]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      <Flex alignItems="center">
        <BoxedIcon Icon={IconsLegacy.EyeNoneMedium} size={48} />
        <Text variant="h1" mt={20}>
          {t("settings.accounts.hideNFTCollectionModal.title")}
        </Text>
        <Text variant="body" textAlign="center" mt={20}>
          {t("settings.accounts.hideNFTCollectionModal.desc")}
        </Text>
        <Button type="main" alignSelf="stretch" mt={20} onPress={onConfirm}>
          {t("common.confirm")}
        </Button>
        <Button type="default" alignSelf="stretch" mt={20} onPress={onClose}>
          {t("common.cancel")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
};

export default React.memo(NftCollectionOptionsMenu);

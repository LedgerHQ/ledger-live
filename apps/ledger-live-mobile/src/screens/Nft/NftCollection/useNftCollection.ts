import { groupAccountOperationsByDay } from "@ledgerhq/coin-framework/lib/account/groupOperations";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Account } from "@ledgerhq/types-live";
import { useState, useMemo, useCallback } from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName, NavigatorName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";

export type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.NftCollection>
>;

const MAX_NFT_FIRST_RENDER = 12;
const NFTS_TO_ADD_ON_LIST_END_REACHED = 6;

export function useNftCollection({ route, navigation }: NavigationProps) {
  const {
    params: { collection },
  } = route;
  const nft = collection[0];
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  // nfts' list related -----
  const [nftCount, setNftCount] = useState(MAX_NFT_FIRST_RENDER);
  const nfts = useMemo(() => collection?.slice(0, nftCount), [nftCount, collection]);
  const sendToken = () => {
    account &&
      navigation.navigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendNft,
        params: {
          account: account as Account,
          collection,
        },
      });
  };

  const onNftsEndReached = useCallback(() => {
    setNftCount(nftCount + NFTS_TO_ADD_ON_LIST_END_REACHED);
  }, [nftCount]);

  // operations' list related -----
  const [opCount, setOpCount] = useState(100);
  const { sections, completed } = groupAccountOperationsByDay(account!, {
    count: opCount,
    filterOperation: op => !!op?.nftOperations?.find(op => op?.contract === nft?.contract),
  });

  const onOperationsEndReached = useCallback(() => {
    setOpCount(opCount + 50);
  }, [setOpCount, opCount]);
  const [isOpen, setOpen] = useState<boolean>(false);
  const onOpenModal = useCallback(() => {
    setOpen(true);
  }, []);
  const onCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  const isNFTDisabled = useFeature("disableNftSend")?.enabled && Platform.OS === "ios";
  const displaySendBtn = nft.currencyId !== "solana";

  return {
    onOperationsEndReached,
    sendToken,
    onNftsEndReached,
    onOpenModal,
    onCloseModal,
    nft,
    collection,
    nfts,
    nftCount,
    sections,
    completed,
    opCount,
    isOpen,
    isNFTDisabled,
    displaySendBtn,
    account,
    parentAccount,
  };
}

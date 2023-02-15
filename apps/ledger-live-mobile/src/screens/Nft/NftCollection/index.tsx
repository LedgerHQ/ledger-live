import React, { useState, useRef, useCallback, useMemo, memo } from "react";

import {
  View,
  StyleSheet,
  Platform,
  SectionList,
  FlatList,
  SectionListData,
  SectionListRenderItemInfo,
} from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { groupAccountOperationsByDay } from "@ledgerhq/live-common/account/index";
import Animated, { Value, event } from "react-native-reanimated";
import {
  Account,
  DailyOperationsSection,
  Operation,
  ProtoNFT,
} from "@ledgerhq/types-live";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import NoMoreOperationFooter from "../../../components/NoMoreOperationFooter";
import { accountScreenSelector } from "../../../reducers/accounts";
import LoadingFooter from "../../../components/LoadingFooter";
import SectionHeader from "../../../components/SectionHeader";
import OperationRow from "../../../components/OperationRow";
import { NavigatorName, ScreenName } from "../../../const";
import NftCard from "../../../components/Nft/NftCard";
import Button from "../../../components/Button";
import SendIcon from "../../../icons/Send";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "../../../components/RootNavigator/types/AccountsNavigator";
import InfoModal from "../../../modals/Info";
import { notAvailableModalInfo } from "../NftInfoNotAvailable";

const MAX_NFT_FIRST_RENDER = 12;
const NFTS_TO_ADD_ON_LIST_END_REACHED = 6;

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.NftCollection>
>;

const NftList = Animated.createAnimatedComponent(FlatList) as typeof FlatList;
const OperationsList = Animated.createAnimatedComponent(
  SectionList,
) as typeof SectionList;

const renderOperationSectionHeader = ({
  section,
}: {
  section: SectionListData<Operation, DailyOperationsSection>;
}) => <SectionHeader day={section.day} />;

const NftCollection = ({ route }: NavigationProps) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    params: { collection },
  } = route;
  const nft = collection[0];
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const scrollY = useRef(new Value(0)).current;
  const onScroll = () =>
    event(
      [
        {
          nativeEvent: {
            contentOffset: { y: scrollY },
          },
        },
      ],
      { useNativeDriver: true },
    );

  // nfts' list related -----
  const [nftCount, setNftCount] = useState(MAX_NFT_FIRST_RENDER);
  const nfts = useMemo(
    () => collection?.slice(0, nftCount),
    [nftCount, collection],
  );
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

  const renderNftItem = useCallback(
    ({ item, index }) => (
      <NftCard
        key={item.id}
        nft={item}
        style={{
          maxWidth: "50%",
          paddingLeft: index % 2 !== 0 ? 8 : 0,
          paddingRight: index % 2 === 0 ? 8 : 0,
        }}
      />
    ),
    [],
  );

  const renderNftListFooter = useCallback(
    () => (collection?.length > nftCount ? <LoadingFooter /> : null),
    [collection?.length, nftCount],
  );

  const onNftsEndReached = useCallback(() => {
    setNftCount(nftCount + NFTS_TO_ADD_ON_LIST_END_REACHED);
  }, [nftCount]);

  // operations' list related -----
  const [opCount, setOpCount] = useState(100);
  const { sections, completed } = groupAccountOperationsByDay(account!, {
    count: opCount,
    filterOperation: op =>
      !!op?.nftOperations?.find(op => op?.contract === nft?.contract),
  });

  const renderOperationItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<Operation>) => {
      if (!account) return null;

      return (
        <OperationRow
          operation={item}
          account={account}
          parentAccount={parentAccount}
          isLast={section.data.length - 1 === index}
        />
      );
    },
    [account, parentAccount],
  );

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
  const isNFTDisabled =
    useFeature("disableNftSend")?.enabled && Platform.OS === "ios";

  const data = [
    <View style={styles.buttonContainer}>
      <Button
        type="primary"
        IconLeft={SendIcon}
        containerStyle={styles.button}
        title={t("account.send")}
        onPress={isNFTDisabled ? onOpenModal : sendToken}
      />
    </View>,
    <View style={styles.nftList}>
      <NftList
        data={nfts}
        numColumns={2}
        keyExtractor={(n: ProtoNFT) => n.id}
        renderItem={renderNftItem}
        onEndReached={onNftsEndReached}
        onScroll={onScroll}
        ListFooterComponent={renderNftListFooter}
      />
    </View>,
    <View style={styles.contentContainer}>
      <OperationsList
        sections={sections}
        style={[styles.sectionList, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(op: Operation) => op.id}
        renderItem={renderOperationItem}
        renderSectionHeader={renderOperationSectionHeader}
        onEndReached={onOperationsEndReached}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          !completed ? <LoadingFooter /> : <NoMoreOperationFooter />
        }
      />
    </View>,
  ];

  return (
    <>
      <InfoModal
        isOpened={isOpen}
        onClose={onCloseModal}
        data={notAvailableModalInfo}
      />
      <TabBarSafeAreaView
        style={{
          backgroundColor: colors.background,
        }}
      >
        <FlatList
          data={data}
          renderItem={({ item }) => item}
          keyExtractor={(item, index) => String(index)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        />
      </TabBarSafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    zIndex: 2,
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: {
          height: 5,
          width: 5,
        },
      },
    }),
  },
  button: {
    borderRadius: 100,
  },
  nftList: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  sectionList: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 64,
    marginHorizontal: 8,
    flexGrow: 1,
  },
});

export default memo(withDiscreetMode(NftCollection));

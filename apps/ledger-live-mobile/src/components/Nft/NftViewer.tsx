import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
  useContext,
} from "react";

import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Animated,
} from "react-native";
import {
  useNftMetadata,
  decodeNftId,
  getNftCapabilities,
  useNftCollectionMetadata,
  getFloorPrice,
} from "@ledgerhq/live-common/nft/index";
import { BigNumber } from "bignumber.js";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, IconsLegacy, Text, Flex } from "@ledgerhq/native-ui";
import { useTranslation, Trans } from "react-i18next";
import Clipboard from "@react-native-clipboard/clipboard";
import { FloorPrice, Account } from "@ledgerhq/types-live";
import { FeatureToggle, useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import styled from "styled-components/native";
import { accountSelector } from "~/reducers/accounts";
import { ScreenName, NavigatorName } from "~/const";
import NftLinksPanel from "./NftLinksPanel";
import Skeleton from "../Skeleton";
import NftMedia from "./NftMedia";
import { getMetadataMediaType } from "~/logic/nft";
import NftPropertiesList from "./NftPropertiesList";
import CurrencyIcon from "../CurrencyIcon";
import { State } from "~/reducers/types";
import type { NftNavigatorParamList } from "../RootNavigator/types/NftNavigator";
import type { StackNavigatorNavigation, StackNavigatorProps } from "../RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { AccountsNavigatorParamList } from "../RootNavigator/types/AccountsNavigator";
import InfoModal from "~/modals/Info";
import { notAvailableModalInfo } from "~/screens/Nft/NftInfoNotAvailable";
import { track, TrackScreen } from "~/analytics";
import { DesignedForStaxDrawer, DesignedForStaxText } from "./DesignedForStax";
import {
  discreetModeSelector,
  hasSeenStaxEnabledNftsPopupSelector,
  knownDeviceModelIdsSelector,
} from "~/reducers/settings";
import { setHasSeenStaxEnabledNftsPopup } from "~/actions/settings";
import { useHeaderHeight } from "@react-navigation/elements";
import NftViewerBackground from "./NftViewerBackground";
import NftViewerScreenHeader from "./NftViewerScreenHeader";
import invariant from "invariant";
import DiscreetModeContext, { withDiscreetMode } from "~/context/DiscreetModeContext";
import { EvmNftTransaction, Transaction } from "@ledgerhq/coin-evm/types/index";

type Props = CompositeScreenProps<
  | StackNavigatorProps<NftNavigatorParamList, ScreenName.NftViewer>
  | StackNavigatorProps<AccountsNavigatorParamList, ScreenName.NftViewer>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type TimeoutReturn = ReturnType<typeof setTimeout>;

const SectionTitle = styled(Text).attrs(props => ({
  variant: "small",
  color: "neutral.c60",
  uppercase: true,
  fontWeight: "semiBold",
  mb: 4,
  ...props,
}))``;

const SectionContainer = styled(Box).attrs(props => ({
  mb: 8,
  px: 6,
  ...props,
}))``;

const Section = ({
  title,
  value,
  children,
  copyAvailable,
  copiedString,
}: {
  title: string;
  value?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  copyAvailable?: boolean;
  copiedString?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [timeoutFunction, setTimeoutFunction] = useState<TimeoutReturn | null>(null);
  const copy = useCallback(() => {
    if (typeof value === "undefined") return null;

    track("button_clicked", {
      button: title,
    });

    Clipboard.setString(value);
    setCopied(true);
    setTimeoutFunction(
      setTimeout(() => {
        setCopied(false);
      }, 3000),
    );
    return clearTimeout(timeoutFunction as TimeoutReturn);
  }, [value, title, timeoutFunction]);

  return (
    <SectionContainer>
      <Flex flexDirection="row" alignItems="center" mb={4}>
        <SectionTitle mb={0}>{title}</SectionTitle>
        {copyAvailable ? (
          <View>
            <TouchableOpacity onPress={copy} style={{ marginLeft: 10 }}>
              <IconsLegacy.CopyMedium size={16} color={copied ? "neutral.c80" : "primary.c80"} />
            </TouchableOpacity>
            {copied ? (
              <Text variant={"body"} color="neutral.c80" marginLeft={3}>
                {copiedString}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Flex>
      {value ? <Text variant={"body"}>{value}</Text> : children}
    </SectionContainer>
  );
};

const NftViewer = ({ route }: Props) => {
  const { params } = route;
  const { nft } = params;
  const dispatch = useDispatch();
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  );
  const currency = useMemo(() => getCryptoCurrencyById(nft.currencyId), [nft.currencyId]);
  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    nft?.contract,
    nft?.currencyId,
  );
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        StackNavigatorNavigation<NftNavigatorParamList, ScreenName.NftViewer>,
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();

  const { accountId } = decodeNftId(nft?.id);
  const account = useSelector<State, Account | undefined>(state =>
    accountSelector(state, { accountId }),
  )!;
  invariant(account, "account required");

  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasSeenStaxEnabledNftsPopup = useSelector(hasSeenStaxEnabledNftsPopupSelector);

  const [bottomModalOpen, setBottomModalOpen] = useState(false);
  const isLoading = nftStatus === "loading" || collectionStatus === "loading";

  const nftCapabilities = useMemo(() => getNftCapabilities(nft), [nft]);

  const [floorPriceLoading, setFloorPriceLoading] = useState(false);
  const [ticker, setTicker] = useState("");
  const [floorPrice, setFloorPrice] = useState<number | null>(null);

  useEffect(() => {
    setFloorPriceLoading(true);
    getFloorPrice(nft, currency)
      .then((result: FloorPrice | null) => {
        if (result) {
          setTicker(result.ticker);
          setFloorPrice(result.value);
        }
      })
      .finally(() => setFloorPriceLoading(false));
  }, [nft, currency]);

  const closeModal = () => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: "NFT settings",
    });
    setBottomModalOpen(false);
  };

  const goToRecipientSelection = useCallback(() => {
    const bridge = getAccountBridge<Transaction>(account);

    const defaultTransaction = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(defaultTransaction, {
      mode: nft.standard.toLowerCase() as EvmNftTransaction["mode"],
      nft: {
        tokenId: nft.tokenId,
        // Quantity is set to Infinity first to allow the user to change it on the amount page
        quantity: new BigNumber(nftCapabilities.hasQuantity ? Infinity : 1),
        contract: nft.contract,
        collectionName: collectionMetadata?.tokenName ?? "",
      },
    });

    track("button_clicked", {
      button: "Send NFT",
    });

    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: account.id,
        transaction,
      },
    });
  }, [account, nft, nftCapabilities.hasQuantity, navigation, collectionMetadata]);

  const properties = useMemo(() => {
    if (isLoading && !nftMetadata?.properties?.length) {
      return (
        <Box flexDirection={"row"} px={6}>
          <Skeleton height={"54px"} width={"120px"} borderRadius={1} mr={6} loading={true} />
          <Skeleton height={"54px"} width={"120px"} borderRadius={1} mr={6} loading={true} />
          <Skeleton height={"54px"} width={"120px"} borderRadius={1} loading={true} />
        </Box>
      );
    }

    if (nftMetadata?.properties?.length) {
      return <NftPropertiesList data={nftMetadata?.properties} />;
    }

    return null;
  }, [isLoading, nftMetadata]);

  const description = useMemo(() => {
    if (isLoading && !nftMetadata?.description) {
      return (
        <>
          <Skeleton loading={true} height={"12px"} width={"100%"} mb={3} />
          <Skeleton loading={true} height={"12px"} width={"100%"} mb={3} />
          <Skeleton loading={true} height={"12px"} width={"100%"} mb={3} />
        </>
      );
    }

    if (nftMetadata?.description) {
      return <Text variant={"bodyLineHeight"}>{nftMetadata.description}</Text>;
    }

    return null;
  }, [isLoading, nftMetadata]);

  const mediaType = useMemo(
    () => nftMetadata && getMetadataMediaType(nftMetadata, "big"),
    [nftMetadata],
  );

  const NftComponent = useCallback(
    () => (
      <>
        <NftMedia
          transparency={true}
          resizeMode="contain"
          style={styles.image}
          metadata={nftMetadata}
          mediaFormat={"big"}
          status={nftStatus}
        >
          {knownDeviceModelIds.stax && !!nftMetadata?.staxImage ? (
            <Flex zIndex={1000} position="absolute" bottom={0} width="100%">
              <DesignedForStaxText size="medium" />
            </Flex>
          ) : null}
        </NftMedia>
      </>
    ),
    [knownDeviceModelIds, nftMetadata, nftStatus],
  );

  const [isStaxDrawerOpen, setStaxDrawerOpen] = useState<boolean>(false);
  const discreet = useSelector(discreetModeSelector);
  const shouldApplyDiscreetMode = useContext(DiscreetModeContext);

  const handleStaxModalClose = useCallback(() => {
    setStaxDrawerOpen(false);
    dispatch(setHasSeenStaxEnabledNftsPopup(true));
  }, [dispatch]);

  useEffect(() => {
    if (!hasSeenStaxEnabledNftsPopup && knownDeviceModelIds.stax && nftMetadata?.staxImage) {
      setStaxDrawerOpen(true);
    }
  }, [hasSeenStaxEnabledNftsPopup, knownDeviceModelIds, nftMetadata]);

  const [isOpen, setOpen] = useState<boolean>(false);
  const onOpenModal = useCallback(() => {
    setOpen(true);
  }, []);
  const onCloseModal = useCallback(() => {
    track("button_clicked", {
      button: "Back",
    });
    setOpen(false);
  }, []);
  const isNFTDisabled = useFeature("disableNftSend")?.enabled && Platform.OS === "ios";

  const headerHeight = useHeaderHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  return (
    <>
      <TrackScreen category="NFT" />
      <InfoModal
        isOpened={isOpen}
        onClose={onCloseModal}
        data={notAvailableModalInfo(onCloseModal)}
      />
      <DesignedForStaxDrawer isOpen={isStaxDrawerOpen} onClose={handleStaxModalClose} />
      {nftMetadata ? (
        <NftViewerBackground scrollY={scrollY} src={nftMetadata.medias.preview.uri} />
      ) : null}
      <Animated.ScrollView
        onScroll={
          isFocused
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
              })
            : undefined
        }
        contentContainerStyle={[
          styles.scrollView,
          {
            paddingTop: headerHeight + 8,
          },
        ]}
        testID={"nft-viewer-page-scrollview"}
      >
        <Box mx={6}>
          <Flex flexDirection={"row"} alignItems={"center"}>
            <View style={styles.currencyIcon}>
              <CurrencyIcon circle color="#fff" currency={currency} size={16} />
            </View>
            <Skeleton
              height={"19px"}
              flex={1}
              my={"2px"}
              ml={2}
              borderRadius={1}
              loading={isLoading && !collectionMetadata?.tokenName}
            >
              <Text
                variant={"large"}
                color="opacityDefault.c60"
                fontWeight={"semiBold"}
                numberOfLines={3}
                flexShrink={1}
                ml={2}
              >
                {collectionMetadata?.tokenName || "-"}
              </Text>
            </Skeleton>
          </Flex>
          <Box mb={6}>
            <Skeleton
              height={"36px"}
              width={"100%"}
              my={"3px"}
              borderRadius={1}
              loading={isLoading && !nftMetadata?.nftName}
            >
              <Text
                variant={"h1Inter"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                numberOfLines={3}
              >
                {nftMetadata?.nftName || "-"}
              </Text>
            </Skeleton>
          </Box>

          <Box style={styles.imageContainer} borderRadius={2} mb={8}>
            {nftMetadata?.medias && mediaType !== "video" ? (
              <TouchableOpacity
                onPress={() => {
                  track("NFT_clicked");
                  navigation.navigate(NavigatorName.NftNavigator, {
                    screen: ScreenName.NftImageViewer,
                    params: {
                      metadata: nftMetadata,
                      mediaFormat: "original",
                      status: nftStatus,
                    },
                  });
                }}
              >
                <NftComponent />
              </TouchableOpacity>
            ) : (
              <NftComponent />
            )}
          </Box>

          <Box mb={8} flexWrap={"nowrap"} flexDirection={"row"} justifyContent={"center"}>
            <Box flexGrow={1} flexShrink={1} mr={6} style={styles.sendButtonContainer}>
              <Button
                type="main"
                Icon={IconsLegacy.ArrowFromBottomMedium}
                iconPosition="left"
                onPress={isNFTDisabled ? onOpenModal : goToRecipientSelection}
              >
                <Trans i18nKey="account.send" />
              </Button>
            </Box>
            {nftMetadata?.links && (
              <Box style={styles.ellipsisButtonContainer} flexShrink={0} width={"48px"}>
                <Button
                  type="main"
                  Icon={IconsLegacy.OthersMedium}
                  onPress={() => {
                    track("button_clicked", {
                      button: "NFT Settings",
                    });
                    setBottomModalOpen(true);
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>

        <FeatureToggle featureId="counterValue">
          {!floorPriceLoading && floorPrice ? (
            <Section
              title={t("nft.viewer.attributes.floorPrice")}
              value={`${shouldApplyDiscreetMode && discreet ? "***" : floorPrice} ${ticker}`}
            />
          ) : null}
        </FeatureToggle>

        {/* This weird thing is because we want a full width scrollView withtout the paddings */}
        {properties && (
          <SectionContainer px={0}>
            <SectionTitle mx={6}>{t("nft.viewer.properties")}</SectionTitle>
            {properties}
          </SectionContainer>
        )}

        {description && <Section title={t("nft.viewer.description")}>{description}</Section>}

        <Section
          title={t("nft.viewer.tokenContract")}
          value={nft?.contract}
          copyAvailable
          copiedString={t("nft.viewer.tokenContractCopied")}
        />

        <Section
          title={t("nft.viewer.tokenId")}
          value={nft?.tokenId}
          copyAvailable
          copiedString={t("nft.viewer.tokenIdCopied")}
        />

        {nft?.standard === "ERC1155" && (
          <>
            <TouchableOpacity onPress={closeModal}>
              <Section title={t("nft.viewer.quantity")} value={nft?.amount?.toFixed()} />
            </TouchableOpacity>
          </>
        )}
      </Animated.ScrollView>
      <NftLinksPanel
        nftMetadata={nftMetadata || undefined}
        links={nftMetadata?.links}
        isOpen={bottomModalOpen}
        onClose={closeModal}
        nftContract={nft.contract}
        nftId={nft.id}
      />
      <NftViewerScreenHeader title={nftMetadata?.nftName || undefined} scrollY={scrollY} />
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    paddingBottom: 64,
  },
  currencyIcon: {
    marginRight: 5,
  },
  imageContainer: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: {
          height: 6,
          width: 0,
        },
      },
    }),
  },
  image: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
    aspectRatio: 1,
  },
  sendButtonContainer: {
    zIndex: 2,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: {
          height: 6,
          width: 0,
        },
      },
    }),
  },
  sendButton: {
    borderRadius: 100,
  },
  ellipsisButtonContainer: {
    zIndex: 2,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: {
          height: 6,
          width: 0,
        },
      },
    }),
  },
});

export default withDiscreetMode(NftViewer);

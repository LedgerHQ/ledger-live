import React, { useMemo, useState, useCallback, useEffect } from "react";

import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  useNftMetadata,
  decodeNftId,
  getNftCapabilities,
  useNftCollectionMetadata,
  getFloorPrice,
} from "@ledgerhq/live-common/nft/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { Button, Icons } from "@ledgerhq/native-ui";
import { useTranslation, Trans } from "react-i18next";
import Clipboard from "@react-native-community/clipboard";
import {
  FloorPrice,
  Account,
  NFTMetadataResponse,
  NFTCollectionMetadataResponse,
} from "@ledgerhq/types-live";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  CompositeNavigationProp,
  CompositeScreenProps,
  useNavigation,
  useTheme,
} from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { accountSelector } from "../../reducers/accounts";
import { ScreenName, NavigatorName } from "../../const";
import NftLinksPanel from "./NftLinksPanel";
import { rgba } from "../../colors";
import Skeleton from "../Skeleton";
import NftMedia from "./NftMedia";
import LText from "../LText";
import { getMetadataMediaType } from "../../logic/nft";
import { State } from "../../reducers/types";
import type { NftNavigatorParamList } from "../RootNavigator/types/NftNavigator";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { AccountsNavigatorParamList } from "../RootNavigator/types/AccountsNavigator";
import InfoModal from "../../modals/Info";
import { notAvailableModalInfo } from "../../screens/Nft/NftInfoNotAvailable";

type Props = CompositeScreenProps<
  | StackNavigatorProps<NftNavigatorParamList, ScreenName.NftViewer>
  | StackNavigatorProps<AccountsNavigatorParamList, ScreenName.NftViewer>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type TimeoutReturn = ReturnType<typeof setTimeout>;

const Section = ({
  title,
  value,
  style,
  children,
  copyAvailable,
  copiedString,
}: {
  title: string;
  value?: string;
  style?: React.ComponentProps<typeof TouchableOpacity>["style"];
  children?: React.ReactNode;
  copyAvailable?: boolean;
  copiedString?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [timeoutFunction, setTimeoutFunction] = useState<TimeoutReturn | null>(
    null,
  );
  const copy = useCallback(() => {
    if (typeof value === "undefined") return null;
    Clipboard.setString(value);
    setCopied(true);
    setTimeoutFunction(
      setTimeout(() => {
        setCopied(false);
      }, 3000),
    );
    return clearTimeout(timeoutFunction as TimeoutReturn);
  }, [value, timeoutFunction]);

  return (
    <View style={style}>
      <View
        style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}
      >
        <LText style={styles.sectionTitle} semiBold>
          {title}
        </LText>
        {copyAvailable ? (
          <View>
            <TouchableOpacity onPress={copy} style={{ marginLeft: 10 }}>
              <Icons.CopyMedium
                size={16}
                color={copied ? "neutral.c80" : "primary.c80"}
              />
            </TouchableOpacity>
            {copied ? (
              <LText color="neutral.c80" marginLeft={3}>
                {copiedString}
              </LText>
            ) : null}
          </View>
        ) : null}
      </View>
      {value ? <LText>{value}</LText> : children}
    </View>
  );
};

const NftViewer = ({ route }: Props) => {
  const { params } = route;
  const { nft } = params;
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    nft?.contract,
    nft?.tokenId,
    nft?.currencyId,
  ) as {
    status: NFTResource["status"];
    metadata?: NFTMetadataResponse["result"] &
      NFTCollectionMetadataResponse["result"];
  };
  const currency = useMemo(
    () => getCryptoCurrencyById(nft.currencyId),
    [nft.currencyId],
  );
  const { status: collectionStatus, metadata: collectionMetadata } =
    useNftCollectionMetadata(nft?.contract, nft?.currencyId) as {
      status: NFTResource["status"];
      metadata?: NFTMetadataResponse["result"] &
        NFTCollectionMetadataResponse["result"];
    };
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        StackNavigatorNavigation<NftNavigatorParamList, ScreenName.NftViewer>,
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();

  const { accountId } = decodeNftId(nft?.id);
  // FIXME: account could be undefined :/
  const account = useSelector<State, Account | undefined>(state =>
    accountSelector(state, { accountId }),
  )!;

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
    setBottomModalOpen(false);
  };

  const goToRecipientSelection = useCallback(() => {
    const bridge = getAccountBridge(account);

    let transaction = bridge.createTransaction(account);
    transaction = bridge.updateTransaction(transaction, {
      tokenIds: [nft?.tokenId],
      // Quantity is set to null first to allow the user to change it on the amount page
      quantities: [nftCapabilities.hasQuantity ? null : new BigNumber(1)],
      collection: nft?.contract,
      mode: `${nft?.standard?.toLowerCase()}.transfer`,
    });

    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: account.id,
        // FIXME: does the parentAccount field actually exist?
        parentId: (account as { parentAccount?: { id: string } })?.parentAccount
          ?.id,
        transaction,
      },
    });
  }, [account, nft, nftCapabilities.hasQuantity, navigation]);

  const properties = useMemo(() => {
    if (isLoading) {
      return (
        <View style={[styles.main, { flexDirection: "row" }]}>
          <Skeleton
            style={[styles.property, styles.propertySekeletonOne]}
            loading={true}
          />
          <Skeleton
            style={[styles.property, styles.propertySekeletonTwo]}
            loading={true}
          />
          <Skeleton
            style={[styles.property, styles.propertySekeletonThree]}
            loading={true}
          />
        </View>
      );
    }

    if (nftMetadata?.properties?.length) {
      return (
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          contentContainerStyle={styles.properties}
        >
          {nftMetadata?.properties?.map?.((prop, i) => (
            <View
              style={[
                styles.property,
                {
                  backgroundColor: rgba(colors.live, 0.1),
                },
              ]}
              key={i}
            >
              <LText semiBold style={{ color: rgba(colors.live, 0.5) }}>
                {prop.key}
              </LText>
              <LText style={{ color: colors.live }}>{prop.value}</LText>
            </View>
          ))}
        </ScrollView>
      );
    }

    return null;
  }, [colors, isLoading, nftMetadata]);

  const description = useMemo(() => {
    if (isLoading) {
      return (
        <>
          <Skeleton style={styles.partDescriptionSkeleton} loading={true} />
          <Skeleton style={styles.partDescriptionSkeleton} loading={true} />
          <Skeleton style={styles.partDescriptionSkeleton} loading={true} />
        </>
      );
    }

    if (nftMetadata?.description) {
      return <LText>{nftMetadata.description}</LText>;
    }

    return null;
  }, [isLoading, nftMetadata]);

  const mediaType = useMemo(
    () => nftMetadata && getMetadataMediaType(nftMetadata, "big"),
    [nftMetadata],
  );

  const NftComponent = useCallback(
    () => (
      <NftMedia
        resizeMode="contain"
        style={styles.image}
        metadata={nftMetadata}
        mediaFormat={"big"}
        status={nftStatus}
      />
    ),
    [nftMetadata, nftStatus],
  );

  const [isOpen, setOpen] = useState<boolean>(false);
  const onOpenModal = useCallback(() => {
    setOpen(true);
  }, []);
  const onCloseModal = useCallback(() => {
    setOpen(false);
  }, []);
  const isNFTDisabled =
    useFeature("disableNftSend")?.enabled && Platform.OS === "ios";

  return (
    <>
      <InfoModal
        isOpened={isOpen}
        onClose={onCloseModal}
        data={notAvailableModalInfo}
      />
      <View>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.main}>
            <Skeleton
              style={[styles.tokenName, styles.tokenNameSkeleton]}
              loading={isLoading}
            >
              <LText style={styles.tokenName}>
                {collectionMetadata?.tokenName || "-"}
              </LText>
            </Skeleton>

            <Skeleton
              style={[styles.nftName, styles.nftNameSkeleton]}
              loading={isLoading}
            >
              <LText style={styles.nftName} numberOfLines={3} semiBold>
                {nftMetadata?.nftName || "-"}
              </LText>
            </Skeleton>

            <View style={styles.imageContainer}>
              {nftMetadata?.medias && mediaType !== "video" ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(NavigatorName.NftNavigator, {
                      screen: ScreenName.NftImageViewer,
                      params: {
                        metadata: nftMetadata,
                        mediaFormat: "original",
                        status: nftStatus,
                      },
                    })
                  }
                >
                  <NftComponent />
                </TouchableOpacity>
              ) : (
                <NftComponent />
              )}
            </View>

            <View style={styles.buttons}>
              <View style={styles.sendButtonContainer}>
                <Button
                  type="main"
                  Icon={Icons.ArrowFromBottomMedium}
                  iconPosition="left"
                  onPress={isNFTDisabled ? onOpenModal : goToRecipientSelection}
                >
                  <Trans i18nKey="account.send" />
                </Button>
              </View>
              {nftMetadata?.links && (
                <View style={styles.ellipsisButtonContainer}>
                  <Button
                    type="main"
                    Icon={Icons.OthersMedium}
                    onPress={() => setBottomModalOpen(true)}
                  />
                </View>
              )}
            </View>
          </View>

          {/* This weird thing is because we want a full width scrollView withtout the paddings */}
          {properties && (
            <>
              <View style={styles.propertiesContainer}>
                <LText style={styles.sectionTitle} semiBold>
                  {t("nft.viewer.properties")}
                </LText>
              </View>
              {properties}
              <View style={styles.hr} />
            </>
          )}

          <View style={styles.main}>
            {description && (
              <>
                <Section title={t("nft.viewer.description")}>
                  {description}
                </Section>
                <View style={styles.hr} />
              </>
            )}

            <Section
              title={t("nft.viewer.tokenContract")}
              value={nft?.contract}
              copyAvailable
              copiedString={t("nft.viewer.tokenContractCopied")}
            />

            <View style={styles.hr} />

            <Section
              title={t("nft.viewer.tokenId")}
              value={nft?.tokenId}
              copyAvailable
              copiedString={t("nft.viewer.tokenIdCopied")}
            />

            {nft?.standard === "ERC1155" && (
              <>
                <View style={styles.hr} />
                <TouchableOpacity onPress={closeModal}>
                  <Section
                    title={t("nft.viewer.quantity")}
                    value={nft?.amount?.toFixed()}
                  />
                </TouchableOpacity>
              </>
            )}
            <FeatureToggle feature="counterValue">
              {!floorPriceLoading && floorPrice ? (
                <>
                  <View style={styles.hr} />
                  <Section
                    title={t("nft.viewer.attributes.floorPrice")}
                    value={`${floorPrice} ${ticker}`}
                  />
                </>
              ) : null}
            </FeatureToggle>
          </View>
        </ScrollView>
        <NftLinksPanel
          nftMetadata={nftMetadata || undefined}
          links={nftMetadata?.links}
          isOpen={bottomModalOpen}
          onClose={closeModal}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 8,
    paddingBottom: 64,
  },
  main: {
    paddingHorizontal: 16,
  },
  tokenNameSkeleton: {
    height: 8,
    width: 113,
    borderRadius: 4,
  },
  tokenName: {
    fontSize: 15,
    marginBottom: 4,
  },
  nftNameSkeleton: {
    height: 12,
    width: 250,
    borderRadius: 4,
  },
  nftName: {
    fontSize: 24,
    marginBottom: 24,
  },
  imageContainer: {
    borderRadius: 8,
    marginBottom: 32,
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
  image: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
    aspectRatio: 1,
  },
  buttons: {
    paddingBottom: 32,
    flexWrap: "nowrap",
    flexDirection: "row",
    justifyContent: "center",
  },
  sendButtonContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginRight: 16,
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
    flexShrink: 0,
    width: 48,
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
  ellipsisButton: {
    position: "relative",
    borderRadius: 48,
    paddingHorizontal: 0,
  },
  propertiesContainer: {
    paddingLeft: 16,
  },
  properties: {
    flexDirection: "row",
    marginTop: 6,
    paddingHorizontal: 16,
  },
  property: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 16,
    borderRadius: 4,
  },
  propertySekeletonOne: {
    height: 52,
    width: 60,
    borderRadius: 4,
  },
  propertySekeletonTwo: {
    height: 52,
    width: 80,
    borderRadius: 4,
  },
  propertySekeletonThree: {
    height: 52,
    width: 60,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    color: "grey",
  },
  partDescriptionSkeleton: {
    marginBottom: 10,
    height: 12,
    width: "100%",
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: "#DFDFDF",
    marginVertical: 24,
  },
});

export default NftViewer;

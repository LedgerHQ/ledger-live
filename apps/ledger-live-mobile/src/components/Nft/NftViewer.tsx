import React, { useMemo, useState, useCallback } from "react";

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
} from "@ledgerhq/live-common/lib/nft";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { Button, Icons } from "@ledgerhq/native-ui";
import { useTranslation, Trans } from "react-i18next";
import Clipboard from "@react-native-community/clipboard";
import { ProtoNFT } from "@ledgerhq/live-common/lib/types";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { accountSelector } from "../../reducers/accounts";
import { ScreenName, NavigatorName } from "../../const";
import NftLinksPanel from "./NftLinksPanel";
import { rgba } from "../../colors";
import Skeleton from "../Skeleton";
import NftMedia from "./NftMedia";
import LText from "../LText";
import { getMetadataMediaType } from "../../logic/nft";

type Props = {
  route: {
    params: RouteParams;
  };
};

type RouteParams = {
  nft: ProtoNFT;
};

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
  value?: any;
  style?: Object;
  children?: React$Node;
  copyAvailable?: boolean;
  copiedString?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [timeoutFunction, setTimeoutFunction] = useState<TimeoutReturn | null>(
    null,
  );
  const copy = useCallback(() => {
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
        flexDirection="row"
        alignItems="center"
        style={{ marginBottom: 10 }}
      >
        <LText style={styles.sectionTitle} semiBold>
          {title}
        </LText>
        {copyAvailable ? (
          <View flexDirection="row" alignItems="center">
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
  );
  const {
    status: collectionStatus,
    metadata: collectionMetadata,
  } = useNftCollectionMetadata(nft?.contract, nft?.currencyId);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { accountId } = decodeNftId(nft?.id);
  const account = useSelector(state => accountSelector(state, { accountId }));

  const [bottomModalOpen, setBottomModalOpen] = useState(false);
  const isLoading = nftStatus === "loading" || collectionStatus === "loading";

  const nftCapabilities = useMemo(() => getNftCapabilities(nft), [nft]);

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
        parentId: account?.parentAccount?.id,
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

  const mediaType = useMemo(() => getMetadataMediaType(nftMetadata, "big"), [
    nftMetadata,
  ]);

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

  return (
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
            {nftMetadata?.media && mediaType !== "video" ? (
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
                onPress={goToRecipientSelection}
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
        </View>
      </ScrollView>
      <NftLinksPanel
        links={nftMetadata?.links}
        isOpen={bottomModalOpen}
        onClose={closeModal}
      />
    </View>
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

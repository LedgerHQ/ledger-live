// @flow

import React, { useMemo, useState, useCallback } from "react";

import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useNftMetadata, decodeNftId } from "@ledgerhq/live-common/lib/nft";

import type { NFT, CollectionWithNFT } from "@ledgerhq/live-common/lib/nft";

import { accountSelector } from "../../reducers/accounts";
import NftLinksPanel from "./NftLinksPanel";
import { ScreenName, NavigatorName } from "../../const";
import SendIcon from "../../icons/Send";
import { rgba } from "../../colors";
import Skeleton from "../Skeleton";
import NftImage from "./NftImage";
import Button from "../Button";
import LText from "../LText";

type Props = {
  route: {
    params: RouteParams,
  },
};

type RouteParams = {
  nft: NFT,
  collection: CollectionWithNFT,
};

const Section = ({
  title,
  value,
  style,
  children,
}: {
  title: string,
  value?: any,
  style?: Object,
  children?: React$Node,
}) => (
  <View style={style}>
    <LText style={styles.sectionTitle} semiBold>
      {title}
    </LText>
    {value ? <LText>{value}</LText> : children}
  </View>
);

const NftViewer = ({ route }: Props) => {
  const { params } = route;
  const { nft, collection } = params;
  const { status, metadata } = useNftMetadata(collection.contract, nft.tokenId);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { accountId } = decodeNftId(nft.id);
  const account = useSelector(state => accountSelector(state, { accountId }));

  const [bottomModalOpen, setBottomModalOpen] = useState(false);
  const isLoading = status === "loading";

  const defaultLinks = {
    opensea: `https://opensea.io/assets/${collection.contract}/${nft.tokenId}`,
    rarible: `https://rarible.com/token/${collection.contract}:${nft.tokenId}`,
    etherscan: `https://etherscan.io/token/${collection.contract}?a=${nft.tokenId}`,
  };

  const closeModal = () => {
    setBottomModalOpen(false);
  };

  const goToRecipientSelection = useCallback(() => {
    const bridge = getAccountBridge(account);

    let transaction = bridge.createTransaction(account);
    transaction = bridge.updateTransaction(transaction, {
      tokenIds: [nft.tokenId],
      quantities: [BigNumber(1)],
      collection: collection.contract,
      mode: `${collection.standard?.toLowerCase()}.transfer`,
    });

    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: account.id,
        parentId: account?.parentAccount?.id,
        transaction,
      },
    });
  }, [account, nft, collection, navigation]);

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

    if (metadata?.properties?.length) {
      return (
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          contentContainerStyle={styles.properties}
        >
          {metadata?.properties?.map?.((prop, i) => (
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
  }, [colors, isLoading, metadata]);

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

    if (metadata?.description) {
      return <LText>{metadata.description}</LText>;
    }

    return null;
  }, [isLoading, metadata]);

  return (
    <View>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.main}>
          <Skeleton
            style={[styles.tokenName, styles.tokenNameSkeleton]}
            loading={isLoading}
          >
            <LText style={styles.tokenName}>{metadata?.tokenName || "-"}</LText>
          </Skeleton>

          <Skeleton
            style={[styles.nftName, styles.nftNameSkeleton]}
            loading={isLoading}
          >
            <LText style={styles.nftName} numberOfLines={3} semiBold>
              {metadata?.nftName || "-"}
            </LText>
          </Skeleton>

          <View style={styles.imageContainer}>
            <NftImage
              style={styles.image}
              src={metadata?.media}
              status={status}
              hackWidth={300}
            />
          </View>

          <View style={styles.buttons}>
            <View style={styles.sendButtonContainer}>
              <Button
                type="primary"
                IconLeft={SendIcon}
                containerStyle={styles.sendButton}
                title={t("account.send")}
                onPress={goToRecipientSelection}
              />
            </View>
            <View style={styles.ellipsisButtonContainer}>
              <Button
                type="primary"
                containerStyle={styles.ellipsisButton}
                title="•••"
                onPress={() => setBottomModalOpen(true)}
              />
            </View>
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
            value={collection.contract}
          />

          <View style={styles.hr} />

          <Section title={t("nft.viewer.tokenId")} value={nft.tokenId} />

          {collection.standard === "ERC1155" && (
            <>
              <View style={styles.hr} />
              <TouchableOpacity onPress={closeModal}>
                <Section
                  title={t("nft.viewer.quantity")}
                  value={nft.amount.toFixed()}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      <NftLinksPanel
        links={
          metadata && Object.keys(metadata?.links)?.length
            ? metadata.links
            : defaultLinks
        }
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
    marginBottom: 6,
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

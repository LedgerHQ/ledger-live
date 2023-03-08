import React, { memo } from "react";

import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";
import type { NFTMetadataResponse } from "@ledgerhq/types-live";
import type { NFTResourceLoaded } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EthereumTransaction } from "@ledgerhq/live-common/families/ethereum/types";
import LText from "../../components/LText";
import SummaryRow from "./SummaryRow";

type Props = {
  transaction: Transaction;
  currencyId: CryptoCurrency["id"];
};

const SummaryNft = ({ transaction, currencyId }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tokenId = (transaction as EthereumTransaction)?.tokenIds?.[0];
  const quantity = (transaction as EthereumTransaction)?.quantities?.[0];
  const data = useNftMetadata(
    (transaction as EthereumTransaction)?.collection,
    tokenId,
    currencyId,
  );
  const metadata = (data as NFTResourceLoaded)?.metadata;

  return (
    <>
      <SummaryRow title="NFT">
        <View style={styles.metadata}>
          <LText style={[styles.textAlignRight]} semiBold>
            {(metadata as NFTMetadataResponse["result"])?.nftName || "-"}
          </LText>
          <LText
            style={[
              styles.textAlignRight,
              {
                color: colors.grey,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {t("common.patterns.id", { value: tokenId })}
          </LText>
        </View>
      </SummaryRow>
      {(transaction as EthereumTransaction)?.mode === "erc1155.transfer" && (
        <SummaryRow title={t("send.summary.quantity")}>
          <LText semiBold>{quantity?.toFixed()}</LText>
        </SummaryRow>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  metadata: {
    flex: 1,
    maxWidth: "70%",
  },
  textAlignRight: {
    textAlign: "right",
  },
});

export default memo(SummaryNft);

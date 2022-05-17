import React, { memo } from "react";

import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNftMetadata } from "@ledgerhq/live-common/lib/nft";
import type {
  Transaction,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import SummaryRow from "./SummaryRow";

type Props = {
  transaction: Transaction,
  currencyId: CryptoCurrency["id"],
};

const SummaryNft = ({ transaction, currencyId }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tokenId = transaction?.tokenIds?.[0];
  const quantity = transaction?.quantities?.[0];
  const { metadata } = useNftMetadata(
    transaction?.collection,
    tokenId,
    currencyId,
  );
  return (
    <>
      <SummaryRow title="NFT">
        <View style={styles.metadata}>
          <LText style={[styles.textAlignRight]} semiBold>
            {metadata?.nftName || "-"}
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
            ID {tokenId}
          </LText>
        </View>
      </SummaryRow>
      {transaction?.mode === "erc1155.transfer" && (
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

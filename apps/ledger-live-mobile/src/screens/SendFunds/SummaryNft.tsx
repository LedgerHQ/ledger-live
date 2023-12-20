import React, { memo, useMemo } from "react";

import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import LText from "~/components/LText";
import SummaryRow from "./SummaryRow";

type Props = {
  transaction: Transaction;
  currencyId: CryptoCurrency["id"];
};

const SummaryNft = ({ transaction, currencyId }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tokenId = useMemo(() => {
    if (transaction?.family === "evm") {
      return transaction.nft?.tokenId;
    }
  }, [transaction]);
  const quantity = useMemo(() => {
    if (transaction?.family === "evm") {
      return transaction.nft?.quantity;
    }
  }, [transaction]);
  const collection = useMemo(() => {
    if (transaction?.family === "evm") {
      return transaction.nft?.contract;
    }
  }, [transaction]);

  const shouldDisplayQuantity =
    "mode" in transaction && ["erc1155", "erc1155.transfer"].includes(transaction.mode);
  const { metadata } = useNftMetadata(collection, tokenId, currencyId);

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
            {t("common.patterns.id", { value: tokenId })}
          </LText>
        </View>
      </SummaryRow>
      {shouldDisplayQuantity && (
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

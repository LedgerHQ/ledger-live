import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { TokenCurrency } from "@domain/entity-currency-token";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import { ReviewRow, ReviewValue } from "../components/ReviewRow";

type Props = Readonly<{
  id: string;
  token: TokenCurrency;
  isIou: boolean;
  limitText?: string;
  ripplingText: string;
  onEdit: (id: string) => void;
}>;

export function AssetCard({ id, token, isIou, limitText, ripplingText, onEdit }: Props) {
  const { t } = useTranslation();
  const issuer = formatAddress(token.contractAddress);

  return (
    <Box
      lx={{
        backgroundColor: "surface",
        borderRadius: "lg",
        padding: "s16",
        gap: "s12",
      }}
      testID={`xrp-manage-asset-${id}`}
    >
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}>
        <CurrencyIcon currency={token} size={32} hideNetwork />
        <Box lx={{ flexShrink: 1 }}>
          <Text typography="body1SemiBold" lx={{ color: "base" }}>
            {token.ticker}
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
            {issuer}
          </Text>
        </Box>
      </Box>
      <ReviewRow label={t("xrp.manageToken.tokenType")}>
        <ReviewValue>
          {t(
            isIou
              ? "xrp.addToken.steps.review.tokenTypeIou"
              : "xrp.addToken.steps.review.tokenTypeMpt",
          )}
        </ReviewValue>
      </ReviewRow>
      <ReviewRow label={t("xrp.manageToken.issuer")}>
        <ReviewValue>{issuer}</ReviewValue>
      </ReviewRow>
      {isIou && limitText ? (
        <ReviewRow label={t("xrp.tokenSettings.balanceLimit")}>
          <ReviewValue>{limitText}</ReviewValue>
        </ReviewRow>
      ) : null}
      {isIou ? (
        <ReviewRow label={t("xrp.rippling.label")}>
          <ReviewValue>{ripplingText}</ReviewValue>
        </ReviewRow>
      ) : null}
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        {isIou ? (
          <Box lx={{ flex: 1 }}>
            <Button
              appearance="gray"
              size="md"
              isFull
              onPress={() => onEdit(id)}
              testID={`xrp-manage-asset-edit-${id}`}
            >
              {t("xrp.manageToken.edit")}
            </Button>
          </Box>
        ) : null}
        <Box lx={{ flex: 1 }}>
          <Button
            appearance="gray"
            size="md"
            isFull
            disabled
            testID={`xrp-manage-asset-delete-${id}`}
          >
            {t("xrp.manageToken.delete")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

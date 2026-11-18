import React from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardFooter,
  CardFooterActions,
  CardHeader,
  CardLeading,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  InteractiveIcon,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { shortAddressPreview } from "@ledgerhq/live-common/account/helpers";
import { isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { TrackScreen } from "@shared/analytics-react";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { OWNER_RESERVE } from "../utils";
import { type Props, useIssuerFeeText, useManageTokenViewModel } from "./useManageTokenViewModel";

function Row(
  props: Readonly<{
    label: string;
    children: React.ReactNode;
    info?: string;
  }>,
) {
  return (
    <DescriptionItem size="sm">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{props.label}</DescriptionItemLabel>
        {props.info ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <InteractiveIcon
                icon={Information}
                size={16}
                iconType="stroked"
                accessibilityLabel={props.label}
              />
            </TooltipTrigger>
            <TooltipContent
              title={props.label}
              content={
                <Text typography="body1" lx={{ color: "base" }}>
                  {props.info}
                </Text>
              }
            />
          </Tooltip>
        ) : null}
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{props.children}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}

// CryptoIcon only draws a round network badge: Figma wants Lumen's square DotSymbol
function TokenIcon(
  props: Readonly<{ token: TokenCurrency; networkId: string; networkTicker: string }>,
) {
  const styles = useStyleSheet(
    theme => ({
      badge: {
        position: "absolute",
        right: -3,
        bottom: -3,
        borderRadius: 5,
        borderWidth: 1,
        overflow: "hidden",
        borderColor: theme.colors.border.baseInverted,
        backgroundColor: theme.colors.bg.muted,
      },
    }),
    [],
  );

  return (
    <Box lx={{ position: "relative" }}>
      <CryptoIcon ledgerId={props.token.id} ticker={props.token.ticker} size={40} />
      <Box style={styles.badge}>
        <CryptoIcon
          ledgerId={props.networkId}
          ticker={props.networkTicker}
          size={16}
          shape="square"
        />
      </Box>
    </Box>
  );
}

function WithSeparator(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {` · `}
      {props.children}
    </>
  );
}

function TokenCard(props: Readonly<{ account: Account; tokenAccount: XrpTokenAccount }>) {
  const { t } = useTranslation();

  const { token, xrpResources } = props.tokenAccount;

  const isIou = token.tokenType === "iou";

  const limit = xrpResources?.limit;

  const issuerFeeText = useIssuerFeeText(token);

  const currency = props.account.currency;

  // A testnet has no network icon: badge it with its mainnet's
  const networkId = currency.isTestnetFor ?? currency.id;

  return (
    <Card type="info" testID={`xrp-manage-asset-${token.id}`}>
      <CardHeader>
        <CardLeading>
          <TokenIcon token={token} networkId={networkId} networkTicker={currency.ticker} />
          <CardContent>
            <CardContentTitle>{token.name}</CardContentTitle>
            <CardContentDescription>
              {shortAddressPreview(props.account.freshAddress)}
            </CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
      <CardFooter>
        <Box lx={{ gap: "s12" }}>
          <Row label={t("xrp.manageAssets.tokenType")} info={t("xrp.manageAssets.tokenTypeInfo")}>
            {isIou ? t("xrp.manageAssets.iou") : t("xrp.manageAssets.mpt")}
          </Row>
          <Row label={t("xrp.manageAssets.issuer")}>
            {shortAddressPreview(token.contractAddress)}
          </Row>
          {issuerFeeText ? (
            <Row
              label={t("xrp.manageAssets.transferFee")}
              info={t("xrp.manageAssets.transferFeeInfo")}
            >
              {issuerFeeText}
            </Row>
          ) : null}
          <Row label={t("xrp.manageAssets.lockedAmount")}>
            <Text typography="body3" lx={{ color: "muted" }}>
              <CurrencyUnitValue unit={currency.units[0]} value={OWNER_RESERVE} showCode />
            </Text>
            <CounterValue currency={currency} value={OWNER_RESERVE} Wrapper={WithSeparator} />
          </Row>
          {isIou && limit ? (
            <Row label={t("xrp.tokenSettings.balanceLimit")}>
              {isMaxTrustLimit(limit) ? (
                t("xrp.tokenSettings.maximum")
              ) : (
                <CurrencyUnitValue unit={token.units[0]} value={limit} showCode />
              )}
            </Row>
          ) : null}
          {isIou ? (
            <Row label={t("xrp.rippling.label")} info={t("xrp.manageAssets.ripplingInfo")}>
              {xrpResources?.isRippling
                ? t("xrp.rippling.activated")
                : t("xrp.rippling.deactivated")}
            </Row>
          ) : null}
        </Box>
        <CardFooterActions>
          {isIou ? (
            <Button
              appearance="gray"
              size="sm"
              lx={{ flex: 1 }}
              disabled
              testID={`xrp-manage-asset-edit-${token.id}`}
            >
              {t("xrp.manageAssets.edit")}
            </Button>
          ) : null}
          <Button
            appearance="base"
            size="sm"
            lx={{ flex: 1 }}
            disabled
            testID={`xrp-manage-asset-delete-${token.id}`}
          >
            {t("xrp.manageAssets.delete")}
          </Button>
        </CardFooterActions>
      </CardFooter>
    </Card>
  );
}

export default function ManageToken(props: Props) {
  const { t } = useTranslation();

  const styles = useStyleSheet(
    theme => ({ list: { padding: theme.spacings.s16, gap: theme.spacings.s24 } }),
    [],
  );

  const { account, tokenAccounts } = useManageTokenViewModel(props);
  if (!account) return null;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="ManageToken" />
      <ScrollView contentContainerStyle={styles.list}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("xrp.manageAssets.title")}
        </Text>
        {tokenAccounts.length === 0 ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("xrp.manageAssets.empty")}
          </Text>
        ) : (
          tokenAccounts.map(tokenAccount => (
            <TokenCard key={tokenAccount.id} account={account} tokenAccount={tokenAccount} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

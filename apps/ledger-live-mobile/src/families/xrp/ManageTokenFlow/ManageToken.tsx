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
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { Account } from "@ledgerhq/types-live";
import { shortAddressPreview } from "@ledgerhq/live-common/account/helpers";
import { isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { TrackScreen } from "@shared/analytics-react";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { InfoTooltip } from "../components/InfoTooltip";
import { type DeleteBlocker, getDeleteBlocker, OWNER_RESERVE } from "../utils";
import DeleteTokenSheets from "./DeleteTokenSheets";
import { type Props, useIssuerFeeText, useManageTokenViewModel } from "./useManageTokenViewModel";

const BLOCKER_KEYS: Record<DeleteBlocker, string> = {
  pending: "xrp.manageAssets.removalPending",
  frozen: "xrp.manageAssets.frozen",
};

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
        {props.info ? <InfoTooltip title={props.label} info={props.info} /> : null}
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{props.children}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
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

// A disabled button takes no press: the trigger around it shows why it is disabled
function DeleteButton(
  props: Readonly<{
    tokenId: string;
    blocker?: DeleteBlocker;
    onPress: () => void;
  }>,
) {
  const { t } = useTranslation();

  const testID = `xrp-manage-asset-delete-${props.tokenId}`;
  const label = t("xrp.manageAssets.delete");

  if (!props.blocker) {
    return (
      <Button appearance="base" size="sm" lx={{ flex: 1 }} onPress={props.onPress} testID={testID}>
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger style={{ flex: 1 }} testID={`${testID}-reason`}>
        <Button appearance="base" size="sm" isFull disabled testID={testID}>
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        content={
          <Text typography="body1" lx={{ color: "base" }}>
            {t(BLOCKER_KEYS[props.blocker])}
          </Text>
        }
      />
    </Tooltip>
  );
}

function TokenCard(
  props: Readonly<{
    account: Account;
    tokenAccount: XrpTokenAccount;
    onEdit: (tokenAccount: XrpTokenAccount) => void;
    onDelete: (tokenAccount: XrpTokenAccount) => void;
  }>,
) {
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
          <CryptoIcon ledgerId={token.id} ticker={token.ticker} network={networkId} size={40} />
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
              onPress={() => props.onEdit(props.tokenAccount)}
              testID={`xrp-manage-asset-edit-${token.id}`}
            >
              {t("xrp.manageAssets.edit")}
            </Button>
          ) : null}
          <DeleteButton
            tokenId={token.id}
            blocker={getDeleteBlocker(props.account, props.tokenAccount)}
            onPress={() => props.onDelete(props.tokenAccount)}
          />
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

  const viewModel = useManageTokenViewModel(props);
  const { account, tokenAccounts, deleting } = viewModel;
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
            <TokenCard
              key={tokenAccount.id}
              account={account}
              tokenAccount={tokenAccount}
              onEdit={viewModel.onEdit}
              onDelete={viewModel.onDelete}
            />
          ))
        )}
      </ScrollView>
      {deleting ? (
        <DeleteTokenSheets
          key={deleting.id}
          account={account}
          tokenAccount={deleting}
          onSuccess={viewModel.onDeleteSuccess}
          onDone={viewModel.onDeleteDone}
        />
      ) : null}
    </SafeAreaView>
  );
}

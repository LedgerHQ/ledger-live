import React, { useState } from "react";
import { Pressable, ScrollView } from "react-native";
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
  Skeleton,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { shortAddressPreview } from "@ledgerhq/live-common/account/helpers";
import { isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { type RemoveBlocker, getRemoveBlocker } from "@ledgerhq/live-common/families/xrp/tokens";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { TrackScreen } from "@shared/analytics-react";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { InfoSheet } from "../components/InfoSheet";
import { InfoTooltip } from "../components/InfoTooltip";
import DeleteTokenSheets from "./DeleteTokenSheets";
import {
  type Props,
  useIssuerFee,
  useManageTokenViewModel,
  useOwnerReserve,
} from "./useManageTokenViewModel";

const BLOCKER_KEYS: Record<RemoveBlocker, string> = {
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

function TransferFee(props: Readonly<{ token: TokenCurrency }>) {
  const { t } = useTranslation();
  const issuerFee = useIssuerFee(props.token);

  if (issuerFee.isError) {
    return t("xrp.manageAssets.transferFeeUnavailable");
  }

  if (issuerFee.value) {
    return issuerFee.value;
  }

  return (
    <Skeleton
      testID="xrp-manage-asset-transfer-fee-loading"
      lx={{ height: "s16", width: "s80", borderRadius: "full" }}
    />
  );
}

function LockedAmount(props: Readonly<{ currency: CryptoCurrency }>) {
  const { t } = useTranslation();
  const ownerReserve = useOwnerReserve(props.currency.id);

  if (ownerReserve.isError) {
    return t("xrp.manageAssets.lockedAmountUnavailable");
  }

  if (ownerReserve.value) {
    return (
      <>
        <Text typography="body3" lx={{ color: "muted" }}>
          <CurrencyUnitValue unit={props.currency.units[0]} value={ownerReserve.value} showCode />
        </Text>
        <CounterValue
          currency={props.currency}
          value={ownerReserve.value}
          Wrapper={WithSeparator}
        />
      </>
    );
  }

  return (
    <Skeleton
      testID="xrp-manage-asset-locked-amount-loading"
      lx={{ height: "s16", width: "s80", borderRadius: "full" }}
    />
  );
}

// A disabled button takes no press: the trigger around it shows why it is disabled
function DeleteButton(
  props: Readonly<{
    tokenId: string;
    blocker?: RemoveBlocker;
    onPress: () => void;
  }>,
) {
  const { t } = useTranslation();
  const [isReasonOpen, setIsReasonOpen] = useState(false);

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
    <>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => setIsReasonOpen(true)}
        testID={`${testID}-reason`}
      >
        <Button appearance="base" size="sm" isFull disabled testID={testID}>
          {label}
        </Button>
      </Pressable>
      <InfoSheet
        isOpen={isReasonOpen}
        onClose={() => setIsReasonOpen(false)}
        info={t(BLOCKER_KEYS[props.blocker])}
      />
    </>
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
          <Row
            label={t("xrp.manageAssets.transferFee")}
            info={t("xrp.manageAssets.transferFeeInfo")}
          >
            <TransferFee token={token} />
          </Row>
          <Row label={t("xrp.manageAssets.lockedAmount")}>
            <LockedAmount currency={currency} />
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
            blocker={getRemoveBlocker(props.account, props.tokenAccount)}
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

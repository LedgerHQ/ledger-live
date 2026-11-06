import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import type { CSSObjectWithLabel, StylesConfig } from "react-select";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { TrackScreen } from "@shared/analytics-react";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import type { StepProps } from "../types";
import { useTokenOptions } from "../useTokenOptions";

function renderToken({ data: token }: { data: TokenCurrency }) {
  return (
    <Box key={token.id} horizontal alignItems="center" width="100%">
      <Box noShrink mr={2}>
        <FirstLetterIcon label={token.name} />
      </Box>
      <Ellipsis ff="Inter|Medium">{token.name}</Ellipsis>
      <Text fontSize={3} color="neutral.c60" ml={2}>
        {token.ticker}
      </Text>
      <Text fontSize={3} color="neutral.c60" ml="auto" pl={3} title={token.contractAddress}>
        {formatAddress(token.contractAddress)}
      </Text>
    </Box>
  );
}

const centerInRow = (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
  ...base,
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const centerNotices = (
  styles: StylesConfig<TokenCurrency, false>,
): StylesConfig<TokenCurrency, false> => ({
  ...styles,
  noOptionsMessage: (base, props) => centerInRow(styles.noOptionsMessage?.(base, props) ?? base),
  loadingMessage: base => centerInRow(base),
});

export default function StepToken({ account, parentAccount, token, onChangeToken, t }: StepProps) {
  invariant(account, "xrp: account required");
  const { options, isLoading, loadNext } = useTokenOptions(getMainAccount(account, parentAccount));

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Token" />
      <Box mb={4}>
        <Select
          value={token}
          options={options}
          getOptionValue={(option: TokenCurrency) => option.id}
          getOptionLabel={(option: TokenCurrency) => {
            return `${option.name} ${option.ticker} ${option.contractAddress}`;
          }}
          renderValue={renderToken}
          renderOption={renderToken}
          placeholder={t("xrp.addToken.steps.token.selectLabel")}
          isLoading={isLoading}
          stylesMap={centerNotices}
          noOptionsMessage={({ inputValue }: { inputValue: string }) => {
            if (options.length === 0) return t("xrp.addToken.steps.token.allAdded");
            return t("common.selectNoResults", { query: inputValue });
          }}
          onChange={onChangeToken}
          onScrollEnd={() => loadNext?.()}
        />
      </Box>
      <Alert type="primary">
        <Trans i18nKey="xrp.addToken.steps.token.info" />
      </Alert>
    </Box>
  );
}

export function StepTokenFooter({ transitionTo, token, transaction, bridgePending }: StepProps) {
  // The transaction gets the token once its Max is fetched
  const isSameReference = transaction?.assetReference === token?.tokenIdentifier;
  const isSameIssuer = transaction?.assetOwner === token?.contractAddress;
  const hasToken = !!token && isSameReference && isSameIssuer;
  const nextStepId = token?.tokenType === "mpt" ? "review" : "settings";

  return (
    <Button
      primary
      disabled={!hasToken || bridgePending}
      isLoading={!!token && !hasToken}
      onClick={() => transitionTo(nextStepId)}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
}

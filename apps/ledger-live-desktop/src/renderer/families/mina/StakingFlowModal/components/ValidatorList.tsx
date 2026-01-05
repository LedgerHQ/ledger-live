import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { MinaAccount, Transaction, ValidatorInfo } from "@ledgerhq/live-common/families/mina/types";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow, { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";

const DEFAULT_VISIBLE_ROWS = 4;

type Props = {
  account: MinaAccount;
  transaction: Transaction;
  onUpdateTransaction: (tx: (t: Transaction) => Transaction) => void;
};

const ValidatorList = ({ account, transaction, onUpdateTransaction }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const currency = getCryptoCurrencyById("mina");
  const unit = currency.units[0];
  const explorerView = getDefaultExplorerView(currency);

  const validators = useMemo(() => {
    const blockProducers = [...(account.resources?.blockProducers || [])].sort(
      (a, b) => b.stake - a.stake,
    );
    if (!search) return blockProducers;
    const searchLower = search.toLowerCase();
    return blockProducers.filter(
      v =>
        v.name?.toLowerCase().includes(searchLower) ||
        v.address?.toLowerCase().includes(searchLower),
    );
  }, [account.resources?.blockProducers, search]);

  const defaultValidators = useMemo(() => {
    if (validators.length === 0) return [];
    const selected = validators.find(v => v.address === transaction?.recipient);
    const others = validators
      .filter(v => v.address !== transaction?.recipient)
      .slice(0, DEFAULT_VISIBLE_ROWS - 1);
    return selected
      ? [selected, ...others].slice(0, DEFAULT_VISIBLE_ROWS)
      : validators.slice(0, DEFAULT_VISIBLE_ROWS);
  }, [validators, transaction?.recipient]);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [],
  );

  const handleValidatorSelect = useCallback(
    (validator: { address: string }) => {
      onUpdateTransaction(tx => ({
        ...tx,
        recipient: validator.address,
        txType: "stake",
      }));
    },
    [onUpdateTransaction],
  );

  const onExternalLink = useCallback(
    (address: string) => {
      const url = explorerView && getAddressExplorer(explorerView, address);
      if (url) openURL(url);
    },
    [explorerView],
  );

  const renderItem = useCallback(
    (validator: ValidatorInfo) => {
      const active = transaction?.recipient === validator.address;
      return (
        <StyledValidatorRow
          key={validator.address}
          validator={{ address: validator.address }}
          icon={
            <IconContainer isSR>
              <FirstLetterIcon label={validator.name || validator.address} />
            </IconContainer>
          }
          title={validator.name || validator.address}
          onExternalLink={onExternalLink}
          onClick={handleValidatorSelect}
          unit={unit}
          sideInfo={
            <Box
              ml={5}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Box>
                <Text
                  textAlign="right"
                  ff="Inter|SemiBold"
                  style={{
                    fontSize: 13,
                  }}
                >
                  {new BigNumber(validator.stake).toFormat(0)} {unit.code}
                </Text>
                <TotalStakeTitle>
                  <Trans i18nKey="mina.delegation.totalStake" />
                </TotalStakeTitle>
              </Box>
              <Box ml={3}>
                <ChosenMark active={active} />
              </Box>
            </Box>
          }
          subtitle={
            <>
              <Trans i18nKey="mina.delegation.commission" />
              <Text
                style={{
                  marginLeft: 5,
                  fontSize: 11,
                }}
              >{`${validator.fee} %`}</Text>
            </>
          }
        />
      );
    },
    [transaction?.recipient, onExternalLink, handleValidatorSelect, unit],
  );

  return (
    <>
      <SearchInputWrapper>
        <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />
      </SearchInputWrapper>
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          <ScrollLoadingList
            data={showAll ? validators : defaultValidators}
            style={{
              flex: showAll ? "1 0 256px" : "1 0 240px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={null}
          />
        </Box>
        <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>
          <IconAngleDown size={16} />
        </SeeAllButton>
      </ValidatorsFieldContainer>
    </>
  );
};

const SearchInputWrapper = styled.div`
  margin-bottom: 8px;
`;

const ValidatorsFieldContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

const SeeAllButton = styled.div<{ expanded: boolean }>`
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.neutral.c40};
  height: 40px;
  cursor: pointer;

  &:hover ${Text} {
    text-decoration: underline;
  }

  > :nth-child(2) {
    margin-left: 8px;
    transform: rotate(${p => (p.expanded ? "180deg" : "0deg")});
  }
`;

const StyledValidatorRow = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark = styled(Check).attrs<{ active?: boolean }>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{ active?: boolean }>``;

const TotalStakeTitle = styled(Text).attrs(() => ({
  color: "neutral.c70",
}))`
  font-size: 11px;
  font-weight: 500;
  text-align: right;
`;

export default ValidatorList;

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { StepProps } from "../types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorRow, { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import { Transaction } from "@ledgerhq/live-common/families/aleo/types";

const COMMITTEE_URL = "https://api.provable.com/v2/mainnet/committee/latest?";
const VALIDATOR_METADATA_URL = "https://api.provable.com/v2/mainnet/committee/validator-metadata";

type AleoCommitteeResponse = {
  members?: Record<string, [number, boolean, number]>;
};

type AleoValidator = {
  address: string;
  name?: string;
  stake: number;
  isOpen: boolean;
  commission: number;
};

async function fetchAleoValidators(): Promise<AleoValidator[]> {
  const committeeResponse = await fetch(COMMITTEE_URL);

  if (!committeeResponse.ok) {
    throw new Error("Unable to fetch Aleo validators");
  }

  const committee = (await committeeResponse.json()) as AleoCommitteeResponse;
  const metadataResponse = await fetch(VALIDATOR_METADATA_URL).catch(() => null);
  const metadata =
    metadataResponse?.ok === true
      ? ((await metadataResponse.json()) as Record<string, string>)
      : {};

  return Object.entries(committee.members ?? {})
    .map(([address, [stake, isOpen, commission]]) => ({
      address,
      name: metadata[address],
      stake,
      isOpen,
      commission,
    }))
    .sort((left, right) => {
      if (left.isOpen !== right.isOpen) {
        return left.isOpen ? -1 : 1;
      }

      return right.stake - left.stake;
    });
}

function useAleoValidators(search: string) {
  const [validators, setValidators] = useState<AleoValidator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setFetchFailed(false);
    fetchAleoValidators()
      .then(validators => {
        if (!cancelled) {
          setValidators(validators);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValidators([]);
          setFetchFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return { validators, isLoading, fetchFailed };
    }

    return {
      fetchFailed,
      isLoading,
      validators: validators.filter(validator => {
        const name = validator.name?.toLowerCase() ?? "";
        return validator.address.includes(normalizedSearch) || name.includes(normalizedSearch);
      }),
    };
  }, [fetchFailed, isLoading, search, validators]);
}

export default function StepValidator({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  error,
  status,
}: StepProps) {
  invariant(account && transaction, "account and transaction required");
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const [search, setSearch] = useState("");

  const unit = account.currency.units[0];
  const explorerView = getDefaultExplorerView(account.currency);

  const recipient = transaction.recipient || "";
  const { validators, isLoading, fetchFailed } = useAleoValidators(search);

  const setValidator = useCallback(
    (address: string) =>
      onUpdateTransaction(() => bridge.updateTransaction(transaction, { recipient: address })),
    [bridge, onUpdateTransaction, transaction],
  );

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [],
  );

  const onExternalLink = useCallback(
    (address: string) => {
      const url = explorerView && getAddressExplorer(explorerView, address);
      if (url) openURL(url);
    },
    [explorerView],
  );

  const renderValidator = useCallback(
    (validator: AleoValidator) => {
      const isActive = recipient === validator.address;
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
          subtitle={
            <Text ff="Inter|Medium" fontSize={2} color="neutral.c70">
              <Trans i18nKey="aleo.bond.flow.steps.validator.commission" />{" "}
              {`${validator.commission}%`}
            </Text>
          }
          unit={unit}
          onExternalLink={onExternalLink}
          onClick={() => setValidator(validator.address)}
          sideInfo={
            <Box horizontal alignItems="center">
              <Box flexDirection="column" alignItems="flex-end">
                <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={3}>
                  {formatCurrencyUnit(unit, new BigNumber(validator.stake), { showCode: true })}
                </Text>
                {!validator.isOpen ? (
                  <Text ff="Inter|SemiBold" color="warning" fontSize={2}>
                    <Trans i18nKey="aleo.bond.flow.steps.validator.closed" />
                  </Text>
                ) : null}
              </Box>
              <Box ml={2} justifyContent="center">
                <ChosenMark active={isActive} />
              </Box>
            </Box>
          }
        />
      );
    },
    [recipient, setValidator, onExternalLink, unit],
  );

  // Only surface a field error once that field has a value: an empty required
  // field is already communicated by the disabled Continue button, so we don't
  // greet the user with a "RecipientRequired" banner before they've typed.
  const showRecipientError = recipient.length > 0 && status.errors.recipient;

  return (
    <Box flow={3}>
      <TrackPage category="Bond Flow" name="Step Validator" currency="aleo" type="modal" />
      {error && recipient.length > 0 && <ErrorBanner error={error} />}
      {showRecipientError && <ErrorBanner error={status.errors.recipient} />}
      <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          <ScrollLoadingList
            data={validators}
            style={{
              flex: "1 0 256px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderValidator}
            noResultPlaceholder={
              validators.length <= 0 && search.length > 0 && <NoResultPlaceholder search={search} />
            }
          />
        </Box>
      </ValidatorsFieldContainer>
      {fetchFailed ? (
        <Box>
          <Label>
            <Trans i18nKey="aleo.bond.flow.steps.validator.label" />
          </Label>
          <Input value={recipient} onChange={setValidator} />
        </Box>
      ) : null}
      {isLoading ? (
        <Label>
          <Trans i18nKey="aleo.bond.flow.steps.validator.loading" />
        </Label>
      ) : null}
    </Box>
  );
}

export function StepValidatorFooter({
  transitionTo,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  const { errors } = status;
  const canNext = !bridgePending && !!transaction?.recipient && !errors.recipient;
  return (
    <Box horizontal>
      <Button mr={1} onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="bond-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("withdrawal")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

const ValidatorsFieldContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

const StyledValidatorRow = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark = styled(Check).attrs<{ active?: boolean }>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{ active?: boolean }>``;

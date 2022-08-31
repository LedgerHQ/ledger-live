// @flow

import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorGroupRow from "../components/ValidatorGroupRow";
import * as S from "./ValidatorGroupsField.styles";
import { useValidatorGroups } from "@ledgerhq/live-common/families/celo/react";
import type { CeloValidatorGroup } from "@ledgerhq/live-common/families/celo/types";
import type { Account, TransactionStatus } from "@ledgerhq/types-live";

type Props = {
  account: Account,
  status: TransactionStatus,
  chosenValidatorGroupAddress: ?string,
  onChangeValidatorGroup: (v: CeloValidatorGroup) => void,
};

const ValidatorGroupsField = ({
  account,
  onChangeValidatorGroup,
  chosenValidatorGroupAddress,
  status,
}: Props) => {
  invariant(account && account.celoResources, "celo account and resources required");

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const unit = getAccountUnit(account);

  const validatorGroups = useValidatorGroups(search);

  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);

  const chosenValidatorGroup = useMemo(() => {
    if (chosenValidatorGroupAddress !== null) {
      return validatorGroups.find(v => v.address === chosenValidatorGroupAddress);
    }
  }, [validatorGroups, chosenValidatorGroupAddress]);

  const containerRef = useRef();

  /** auto focus first input on mount */
  useEffect(() => {
    if (containerRef && containerRef.current && containerRef.current.querySelector) {
      const firstInput = containerRef.current.querySelector("input");
      if (firstInput && firstInput.focus) firstInput.focus();
    }
  }, []);

  if (!status) return null;

  const renderItem = (validatorGroup: CeloValidatorGroup, validatorGroupIdx: number) => {
    return (
      <ValidatorGroupRow
        currency={account.currency}
        active={chosenValidatorGroupAddress === validatorGroup.address}
        showStake={validatorGroupIdx !== 0}
        onClick={onChangeValidatorGroup}
        key={validatorGroup.address}
        validatorGroup={validatorGroup}
        unit={unit}
      ></ValidatorGroupRow>
    );
  };

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <S.ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={showAll ? validatorGroups : [chosenValidatorGroup ?? validatorGroups[0]]}
            style={{ flex: showAll ? "1 0 240px" : "1 0 56px", marginBottom: 0, paddingLeft: 0 }}
            renderItem={renderItem}
            noResultPlaceholder={
              validatorGroups.length <= 0 &&
              search.length > 0 && <NoResultPlaceholder search={search} />
            }
          />
        </Box>
        <S.SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>
          <IconAngleDown size={16} />
        </S.SeeAllButton>
      </S.ValidatorsFieldContainer>
    </>
  );
};

export default ValidatorGroupsField;

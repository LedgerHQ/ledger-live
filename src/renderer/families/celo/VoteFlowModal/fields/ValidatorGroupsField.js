// @flow
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import type { CeloValidatorGroup } from "@ledgerhq/live-common/lib/families/celo/types";
import type { Account, TransactionStatus } from "@ledgerhq/live-common/lib/types";
import invariant from "invariant";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import ValidatorGroupRow from "../components/ValidatorGroupRow";

import { useCeloPreloadData } from "@ledgerhq/live-common/lib/families/celo/react";

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

  const [showAll, setShowAll] = useState(false);

  const unit = getAccountUnit(account);

  const { validatorGroups } = useCeloPreloadData();

  const chosenValidatorGroup = useMemo(() => {
    if (chosenValidatorGroupAddress !== null) {
      return validatorGroups.find(v => v.address === chosenValidatorGroupAddress);
    }
  }, [validatorGroups, chosenValidatorGroupAddress]);

  const containerRef = useRef();

  /** auto focus first input on mount */
  useEffect(() => {
    /** $FlowFixMe */
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
    <ValidatorsFieldContainer>
      <Box p={1}>
        <ScrollLoadingList
          data={showAll ? validatorGroups : [chosenValidatorGroup ?? validatorGroups[0]]}
          style={{ flex: showAll ? "1 0 240px" : "1 0 56px", marginBottom: 0, paddingLeft: 0 }}
          renderItem={renderItem}
        />
      </Box>
      <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
        <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
          <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
        </Text>
        <IconAngleDown size={16} />
      </SeeAllButton>
    </ValidatorsFieldContainer>
  );
};

const ValidatorsFieldContainer: ThemedComponent<{}> = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;

const SeeAllButton: ThemedComponent<{ expanded: boolean }> = styled.div`
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
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

export default ValidatorGroupsField;

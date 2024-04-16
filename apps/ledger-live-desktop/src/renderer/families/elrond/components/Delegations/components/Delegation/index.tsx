import React, { useMemo, Fragment, useCallback, ReactNode } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box/Box";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ToolTip from "~/renderer/components/Tooltip";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import ChevronRight from "~/renderer/icons/ChevronRight";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import Text from "~/renderer/components/Text";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import { Ellipsis, Column, Wrapper, Divider } from "~/renderer/families/elrond/blocks/Delegation";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import {
  ELROND_EXPLORER_URL,
  ELROND_LEDGER_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/elrond/constants";
import { DelegationType } from "~/renderer/families/elrond/types";
import {
  ElrondProvider,
  ElrondAccount as AccountType,
} from "@ledgerhq/live-common/families/elrond/types";
import { ModalsData } from "~/renderer/families/elrond/modals";
import Discreet from "~/renderer/components/Discreet";

interface RenderDropdownItemType {
  isActive: boolean;
  item: {
    key?: string;
    label: string;
    disabled?: boolean;
    tooltip?: ReactNode;
    divider?: boolean;
  };
}
interface DropDownItemType {
  key: keyof ModalsData;
  label: string;
  divider?: boolean;
  parameters: {
    account: AccountType;
    contract: string;
    validators: Array<ElrondProvider>;
    delegations: Array<DelegationType>;
    amount?: string;
  };
}

type Props = DelegationType & {
  account: AccountType;
  delegations: Array<DelegationType>;
  validators: Array<ElrondProvider>;
};

const RenderDropdownItem = ({ item, isActive }: RenderDropdownItemType) => (
  <Fragment>
    {item.key === "MODAL_ELROND_CLAIM_REWARDS" && item.divider && <Divider />}

    <ToolTip
      content={item.tooltip}
      containerStyle={{
        width: "100%",
      }}
    >
      <DropDownItem disabled={item.disabled} isActive={isActive}>
        <Box horizontal={true} alignItems="center" justifyContent="center">
          <Text ff="Inter|SemiBold">
            <Trans i18nKey={item.label} />
          </Text>
        </Box>
      </DropDownItem>
    </ToolTip>
  </Fragment>
);
const Delegation = (props: Props) => {
  const {
    contract,
    claimableRewards,
    userActiveStake,
    validator,
    account,
    delegations,
    validators,
  } = props;
  const dispatch = useDispatch();
  const onSelect = useCallback(
    (action: DropDownItemType) => {
      dispatch(openModal(action.key, action.parameters));
    },
    [dispatch],
  );
  const dropDownItems = useMemo(() => {
    const items = [] as DropDownItemType[];
    if (BigNumber(userActiveStake).gt(0)) {
      items.push({
        key: "MODAL_ELROND_UNDELEGATE",
        label: "elrond.delegation.undelegate",
        parameters: {
          account,
          contract,
          validators,
          delegations,
          amount: userActiveStake,
        },
      });
    }
    if (BigNumber(claimableRewards).gt(0)) {
      items.push({
        key: "MODAL_ELROND_CLAIM_REWARDS",
        label: "elrond.delegation.reward",
        divider: BigNumber(userActiveStake).gt(0),
        parameters: {
          account,
          contract,
          delegations,
          validators,
        },
      });
    }
    return items;
  }, [claimableRewards, account, userActiveStake, contract, delegations, validators]);
  const name = validator ? validator.identity.name || contract : contract;
  const amount = useMemo(
    () =>
      denominate({
        input: userActiveStake,
        decimals: 4,
      }),
    [userActiveStake],
  );
  const rewards = useMemo(
    () =>
      denominate({
        input: claimableRewards,
        decimals: 4,
      }),
    [claimableRewards],
  );
  return (
    <Wrapper>
      <Column
        strong={true}
        clickable={true}
        onClick={() => openURL(`${ELROND_EXPLORER_URL}/providers/${contract}`)}
      >
        <Box mr={2}>
          {contract === ELROND_LEDGER_VALIDATOR_ADDRESS ? (
            <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
          ) : (
            <FirstLetterIcon label={name} />
          )}
        </Box>

        <Ellipsis>{name}</Ellipsis>
      </Column>

      <Column>
        <Box color="positiveGreen" pl={2}>
          <ToolTip content={<Trans i18nKey="elrond.delegation.activeTooltip" />}>
            <CheckCircle size={14} />
          </ToolTip>
        </Box>
      </Column>

      <Column>
        <Discreet>{amount}</Discreet> {getAccountUnit(account).code}
      </Column>

      <Column>
        <Discreet>{rewards}</Discreet> {getAccountUnit(account).code}
      </Column>

      <Column>
        <DropDown items={dropDownItems} renderItem={RenderDropdownItem} onChange={onSelect}>
          {() => (
            <Box horizontal={true} alignItems="center">
              <Trans i18nKey="common.manage" />

              <div
                style={{
                  transform: "rotate(90deg)",
                }}
              >
                <ChevronRight size={16} />
              </div>
            </Box>
          )}
        </DropDown>
      </Column>
    </Wrapper>
  );
};
export default Delegation;

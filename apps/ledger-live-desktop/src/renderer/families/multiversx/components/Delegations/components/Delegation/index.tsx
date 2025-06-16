import React, { useMemo, Fragment, useCallback, ReactNode } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { denominate } from "@ledgerhq/live-common/families/multiversx/helpers";
import Box from "~/renderer/components/Box/Box";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ToolTip from "~/renderer/components/Tooltip";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import ChevronRight from "~/renderer/icons/ChevronRight";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import Text from "~/renderer/components/Text";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import {
  Ellipsis,
  Column,
  Wrapper,
  Divider,
} from "~/renderer/families/multiversx/blocks/Delegation";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import {
  MULTIVERSX_EXPLORER_URL,
  MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/multiversx/constants";
import { DelegationType } from "~/renderer/families/multiversx/types";
import {
  MultiversXProvider,
  MultiversXAccount as AccountType,
} from "@ledgerhq/live-common/families/multiversx/types";
import { ModalsData } from "~/renderer/families/multiversx/modals";
import Discreet from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

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
    validators: Array<MultiversXProvider>;
    delegations: Array<DelegationType>;
    amount?: string;
  };
}

type Props = DelegationType & {
  account: AccountType;
  delegations: Array<DelegationType>;
  validators: Array<MultiversXProvider>;
};

const RenderDropdownItem = ({ item, isActive }: RenderDropdownItemType) => (
  <Fragment>
    {item.key === "MODAL_MULTIVERSX_CLAIM_REWARDS" && item.divider && <Divider />}

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
        key: "MODAL_MULTIVERSX_UNDELEGATE",
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
        key: "MODAL_MULTIVERSX_CLAIM_REWARDS",
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

  const unit = useAccountUnit(account);
  return (
    <Wrapper>
      <Column
        strong={true}
        clickable={true}
        onClick={() => openURL(`${MULTIVERSX_EXPLORER_URL}/providers/${contract}`)}
      >
        <Box mr={2}>
          {contract === MULTIVERSX_LEDGER_VALIDATOR_ADDRESS ? (
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
        <Discreet>{amount}</Discreet> {unit.code}
      </Column>

      <Column>
        <Discreet>{rewards}</Discreet> {unit.code}
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

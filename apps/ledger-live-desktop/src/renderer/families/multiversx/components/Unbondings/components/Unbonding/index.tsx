import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Trans } from "react-i18next";
import { denominate } from "@ledgerhq/live-common/families/multiversx/helpers";
import { useDispatch } from "react-redux";
import Box from "~/renderer/components/Box/Box";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import { openURL } from "~/renderer/linking";
import {
  Ellipsis,
  Column,
  Wrapper,
  Withdraw,
} from "~/renderer/families/multiversx/blocks/Delegation";
import { openModal } from "~/renderer/actions/modals";
import { UnbondingType } from "~/renderer/families/multiversx/types";
import {
  MULTIVERSX_EXPLORER_URL,
  MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/multiversx/constants";
import { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import Discreet from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

// FIXME spreading UnbondingType is a bad pattern
const Unbonding = (
  props: UnbondingType & {
    account: MultiversXAccount;
    unbondings: UnbondingType[];
  },
) => {
  const { account, contract, seconds, validator, amount, unbondings } = props;
  const [counter, setCounter] = useState(seconds);
  const name = useMemo(
    () => (validator ? validator.identity.name || contract : contract),
    [contract, validator],
  );
  const balance = useMemo(
    () =>
      denominate({
        input: amount,
        decimals: 4,
      }),
    [amount],
  );
  const dispatch = useDispatch();

  const getTime = useCallback(() => {
    const durationInSeconds = counter;
    const days = Math.floor(durationInSeconds / (60 * 60 * 24));
    const hours = Math.floor((durationInSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((durationInSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    let format = "";
    if (days > 0) format += `${days}d`;
    if (hours > 0) format += `${format ? " : " : ""}${hours}h`;
    if (minutes > 0) format += `${format ? " : " : ""}${minutes}m`;
    format += `${format ? " : " : ""}${seconds}s`;
    return format;
  }, [counter]);

  const handleCounter = () => {
    const interval = window.setInterval(() => setCounter(timer => timer - 1), 1000);
    return () => {
      clearInterval(interval);
      setCounter(seconds);
    };
  };
  const onWithdraw = useCallback(() => {
    dispatch(
      openModal("MODAL_MULTIVERSX_WITHDRAW", {
        account,
        unbondings,
        contract,
        amount,
        validator,
      }),
    );
  }, [account, contract, unbondings, amount, validator, dispatch]);

  const unit = useAccountUnit(account);

  useEffect(handleCounter, [seconds]);
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
        <Box color="alertRed" pl={2}>
          <ToolTip content={<Trans i18nKey="elrond.undelegation.inactiveTooltip" />}>
            <ExclamationCircleThin size={14} />
          </ToolTip>
        </Box>
      </Column>

      <Column>
        <Discreet>{balance}</Discreet> {unit.code}
      </Column>

      <Column>
        {counter > 0 ? (
          getTime()
        ) : (
          <Withdraw onClick={onWithdraw}>
            <Trans i18nKey="elrond.undelegation.withdraw.cta" />
          </Withdraw>
        )}
      </Column>
    </Wrapper>
  );
};
export default Unbonding;

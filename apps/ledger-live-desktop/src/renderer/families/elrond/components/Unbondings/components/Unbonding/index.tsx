import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Trans } from "react-i18next";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useDispatch } from "react-redux";
import moment from "moment";
import Box from "~/renderer/components/Box/Box";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import ToolTip from "~/renderer/components/Tooltip";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import { modals } from "~/renderer/families/elrond/modals";
import { openURL } from "~/renderer/linking";
import { Ellipsis, Column, Wrapper, Withdraw } from "~/renderer/families/elrond/blocks/Delegation";
import { openModal } from "~/renderer/actions/modals";
import { UnbondingType } from "~/renderer/families/elrond/types";
import {
  ELROND_EXPLORER_URL,
  ELROND_LEDGER_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/elrond/constants";
const Unbonding = (props: UnbondingType) => {
  const { account, contract, seconds, validator, amount, unbondings } = props;
  const [counter, setCounter] = useState(seconds);
  const name = useMemo(() => (validator ? validator.identity.name || contract : contract), [
    contract,
    validator,
  ]);
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
    const duration = moment.duration(counter, "seconds");
    const formatters = {
      d: [duration.asDays(), Math.floor(duration.asDays())],
      h: [duration.asHours(), "H"],
      m: [duration.asMinutes(), "m"],
      s: [duration.asSeconds(), "s"],
    };
    const format = Object.keys(formatters).reduce((total, key) => {
      const [time, label] = formatters[key];
      if (Math.floor(time) > 0) {
        return total === "" ? `${label}[${key}]` : `${total} : ${label}[${key}]`;
      }
      return total;
    }, "");
    return moment.utc(moment.duration(counter, "seconds").asMilliseconds()).format(format);
  }, [counter]);
  const handleCounter = () => {
    const interval = setInterval(() => setCounter(timer => timer - 1), 1000);
    return () => {
      clearInterval(interval);
      setCounter(seconds);
    };
  };
  const onWithdraw = useCallback(() => {
    dispatch(
      openModal(modals.withdraw, {
        account,
        unbondings,
        contract,
        amount,
        validator,
      }),
    );
  }, [account, contract, unbondings, amount, validator, dispatch]);
  useEffect(handleCounter, [seconds]);
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
        <Box color="alertRed" pl={2}>
          <ToolTip content={<Trans i18nKey="elrond.undelegation.inactiveTooltip" />}>
            <ExclamationCircleThin size={14} />
          </ToolTip>
        </Box>
      </Column>

      <Column>
        {balance} {getAccountUnit(account).code}
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

// @flow

import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import Box from "~/renderer/components/Box";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import Logo from "~/renderer/icons/Logo";
import * as S from "./ActivateValidatorGroupRow.styles";
import { isDefaultValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
import type { CeloValidatorGroup } from "@ledgerhq/live-common/families/celo/types";
import type { CryptoCurrency, Unit } from "@ledgerhq/types-live";

type Props = {
  currency: CryptoCurrency,
  validatorGroup: CeloValidatorGroup,
  active?: boolean,
  onClick?: (v: CeloValidatorGroup) => void,
  unit: Unit,
  amount: BigNumber,
};

const CeloActivateValidatorGroupRow = ({
  validatorGroup,
  active,
  onClick,
  unit,
  currency,
  amount,
}: Props) => {
  const explorerView = getDefaultExplorerView(currency);

  const onExternalLink = useCallback(() => {
    const url = getAddressExplorer(explorerView, validatorGroup.address);

    if (url) {
      openURL(url);
    }
  }, [explorerView, validatorGroup]);

  return (
    <S.StyledValidatorRow
      onClick={onClick}
      key={validatorGroup.address}
      validator={{ address: validatorGroup.address }}
      icon={
        <IconContainer isSR>
          {isDefaultValidatorGroup(validatorGroup) ? (
            <Logo size={16} />
          ) : (
            <FirstLetterIcon label={validatorGroup.name} />
          )}
        </IconContainer>
      }
      title={validatorGroup.name}
      subtitle={null}
      onExternalLink={onExternalLink}
      unit={unit}
      sideInfo={
        <Box ml={5} style={{ flexDirection: "row", alignItems: "center" }}>
          <Box>
            <Text textAlign="center" ff="Inter|SemiBold" fontSize={2}>
              {formatCurrencyUnit(unit, amount, {
                showCode: true,
              })}
            </Text>
          </Box>
          <Box ml={3}>
            <S.ChosenMark active={active ?? false} />
          </Box>
        </Box>
      }
    />
  );
};

export default CeloActivateValidatorGroupRow;

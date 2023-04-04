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
import { isDefaultValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
import { Trans } from "react-i18next";
import * as S from "./RevokeVoteRow.styles";
import { CeloValidatorGroup } from "@ledgerhq/live-common/families/celo/types";
import { CryptoCurrency, Unit } from "@ledgerhq/types-live";
type Props = {
  currency: CryptoCurrency;
  validatorGroup: CeloValidatorGroup;
  active?: boolean;
  onClick?: (v: CeloValidatorGroup) => void;
  unit: Unit;
  amount: BigNumber;
  type: string;
};
function CeloRevokeVoteRow({
  validatorGroup,
  active,
  onClick,
  unit,
  currency,
  amount,
  type,
}: Props) {
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
      validator={{
        address: validatorGroup.address,
      }}
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
      onExternalLink={onExternalLink}
      unit={unit}
      subtitle={
        <S.Status type={type}>
          {type === "active" ? (
            <Trans i18nKey="celo.revoke.steps.vote.active" />
          ) : (
            <Trans i18nKey="celo.revoke.steps.vote.pending" />
          )}
        </S.Status>
      }
      sideInfo={
        <Box
          ml={5}
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
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
    ></S.StyledValidatorRow>
  );
}
export default CeloRevokeVoteRow;

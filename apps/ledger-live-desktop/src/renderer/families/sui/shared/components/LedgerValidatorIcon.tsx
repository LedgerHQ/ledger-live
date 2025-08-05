import { SuiValidator } from "@ledgerhq/live-common/families/sui/types";
import React from "react";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/sui/constants";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import { Icon } from "~/renderer/components/ProviderIcon/styles";

const LedgerValidatorIcon = ({
  validator,
  validatorId,
}: {
  validator?: SuiValidator | null;
  validatorId?: string;
}) => {
  const address = (validator && validator.suiAddress) || validatorId;
  return (
    <IconContainer isSR>
      {address === FIGMENT_SUI_VALIDATOR_ADDRESS ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : validator?.imageUrl ? (
        <Icon src={validator.imageUrl} size="XS" loading="lazy" />
      ) : (
        <FirstLetterIcon label={address?.[2]} />
      )}
    </IconContainer>
  );
};
export default LedgerValidatorIcon;

import { SuiValidator } from "@ledgerhq/live-common/families/sui/types";
import React, { useState, useCallback, useEffect } from "react";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import { Icon } from "~/renderer/components/ProviderIcon/styles";

type Props = {
  validator?: SuiValidator | null;
  validatorId?: string;
};

const LedgerValidatorIcon = ({ validator, validatorId }: Props) => {
  const [imageError, setImageError] = useState(false);

  const address = validator?.suiAddress || validatorId;
  const imageUrl = validator?.imageUrl;
  const name = validator?.name;

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const onImageError = useCallback(() => setImageError(true), []);

  const hasValidImage = imageUrl && !imageError;
  const fallbackLabel = name?.[0] || address?.[2] || "?";

  return (
    <IconContainer isSR>
      {hasValidImage ? (
        <Icon src={imageUrl} size="XS" loading="lazy" onError={onImageError} />
      ) : (
        <FirstLetterIcon label={fallbackLabel} />
      )}
    </IconContainer>
  );
};

export default LedgerValidatorIcon;

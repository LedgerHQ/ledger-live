import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, AddressInput } from "@ledgerhq/lumen-ui-react";
import { useSendFlowContext } from "../../context/SendFlowContext";

export function RecipientPlaceholderScreen() {
  const { t } = useTranslation();
  const { navigation, transaction } = useSendFlowContext();
  const [address, setAddress] = useState("");

  const handleAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAddress(value);
      transaction.setRecipient({
        address: value,
      });
    },
    [transaction],
  );

  const handleContinue = useCallback(() => {
    navigation.goToNextStep();
  }, [navigation]);

  return (
    <div className="flex flex-col h-full justify-between p-16">
      <div className="flex flex-col gap-6">
        <div>
          <AddressInput
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter recipient address"
            autoFocus
          />
          <p className="text-xs text-neutral-c70 mt-2">Placeholder screen: No validation checks.</p>
        </div>
      </div>

      <Button onClick={handleContinue} disabled={!address}>
        {t("common.continue")}
      </Button>
    </div>
  );
}

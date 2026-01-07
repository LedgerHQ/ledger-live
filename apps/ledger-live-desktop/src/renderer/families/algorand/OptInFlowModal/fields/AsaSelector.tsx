import React, { useState, useMemo } from "react";
import { TFunction } from "i18next";
import { Trans } from "react-i18next";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";
import { extractTokenId } from "@ledgerhq/live-common/families/algorand/tokens";
import Box from "~/renderer/components/Box";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import { AlgorandAccount, Transaction } from "@ledgerhq/live-common/families/algorand/types";

const renderItem = ({
  data: { id, name },
  isDisabled,
}: {
  data: TokenCurrency;
  isDisabled: boolean;
}) => {
  const tokenId = extractTokenId(id);
  return (
    <Box
      key={id}
      horizontal
      alignItems="center"
      color={isDisabled ? "neutral.c60" : "neutral.c100"}
      justifyContent="space-between"
    >
      <Box horizontal alignItems="center" justifyContent="flex-start">
        <FirstLetterIcon color={isDisabled ? "neutral.c60" : "neutral.c100"} label={name} />
        <Text ff="Inter|Medium">{name}</Text>
        <Text fontSize={3} color="neutral.c60">
          - ID {tokenId}
        </Text>
      </Box>
      {isDisabled && (
        <ToolTip content={<Trans i18nKey="algorand.optIn.flow.steps.assets.disabledTooltip" />}>
          <Box color="legacyWarning">
            <ExclamationCircleThin size={16} />
          </Box>
        </ToolTip>
      )}
    </Box>
  );
};
export default function DelegationSelectorField({
  account,
  transaction,
  t,
  onChange,
}: {
  account: AlgorandAccount;
  transaction: Transaction;
  onChange: (token?: TokenCurrency | null) => void;
  t: TFunction;
}) {
  const [query, setQuery] = useState("");
  const subAccounts = account.subAccounts;

  const { data } = useTokensData({
    networkFamily: "algorand",
  });

  const options = data?.tokens || [];
  const value = useMemo(
    () => (data?.tokens || []).find(({ id }) => id === transaction.assetId),
    [data?.tokens, transaction.assetId],
  );
  return (
    <Box flow={1} mb={4}>
      <Select
        value={value}
        options={options}
        getOptionValue={({ name }) => name}
        isOptionDisabled={({ id }) =>
          subAccounts?.some(o => o.type === "TokenAccount" && o.token.id === id) || false
        }
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        inputValue={query}
        placeholder={t("algorand.optIn.flow.steps.assets.selectLabel")}
        noOptionsMessage={({ inputValue }) =>
          t("common.selectNoResults", {
            query: inputValue,
          })
        }
        onChange={onChange}
      />
    </Box>
  );
}

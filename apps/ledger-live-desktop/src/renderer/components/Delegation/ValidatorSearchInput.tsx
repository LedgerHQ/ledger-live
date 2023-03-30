import React, { memo } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import Box from "~/renderer/components/Box";
import SearchBox from "~/renderer/screens/accounts/AccountList/SearchBox";
import ExclamationCircle from "~/renderer/icons/ExclamationCircle";
import Text from "~/renderer/components/Text";
const SearchContainer = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  justifyContent: "space-between",
  py: 2,
  px: 3,
  borderRadius: 4,
}))`
  margin: 0 ${p => (p.noMargin === true ? "0px" : p.theme.overflow.trackSize)}px;
  border: 1px solid ${p => p.theme.colors.palette.divider};

  > input::placeholder,
  > input {
    font-size: 13px;
  }
`;
const Placeholder: ThemedComponent<any> = styled(Box).attrs(() => ({
  vertical: true,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
  color: "palette.text.shade50",
  mt: 3,
  p: 3,
  flex: "1",
}))`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  margin-right: ${p => p.theme.overflow.trackSize}px;
`;
type ValidatorSearchInputProps = {
  onSearch: (evt: SyntheticInputEvent<HTMLInputElement>) => void;
  search?: string;
  noMargin: boolean;
};
const ValidatorSearchInput = ({
  search,
  onSearch,
  noMargin = false,
}: ValidatorSearchInputProps) => {
  const { t } = useTranslation();
  return (
    <SearchContainer noMargin={noMargin}>
      <SearchBox
        search={search}
        onTextChange={onSearch}
        placeholder={t("vote.steps.castVotes.search")}
      />
    </SearchContainer>
  );
};
export const NoResultPlaceholder = ({ search }: { search: string }) => (
  <Placeholder>
    <Box mb={2}>
      <ExclamationCircle size={30} />
    </Box>
    <Text ff="Inter|Medium" fontSize={4}>
      <Trans
        i18nKey="vote.steps.castVotes.noResults"
        values={{
          search,
        }}
      >
        <b></b>
      </Trans>
    </Text>
  </Placeholder>
);
export default memo<ValidatorSearchInputProps>(ValidatorSearchInput);

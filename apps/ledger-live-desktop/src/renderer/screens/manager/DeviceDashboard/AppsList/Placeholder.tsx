import React from "react";
import { Trans } from "react-i18next";
import Text from "~/renderer/components/Text";
import NoResults from "~/renderer/icons/NoResults";
import Box from "~/renderer/components/Box/Box";

const Placeholder = () => {
  return (
    <Box py={6} flex={1} alignContent="center">
      <Box mb={4} horizontal color="palette.text.shade30" justifyContent="center">
        <NoResults />
      </Box>
      <Text textAlign="center" ff="Inter|SemiBold" fontSize={6}>
        <Trans i18nKey="manager.applist.noResultsFound" />
      </Text>
      <Text textAlign="center" fontSize={4}>
        <Trans i18nKey="manager.applist.noResultsDesc" />
      </Text>
    </Box>
  );
};
export default Placeholder;

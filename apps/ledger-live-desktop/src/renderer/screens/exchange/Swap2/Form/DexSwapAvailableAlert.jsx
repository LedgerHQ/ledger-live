// @flow
import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import Text from "~/renderer/components/Text";
import FakeLink from "~/renderer/components/FakeLink";

// This component render an Alert with links that lead to dex swap live apps.
const DexSwapAvailableAlert = () => {
  const history = useHistory();

  const navigateToParaswap = useCallback(() => {
    history.push({
      pathname: `/platform/paraswap`,
      search: new URLSearchParams({
        returnTo: "/swap",
      }).toString(),
    });
  }, [history]);

  const navigateTo1inch = useCallback(() => {
    history.push({
      pathname: `/platform/1inch-lld`,
      search: new URLSearchParams({
        returnTo: "/swap",
      }).toString(),
    });
  }, [history]);

  return (
    <Alert mt="16px" type="secondary">
      <Text ff="Inter|Medium" fontSize={4}>
        <Trans i18nKey="swap.decentralizedSwapAvailable">
          <FakeLink onClick={navigateToParaswap} />
          <FakeLink onClick={navigateTo1inch} />
        </Trans>
      </Text>
    </Alert>
  );
};

export default DexSwapAvailableAlert;

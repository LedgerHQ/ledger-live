import React, { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@features/platform-feature-flags";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { Trans, useTranslation } from "~/context/Locale";
import Alert from "~/components/Alert";
import { getFreshAccountAddress } from "~/utils/address";

type Props = {
  readonly mainAccount: Account;
};

export default function ReceiveConfirmationPostAlert({ mainAccount }: Props) {
  const verifyAddressFeature = useFeature("concordiumVerifyAddress");
  const { t } = useTranslation();

  const explorerUrl = useMemo(() => {
    const explorerView = getDefaultExplorerView(mainAccount.currency);
    const address = getFreshAccountAddress(mainAccount);
    return address ? getAddressExplorer(explorerView, address) : undefined;
  }, [mainAccount]);

  if (verifyAddressFeature?.enabled === true) return null;

  return (
    <Flex px={6} flexDirection="column" rowGap={8} mt={6} mb={4}>
      <Alert
        type="security"
        learnMoreUrl={explorerUrl ?? undefined}
        learnMoreText={t("concordium.receive.verifyLink")}
      >
        <Trans i18nKey="concordium.receive.messageIfSkipped" />
      </Alert>
    </Flex>
  );
}

import { Alert, Flex, Icons, Text } from "@ledgerhq/react-ui";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLedgerSyncInfo } from "LLD/features/WalletSync/hooks/useLedgerSyncInfo";
import { Button } from "@ledgerhq/lumen-ui-react";
import Ellipsis from "~/renderer/components/Ellipsis";
import FakeLink from "~/renderer/components/FakeLink";

export function CheckerLedgerSync() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { walletState, trustchain } = useLedgerSyncInfo();

  const elements = [
    {
      key: t("settings.developer.debugWalletSync.modal.check.trustchain.name"),
      value:
        trustchain?.rootId ??
        t("settings.developer.debugWalletSync.modal.check.trustchain.emptyId"),
      copy: true,
      tiny: true,
    },
    {
      key: t("settings.developer.debugWalletSync.modal.check.trustchain.applicationPath"),
      value:
        trustchain?.applicationPath ??
        t("settings.developer.debugWalletSync.modal.check.trustchain.emptyApplicationPath"),
      copy: true,
      tiny: false,
    },
    {
      key: t("settings.developer.debugWalletSync.modal.check.trustchain.cloudSyncVersion"),
      value: "v" + String(walletState.walletSyncState.version),
      copy: true,
      tiny: false,
    },
    {
      key: t("settings.developer.debugWalletSync.modal.check.trustchain.uniported"),
      value: String(walletState.nonImportedAccountInfos.length),
      copy: true,
      tiny: false,
    },
  ];

  function copyToClipboard(text?: string) {
    setCopied(true);
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text);
    }
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }

  const exportToJson = () => {
    const jsonObject: Record<string, string> = {};

    elements.forEach(element => {
      jsonObject[element.key] = element.value;
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(jsonObject, null, 2),
    )}`;

    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "ledgerSyncInfo.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Flex flexDirection="column" justifyContent="center" rowGap={"24px"} position="relative">
      {elements.map((element, index) => (
        <Flex key={index} justifyContent="space-between">
          <Text color={"neutral.c100"} key={index}>
            {element.key}
          </Text>

          {element.tiny ? (
            <Ellipsis>
              <Text
                onClick={() => copyToClipboard(element.value)}
                color={"primary.c80"}
                key={0}
                ml={2}
                variant={"small"}
              >
                {element.value}
              </Text>
            </Ellipsis>
          ) : (
            <Text
              onClick={() => copyToClipboard(element.value)}
              color={"primary.c80"}
              key={0}
              ml={2}
              variant={"body"}
            >
              {element.value}
            </Text>
          )}

          {element.copy && (
            <FakeLink onClick={() => copyToClipboard(element.value)} color="neutral.c70">
              <Icons.Copy size={"S"} />
            </FakeLink>
          )}
        </Flex>
      ))}

      <Button
        appearance="base"
        size="sm"
        onClick={() => {
          exportToJson();
        }}
      >
        {t("settings.developer.debugWalletSync.modal.check.export")}
      </Button>

      {copied && (
        <Alert
          type={"success"}
          containerProps={{ p: 12, borderRadius: 8 }}
          renderContent={() => (
            <Text color={"success.c70"}>
              {t("settings.developer.debugWalletSync.modal.check.copied")}
            </Text>
          )}
        />
      )}
    </Flex>
  );
}

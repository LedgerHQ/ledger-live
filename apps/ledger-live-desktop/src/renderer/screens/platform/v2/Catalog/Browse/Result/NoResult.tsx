import React, { useCallback } from "react";
import { shell } from "electron";
import { Flex, Text } from "@ledgerhq/react-ui";
import { HTTP_REGEX } from "@ledgerhq/live-common/wallet-api/constants";
import { useTranslation, Trans } from "react-i18next";
import { Search } from "../../../hooks";

export function NoResult({ input }: Pick<Search, "input">) {
  const { t } = useTranslation();

  const onClickLink = useCallback(() => {
    shell.openExternal(input);
  }, [input]);

  return (
    <Flex flexDirection="column" alignItems="center" padding={4}>
      <Text>{t("platform.catalog.warnings.notFound")}</Text>
      <Text>
        {input.match(HTTP_REGEX) ? (
          <Trans
            i18nKey="platform.catalog.warnings.retrySearchKeywordAndUrl"
            values={{ search: input }}
            components={{
              Link: (
                <Text
                  color="primary.c70"
                  onClick={onClickLink}
                  style={{ textDecoration: "underline" }}
                >
                  {""}
                </Text>
              ),
            }}
          />
        ) : (
          t("platform.catalog.warnings.retrySearchKeyword")
        )}
      </Text>
    </Flex>
  );
}

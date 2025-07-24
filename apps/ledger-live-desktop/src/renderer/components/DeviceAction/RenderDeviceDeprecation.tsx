import React, { useState } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import CheckBox from "~/renderer/components/CheckBox";
import { Button, Icons, Text, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { rgba } from "~/renderer/styles/helpers";
import { openURL } from "~/renderer/linking";
import { useTranslation } from "react-i18next";

const Circle = styled.div`
  padding: 16px;
  border-radius: 100px;
  background-color: ${p => rgba(p.theme.colors.palette.primary.c80, 0.1)};
  align-items: center;
  gap: 10px;
  display: flex;
  align-self: center;
  justify-content: center;
  width: fit-content;
  height: fit-content;
`;

// const WARN_FROM_UTXO_COUNT = 50;

const RenderDeviceDeprecation = () => {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useTranslation();
  const deadline = new Date("2025-07-01");
  const today = new Date();
  const date = deadline.toLocaleDateString();
  const isPast = today > deadline;
  const canClearSign = false;

  return (
    <Box flow={4} mx={40}>
      <Circle>
        {isPast ? (
          canClearSign ? (
            <Icons.WarningFill size="L" color="palette.warning.c70" />
          ) : (
            <IconsLegacy.CircledCrossSolidMedium size={40} color="error.c60" />
          )
        ) : (
          <Icons.InformationFill size="L" color="primary.c80" />
        )}
      </Circle>
      <Text fontWeight="600" textAlign="center" fontSize={24}>
        {isPast
          ? canClearSign
            ? t("lnsDeprecation.warning.title")
            : t("lnsDeprecation.error.title")
          : t("lnsDeprecation.info.title", {
              date,
              coinName: "test",
            })}
      </Text>
      <Text color="palette.text.shade60" textAlign="center" fontWeight="500" fontSize={14}>
        {isPast
          ? canClearSign
            ? t("lnsDeprecation.warning.subtitle")
            : t("lnsDeprecation.error.subtitle")
          : t("lnsDeprecation.info.subtitle")}
      </Text>
      <Button
        variant="main"
        size="large"
        onClick={e => {
          e.preventDefault();
          openURL("https://shop.ledger.com/pages/ledger-nano-s-upgrade-program");
        }}
      >
        {t("lnsDeprecation.update")}
      </Button>
      {isPast ? (
        canClearSign ? (
          <Button size="large" variant="shade" onClick={() => {}}>
            {t("lnsDeprecation.warning.continue")}
          </Button>
        ) : null
      ) : (
        <Button size="large" variant="shade" onClick={() => {}}>
          {t("lnsDeprecation.continue")}
        </Button>
      )}
      <Link
        href="https://support.ledger.com/article/Ledger-Nano-S-Limitations"
        color="palette.text.shade60"
        onClick={e => {
          e.preventDefault();
          openURL("https://support.ledger.com/article/Ledger-Nano-S-Limitations");
        }}
      >
        {t("lnsDeprecation.learnMore")}
      </Link>
      {isPast ? null : (
        <Box
          horizontal
          alignItems="flex-start"
          onClick={() => setIsChecked(!isChecked)}
          style={{
            flex: 1,
            cursor: "pointer",
          }}
        >
          <CheckBox isChecked={isChecked} data-testid="dismiss-disclaimer" />
          <Text
            ff="Inter|SemiBold"
            fontSize={4}
            style={{
              marginLeft: 8,
              overflowWrap: "break-word",
              flex: 1,
            }}
          >
            {t("lnsDeprecation.info.reminder")}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default RenderDeviceDeprecation;

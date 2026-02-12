import React from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { Text, Alert } from "@ledgerhq/react-ui";
import { Checkbox } from "@ledgerhq/lumen-ui-react";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import type { StepProps } from "../types";
import { DatePicker } from "../shared/DatePicker";
import { Container } from "../shared/Container";
import ToolTip from "~/renderer/components/Tooltip";
import { Title, TitleWrapper } from "../../AccountBalanceSummaryFooter";
import InfoCircle from "~/renderer/icons/InfoCircle";

function StepBirthday({
  t,
  account,
  birthday,
  invalidBirthday,
  syncFromZero,
  handleBirthdayChange,
  handleSyncFromZero,
}: Readonly<StepProps>) {
  invariant(account, "account required");

  return (
    <Container alignItems="flex-start">
      <TrackPage
        category="Export ZCash key"
        name="Step birthday"
        flow="exportUfvk"
        currency="zcash"
      />
      <Alert
        type={"info"}
        containerProps={{ p: 12, borderRadius: 8 }}
        renderContent={() => (
          <Text
            variant="paragraphLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={13}
          >
            <Trans i18nKey="zcash.shielded.flows.export.steps.birthday.text" />
            <b>
              {" "}
              <Trans i18nKey="zcash.shielded.flows.export.steps.birthday.cta" />
            </b>
          </Text>
        )}
      />
      <Box flow={1} py={12}>
        <ToolTip content={<Trans i18nKey="zcash.shielded.flows.export.steps.birthday.tooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="zcash.shielded.flows.export.steps.birthday.label" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <DatePicker
          value={birthday}
          disabled={syncFromZero}
          error={!!invalidBirthday}
          errorMessage={t("zcash.shielded.flows.export.steps.birthday.error")}
          onChange={handleBirthdayChange}
          data-testid="birthday-height"
        />
      </Box>
      <Box horizontal fontSize={14}>
        <Checkbox
          name="zcash-birthday-checkbox"
          checked={syncFromZero}
          onCheckedChange={handleSyncFromZero}
          style={{ marginRight: 10 }}
        />
        <Trans
          i18nKey="zcash.shielded.flows.export.steps.birthday.syncFromZero"
          style={{ fontSize: 12 }}
        />
      </Box>
    </Container>
  );
}

export default StepBirthday;

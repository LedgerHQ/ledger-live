import React, { useCallback, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { Box, Button, Flex, Link, Text } from "@ledgerhq/react-ui";
import { useDispatch } from "LLD/hooks/redux";
import { ScrollContainer } from "LLD/features/AddAccountDrawer/components/ScrollContainer";
import {
  FOOTER_PADDING_BOTTOM_PX,
  FOOTER_PADDING_TOP_PX,
} from "LLD/features/AddAccountDrawer/screens/styles";
import CheckBox from "~/renderer/components/CheckBox";
import { openModal } from "~/renderer/actions/modals";

type Props = Readonly<{
  onAgree: () => void;
  onCancel: () => void;
}>;

const Bullet = styled(Flex).attrs({ as: "li" })`
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  list-style: none;
`;

const BulletDot = styled.span`
  flex: 0 0 4px;
  width: 4px;
  height: 4px;
  margin-top: 10px;
  border-radius: 50%;
  background-color: ${p => p.theme.colors.neutral.c100};
`;

const BulletList = styled.ul`
  padding: 0;
  margin: 16px 0 0 0;
`;

// The whole row is the click target so users can tap the label text to toggle.
// Intentionally NOT a <label>: the Terms <Link> below would otherwise be a
// nested interactive element inside the label, which is fragile for screen
// readers. Keyboard activation is provided by the inner CheckBox (Tabbable
// makes its visible Base focusable + Enter-activatable). The Terms <Link>
// stops propagation so clicking it opens the modal without flipping consent.
const ConsentRow = styled(Flex)`
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  cursor: pointer;
  user-select: none;
`;

const BULLET_KEYS = ["utxo", "offers", "dualValidator", "tokenLiability"] as const;

function DisclaimerBullet({ bulletKey }: { bulletKey: (typeof BULLET_KEYS)[number] }) {
  const { t } = useTranslation();
  return (
    <Bullet>
      <BulletDot />
      <Text variant="paragraph" color="neutral.c80">
        <Text as="span" fontWeight="semiBold" color="neutral.c100">
          {t(`families.canton.disclaimer.bullets.${bulletKey}.title`)}
        </Text>
        {" — "}
        {t(`families.canton.disclaimer.bullets.${bulletKey}.body`)}
      </Text>
    </Bullet>
  );
}

export default function CantonDisclaimer({ onAgree, onCancel }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [agreed, setAgreed] = useState(false);

  const handleToggle = useCallback(() => setAgreed(prev => !prev), []);

  const handleOpenTerms = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(openModal("MODAL_CANTON_TERMS", undefined));
    },
    [dispatch],
  );

  return (
    <Flex flexDirection="column" height="100%" data-testid="canton-disclaimer">
      <ScrollContainer position="relative">
        <Text variant="h4Inter" fontWeight="semiBold" color="neutral.c100" mb={3}>
          {t("families.canton.disclaimer.title")}
        </Text>
        <Text variant="paragraph" color="neutral.c80">
          {t("families.canton.disclaimer.intro")}
        </Text>

        <BulletList>
          {BULLET_KEYS.map(key => (
            <DisclaimerBullet key={key} bulletKey={key} />
          ))}
        </BulletList>

        <ConsentRow data-testid="canton-disclaimer-agree-row" onClick={handleToggle}>
          <CheckBox isChecked={agreed} onChange={handleToggle} />
          <Text variant="paragraph" color="neutral.c80">
            <Trans
              i18nKey="families.canton.disclaimer.agreeLabel"
              components={{
                1: (
                  <Link
                    onClick={handleOpenTerms}
                    data-testid="canton-disclaimer-terms-link"
                    style={{ display: "inline" }}
                    textProps={{ fontWeight: "regular" }}
                  />
                ),
              }}
            />
          </Text>
        </ConsentRow>
      </ScrollContainer>

      <Box
        paddingBottom={FOOTER_PADDING_BOTTOM_PX}
        paddingTop={FOOTER_PADDING_TOP_PX}
        paddingX="0px"
        zIndex={1}
      >
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
          <Button
            size="large"
            variant="shade"
            onClick={onCancel}
            data-testid="canton-disclaimer-cancel"
          >
            {t("families.canton.disclaimer.cancel")}
          </Button>
          <Button
            size="large"
            variant="main"
            disabled={!agreed}
            onClick={onAgree}
            data-testid="canton-disclaimer-agree"
          >
            {t("families.canton.disclaimer.agree")}
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}

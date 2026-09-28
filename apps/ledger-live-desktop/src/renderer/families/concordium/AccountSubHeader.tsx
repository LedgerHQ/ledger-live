import React from "react";
import { useTranslation } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  CONCORDIUM_TOKEN_NOTICE_ERROR,
  tokenNoticeFor,
} from "@ledgerhq/live-common/families/concordium/types";

/**
 * Warns about token state the generic token page does not model.
 *
 * `AccountSubHeader`, not `AccountBodyHeader`: the latter is skipped when
 * `isAccountEmpty` is true, which a PLT sub-account with no balance and no
 * operations is. It is also the family's only sub-header slot, so it renders for
 * the parent account too — `tokenNoticeFor` reports nothing for one.
 *
 * `role="status"` rather than `"alert"`: sync can populate the token state while
 * the page is open, so the message is worth announcing, but it is page content
 * and must not interrupt.
 */
export default function ConcordiumAccountSubHeader({
  account,
  parentAccount,
}: {
  readonly account: AccountLike;
  readonly parentAccount: Account | null | undefined;
}) {
  const { t } = useTranslation();
  const notice = tokenNoticeFor(account, parentAccount);

  if (!notice) return null;

  const error = CONCORDIUM_TOKEN_NOTICE_ERROR[notice];

  return (
    <Box mb={5} role="status">
      <Alert type="warning" title={t(`errors.${error}.title`)}>
        {t(`errors.${error}.description`)}
      </Alert>
    </Box>
  );
}

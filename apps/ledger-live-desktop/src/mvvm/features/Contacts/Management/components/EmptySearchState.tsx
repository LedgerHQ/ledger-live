import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Empty state shown in the Contacts list pane when an active search
 * query matches nothing — Figma frame `14158:11604`.
 *
 * The Figma is intentionally minimal here: no icon, no body, no
 * action. Just a centred `heading-5-semi-bold` title in the space
 * below the search input. Removing or clearing the query is the only
 * way out — and the search input itself already provides the affordance
 * (Lumen `SearchInput` ships with a clear button) so we don't need to
 * duplicate the CTA in the empty state.
 */
export function EmptySearchState() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="contacts-management-empty-search"
      // `flex-1` to claim the vertical space under the search input
      // and `justify-center` to centre the label in that area — same
      // approach as `EmptyContactsState`.
      className="flex flex-1 flex-col items-center justify-center w-full text-center"
    >
      <p className="heading-5-semi-bold text-base">
        {t("contactsManagement.emptySearch.title")}
      </p>
    </div>
  );
}

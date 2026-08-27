import React from "react";
import { EmptyState } from "../EmptyState/EmptyState.web";
import type { ContactsViewProps } from "../../types";

export function ContactsView({ title, isEmpty, emptyState }: ContactsViewProps) {
  return (
    <div className="mt-40 flex flex-col" data-testid="pay-contacts">
      <p className="mb-12 heading-5-semi-bold text-base">{title}</p>
      {isEmpty ? <EmptyState {...emptyState} /> : null}
    </div>
  );
}

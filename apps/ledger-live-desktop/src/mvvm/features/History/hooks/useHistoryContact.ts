import { useSearchParams } from "react-router";
import { ContactIdSchema, selectContactById, type Contact } from "@domain/entity-contact";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";

export function useHistoryContact(): Contact | undefined {
  const [searchParams] = useSearchParams();
  const payTab = useFeature("lwdPayTab");
  const isPayTabEnabled = !!payTab?.enabled;
  const contactIdResult = ContactIdSchema.safeParse(searchParams.get("contactId"));
  const contactId = isPayTabEnabled && contactIdResult.success ? contactIdResult.data : undefined;
  return useSelector(state => (contactId ? selectContactById(state, contactId) : undefined));
}

import React from "react";
import type { ContactDetailViewProps } from "../../types";
import { ContactDetailAvatar } from "../ContactDetailAvatar.web";
import { ContactDetailName } from "../ContactDetailName.web";

type ContactDetailHeaderIdentityProps = Readonly<{
  contact: ContactDetailViewProps["contact"];
  meAvatarSrc: string;
  name: string;
  addressCount: string;
  isCollapsed: boolean;
  compactContentRight: string;
}>;

export function ContactDetailHeaderIdentity({
  contact,
  meAvatarSrc,
  name,
  addressCount,
  isCollapsed,
  compactContentRight,
}: ContactDetailHeaderIdentityProps): React.ReactNode {
  return (
    <>
      <div
        className={`absolute motion-safe:transition-[top,left,transform] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
          isCollapsed ? "left-16 top-1/2 -translate-y-1/2" : "left-1/2 top-0 -translate-x-1/2"
        }`}
      >
        <ContactDetailAvatar
          contact={contact}
          meAvatarSrc={meAvatarSrc}
          size={isCollapsed ? "md" : "xl"}
        />
      </div>
      <div
        className={`absolute flex min-w-0 flex-col gap-4 motion-safe:transition-[top,left,right,transform] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
          isCollapsed
            ? `left-80 top-1/2 -translate-y-1/2 items-start ${compactContentRight}`
            : "left-0 top-[88px] w-full items-center"
        }`}
      >
        <div className={`flex min-w-0 flex-col gap-4 ${isCollapsed ? "" : "w-full items-center"}`}>
          <ContactDetailName
            name={name}
            size={isCollapsed ? "heading-5-semi-bold" : "heading-3-semi-bold"}
          />
          <p className="body-2 text-muted">{addressCount}</p>
        </div>
      </div>
    </>
  );
}

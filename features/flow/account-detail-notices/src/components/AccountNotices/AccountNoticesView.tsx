import React from "react";
import { AccountStatusBanner } from "../AccountStatusBanner/AccountStatusBanner";
import type { NoticeBanner } from "./useAccountNoticesViewModel";

type Props = Readonly<{ banners: readonly NoticeBanner[]; testID?: string }>;

export function AccountNoticesView({ banners, testID }: Props) {
  return (
    <>
      {banners.map(({ id, ...banner }) => (
        <AccountStatusBanner key={id} {...banner} testID={testID ? `${testID}-${id}` : undefined} />
      ))}
    </>
  );
}

import React from "react";
import styled from "styled-components";
import IconQrCode from "~/renderer/icons/QrCode";
import Label from "./Label";
import { useTranslation } from "react-i18next";
import { rgba } from "~/renderer/styles/helpers";
const Wrapper = styled(Label).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "wallet",
  fontSize: 4,
  alignItems: "center",
}))`
  display: flex;
  cursor: pointer;

  &:hover {
    color: ${p => rgba(p.theme.colors.wallet, 0.9)};
  }

  span {
    text-decoration: underline;
    padding-left: 5px;
  }
`;
type Props = {
  address: string;
  onClick: () => void;
};
export function LinkShowQRCode({ onClick }: Props) {
  const { t } = useTranslation();
  return (
    <Wrapper onClick={onClick}>
      <IconQrCode size={12} />
      <span>{t("currentAddress.showQrCode")}</span>
    </Wrapper>
  );
}
export default LinkShowQRCode;

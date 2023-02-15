import { ProtectStateNumberEnum } from "../components/ServicesWidget/types";
import { ProtectData } from "../reducers/types";
import { RawProtectData } from "../types/protect";

export function formatData(data: RawProtectData): ProtectData {
  return {
    services: {
      Protect: {
        available: data.services.Protect.available,
        active: data.services.Protect.active,
        paymentDue: data.services.Protect.payment_due,
        subscribedAt: data.services.Protect.subscribed_at,
        lastPaymentDate: data.services.Protect.subscribed_at,
      },
    },
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshExpiresIn: data.refresh_expires_in,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
  };
}

export function getProtectStatus(data: ProtectData): ProtectStateNumberEnum {
  let protectStatus = ProtectStateNumberEnum.NEW;

  if (
    data.services.Protect.available &&
    !data.services.Protect.active &&
    !data.services.Protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.CONFIRM_IDENTITY;
  }

  if (
    data.services.Protect.available &&
    data.services.Protect.active &&
    data.services.Protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.ADD_PAYMENT;
  }

  if (
    data.services.Protect.available &&
    !data.services.Protect.active &&
    data.services.Protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.PAYMENT_REJECTED;
  }

  if (
    !data.services.Protect.available &&
    !data.services.Protect.active &&
    data.services.Protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.SUBSCRIPTION_CANCELED;
  }

  if (
    data.services.Protect.available &&
    data.services.Protect.active &&
    !data.services.Protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.ACTIVE;
  }

  return protectStatus;
}

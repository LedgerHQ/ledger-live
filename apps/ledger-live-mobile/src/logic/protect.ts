import { ProtectStateNumberEnum } from "../components/ServicesWidget/types";
import { ProtectData } from "../reducers/types";
import { RawProtectData } from "../types/protect";

export function formatData(data: RawProtectData): ProtectData {
  return {
    services: {
      protect: {
        available: data.services.protect.available,
        active: data.services.protect.active,
        paymentDue: data.services.protect.payment_due,
        subscribedAt: data.services.protect.subscribed_at,
        lastPaymentDate: data.services.protect.subscribed_at,
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
    data.services.protect.available &&
    !data.services.protect.active &&
    !data.services.protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.CONFIRM_IDENTITY;
  }

  if (
    data.services.protect.available &&
    data.services.protect.active &&
    data.services.protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.ADD_PAYMENT;
  }

  if (
    data.services.protect.available &&
    !data.services.protect.active &&
    data.services.protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.PAYMENT_REJECTED;
  }

  if (
    !data.services.protect.available &&
    !data.services.protect.active &&
    data.services.protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.SUBSCRIPTION_CANCELED;
  }

  if (
    data.services.protect.available &&
    data.services.protect.active &&
    !data.services.protect.paymentDue
  ) {
    protectStatus = ProtectStateNumberEnum.ACTIVE;
  }

  return protectStatus;
}

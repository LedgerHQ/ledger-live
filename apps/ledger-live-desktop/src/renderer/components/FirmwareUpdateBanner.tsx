import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  Button as NewButton,
} from "@ledgerhq/lumen-ui-react";
import { useFirmwareUpdateBannerViewModel } from "LLD/components/FirmwareUpdateBanner";
import type { FirmwareUpdateBannerViewModelResult } from "LLD/components/FirmwareUpdateBanner";
import { UpdaterContext } from "~/renderer/components/Updater/UpdaterContext";
import { VISIBLE_STATUS } from "./Updater/Banner";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { FirmwareUpdateBannerLegacy } from "./FirmwareUpdateBannerLegacy";

function FullBannerNew({
  old,
  right,
  visibleFirmwareVersion,
  onClick,
}: {
  old: boolean | undefined;
  right: React.ReactNode | undefined;
  visibleFirmwareVersion: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card type="info" className="bg-accent" data-testid="fw-update-banner">
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>
              <span className="text-black">
                {t(
                  old
                    ? "manager.firmware.banner.old.warning"
                    : "manager.firmware.banner.wallet40.warning.manager",
                )}
              </span>
            </CardContentTitle>
            <CardContentDescription>
              <span className="text-black">
                {old
                  ? null
                  : t("manager.firmware.banner.version", {
                      latestFirmware: visibleFirmwareVersion,
                    })}
              </span>
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          {right ?? (
            <NewButton appearance="base" size="sm" onClick={onClick}>
              {t("manager.firmware.banner.cta")}
            </NewButton>
          )}
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}

function FirmwareUpdateBannerContent(props: FirmwareUpdateBannerViewModelResult) {
  if (props.kind === "hidden") return null;

  if (props.kind === "topbar-button") {
    const { deviceIcon: DeviceIcon, onClick, buttonLabel } = props;
    return (
      <NewButton
        appearance="transparent"
        size="sm"
        icon={DeviceIcon as never}
        onClick={onClick}
        data-testid="topbar-os-update-button"
      >
        {buttonLabel}
      </NewButton>
    );
  }

  const { useWallet40Style, old, right, visibleFirmwareVersion, onClick } = props;
  const bannerProps = { old, right, visibleFirmwareVersion, onClick };

  return useWallet40Style ? (
    <FullBannerNew {...bannerProps} />
  ) : (
    <FirmwareUpdateBannerLegacy {...bannerProps} />
  );
}

const FirmwareUpdateBannerEntry = ({ old, right }: { old?: boolean; right?: React.ReactNode }) => {
  const context = useContext(UpdaterContext);
  const viewModel = useFirmwareUpdateBannerViewModel({ old, right });

  if (context && context.version) {
    const { status } = context;
    if (VISIBLE_STATUS.includes(status)) return null;
  }

  return (
    <StyleProvider selectedPalette="dark">
      <FirmwareUpdateBannerContent {...viewModel} />
    </StyleProvider>
  );
};

export default FirmwareUpdateBannerEntry;

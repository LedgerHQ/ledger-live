import React from "react";
import {
  Box,
  NavBar,
  NavBarBackButton,
  NavBarContent,
  NavBarDescription,
  NavBarTitle,
  Spinner,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import SafeAreaView from "~/components/SafeAreaView";
import GenericErrorView from "~/components/GenericErrorView";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { useTranslation } from "~/context/Locale";
import type { LiveAppModalParams } from "~/reducers/liveAppModal";
import useLiveAppModalContentViewModel, {
  type ExtraInputs,
} from "./useLiveAppModalContentViewModel";
import useEarnLiveAppModalContentViewModel from "./useEarnLiveAppModalContentViewModel";
import type { LiveAppModalViewProps } from "./useLiveAppModalViewModel";

const appManifestNotFoundError = new Error("App not found");

const EmptyLoader = () => <Box />;

const LiveAppModalContent = ({
  params,
  onClose,
  extraInputs,
}: {
  params: LiveAppModalParams;
  onClose: () => void;
  extraInputs: ExtraInputs;
}) => {
  const { t } = useTranslation();
  const { title, description } = params;
  const {
    manifest,
    isManifestLoading,
    inputs,
    customHandlers,
    webviewAPIRef,
    onWebviewStateChange,
  } = useLiveAppModalContentViewModel(params, onClose, extraInputs);

  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
      },
      placeholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacings.s48,
      },
      headerContent: {
        marginTop: theme.spacings.s12,
      },
      webviewContainer: {
        flex: 1,
      },
    }),
    [],
  );

  if (!manifest) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
        <Box style={styles.placeholder}>
          {isManifestLoading ? <Spinner /> : <GenericErrorView error={appManifestNotFoundError} />}
        </Box>
      </SafeAreaView>
    );
  }

  // The live-app renders its own title/header, so when no native title is
  // passed we use the compact bar (back button only) to avoid the expanded
  // bar reserving an empty large-title area below the back button.
  const hasNativeHeader = Boolean(title || description);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
      <NavBar density={hasNativeHeader ? "expanded" : "compact"}>
        <NavBarBackButton onPress={onClose} accessibilityLabel={t("common.close")} />
        {hasNativeHeader ? (
          <NavBarContent style={styles.headerContent}>
            {title ? <NavBarTitle>{title}</NavBarTitle> : null}
            {description ? <NavBarDescription>{description}</NavBarDescription> : null}
          </NavBarContent>
        ) : null}
      </NavBar>
      <Box style={styles.webviewContainer}>
        <Web3AppWebview
          ref={webviewAPIRef}
          manifest={manifest}
          inputs={inputs}
          onStateChange={onWebviewStateChange}
          customHandlers={customHandlers}
          Loader={EmptyLoader}
        />
      </Box>
    </SafeAreaView>
  );
};

const EarnLiveAppModalContent = ({
  params,
  onClose,
}: {
  params: LiveAppModalParams;
  onClose: () => void;
}) => {
  const { extraInputs } = useEarnLiveAppModalContentViewModel();
  return <LiveAppModalContent params={params} onClose={onClose} extraInputs={extraInputs} />;
};

const LiveAppModalView = ({ params, onClose }: LiveAppModalViewProps) => {
  if (!params) return null;

  if (params.useCase === "earn") {
    return <EarnLiveAppModalContent params={params} onClose={onClose} />;
  }

  return <LiveAppModalContent params={params} onClose={onClose} extraInputs={null} />;
};

export default LiveAppModalView;

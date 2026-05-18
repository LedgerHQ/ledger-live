import React from "react";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import SafeAreaView from "~/components/SafeAreaView";
import GenericErrorView from "~/components/GenericErrorView";
import InfiniteLoader from "~/components/InfiniteLoader";
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
      header: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s12,
        paddingBottom: theme.spacings.s12,
      },
      backButton: {
        alignSelf: "flex-start",
        marginLeft: -theme.spacings.s12,
      },
      placeholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacings.s48,
      },
      title: {
        marginTop: theme.spacings.s12,
      },
      description: {
        marginTop: theme.spacings.s8,
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
          {isManifestLoading ? (
            <InfiniteLoader />
          ) : (
            <GenericErrorView error={appManifestNotFoundError} />
          )}
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
      <Box style={styles.header}>
        <IconButton
          appearance="no-background"
          size="md"
          icon={ArrowLeft}
          accessibilityLabel={t("common.close")}
          onPress={onClose}
          style={styles.backButton}
        />
        {title ? (
          <Text typography="heading3SemiBold" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text typography="body1" lx={{ color: "muted" }} style={styles.description}>
            {description}
          </Text>
        ) : null}
      </Box>
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

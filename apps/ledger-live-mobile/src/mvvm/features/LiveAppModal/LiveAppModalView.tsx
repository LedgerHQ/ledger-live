import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
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

const EmptyLoader = () => <View />;

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

  if (!manifest) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
        <Flex flex={1} justifyContent="center" alignItems="center" p={10}>
          {isManifestLoading ? (
            <InfiniteLoader />
          ) : (
            <GenericErrorView error={appManifestNotFoundError} />
          )}
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
      <Flex px={6} pt={4} pb={6}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          style={styles.backButton}
        >
          <IconsLegacy.ArrowLeftMedium size={24} />
        </Pressable>
        {title ? (
          <Text variant="h3" fontWeight="semiBold" mt={4}>
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text variant="body" color="neutral.c70" mt={2}>
            {description}
          </Text>
        ) : null}
      </Flex>
      <View style={styles.webviewContainer}>
        <Web3AppWebview
          ref={webviewAPIRef}
          manifest={manifest}
          inputs={inputs}
          onStateChange={onWebviewStateChange}
          customHandlers={customHandlers}
          Loader={EmptyLoader}
        />
      </View>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webviewContainer: {
    flex: 1,
  },
  backButton: {
    width: 24,
    height: 24,
  },
});

export default LiveAppModalView;

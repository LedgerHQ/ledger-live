import React, { ComponentProps, useState } from "react";
import { StyleSheet, ScrollView, Pressable } from "react-native";
import Modal from "react-native-modal";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Video from "react-native-video";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import Button from "../../../../components/Button";
import QueuedDrawer from "../../../../components/QueuedDrawer";
import Touchable from "../../../../components/Touchable";
import Check from "../../../../icons/Check";
import videos from "../../../../../assets/videos";

const entries = Object.entries(videos);
const edges: Edge[] = ["bottom"];

type ResizeMode = ComponentProps<typeof Video>["resizeMode"];

const DebugVideos = () => {
  const { colors } = useTheme();
  const [selectedIndex, setKeyIndex] = useState(0);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("contain");
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const key = entries[selectedIndex][0];
  const videoSource = entries[selectedIndex][1];

  const video = videoSource ? (
    <Video
      style={{ flex: 1, width: "100%" }}
      source={videoSource}
      disableFocus
      muted
      repeat
      resizeMode={resizeMode}
    />
  ) : null;

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Text my={4} alignSelf="center">
        {!key ? "Select video" : `Showing '${key}'`}
      </Text>
      <Text mb={4} color="neutral.c70" alignSelf="center">
        Tap on the video to display it in full screen
      </Text>
      <Modal style={{ margin: 0 }} coverScreen isVisible={fullScreen}>
        <Pressable style={{ flex: 1 }} onPress={() => setFullScreen(false)}>
          <Flex flex={1}>{video}</Flex>
        </Pressable>
      </Modal>
      <Pressable style={{ flex: 1 }} onPress={() => setFullScreen(true)}>
        <Flex flex={1} borderWidth={1}>
          {video}
        </Flex>
      </Pressable>
      <Flex p={3}>
        <Flex flexDirection="row" alignItems="center">
          <Text>Resize mode:</Text>
          {(["contain", "cover"] as ResizeMode[]).map(val => (
            <Button
              ml={3}
              type="primary"
              disabled={val === resizeMode}
              key={val}
              onPress={() => setResizeMode(val)}
            >
              {val}
            </Button>
          ))}
        </Flex>
        <Flex mt={3} flexDirection="row">
          <Button
            disabled={selectedIndex === 0}
            onPress={() => {
              setKeyIndex(Math.max(selectedIndex - 1, 0));
            }}
            type="primary"
            Icon={Icons.ChevronLeftMedium}
          />
          <Flex mx={3} flex={1}>
            <Button
              type="primary"
              title="Video key"
              onPress={() => setKeyModalVisible(true)}
            />
          </Flex>
          <Button
            disabled={selectedIndex === entries.length - 1}
            onPress={() => {
              setKeyIndex(Math.min(selectedIndex + 1, entries.length - 1));
            }}
            type="primary"
            Icon={Icons.ChevronRightMedium}
          />
        </Flex>
      </Flex>
      <QueuedDrawer
        isRequestingToBeOpened={keyModalVisible}
        onClose={setKeyModalVisible as () => void}
      >
        <ScrollView style={styles.modal}>
          {entries.map(([key], i) => (
            <Touchable
              key={i}
              onPress={() => {
                setKeyIndex(i);
                setKeyModalVisible(false);
              }}
              style={[styles.button]}
            >
              <Text
                {...(selectedIndex === i
                  ? {
                      semiBold: true,
                    }
                  : {})}
                style={[styles.buttonLabel]}
              >
                {key}
              </Text>
              {selectedIndex === i && <Check size={16} color={colors.live} />}
            </Touchable>
          ))}
        </ScrollView>
      </QueuedDrawer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  button: {
    height: 50,
    margin: 8,
    borderRadius: 4,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
    flexDirection: "row",
  },
  buttonLabel: {
    fontSize: 16,
  },
  modal: {
    padding: 8,
  },
});
export default DebugVideos;

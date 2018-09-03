/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { RNCamera } from "react-native-camera";
import {
  parseChunksReducer,
  areChunksComplete,
  chunksToResult,
} from "@ledgerhq/live-common/lib/bridgestream/importer";
import type { Result } from "@ledgerhq/live-common/lib/bridgestream/types";

export default class Scanning extends Component<{
  onResult: Result => void,
}> {
  lastData: ?string = null;
  chunks: * = [];
  completed: boolean = false;
  onBarCodeRead = ({ data }: { data: string }) => {
    if (data && data !== this.lastData && !this.completed) {
      this.lastData = data;
      this.chunks = parseChunksReducer(this.chunks, data);
      if (areChunksComplete(this.chunks)) {
        this.completed = true;
        // TODO read the chunks version and check it's correctly supported (if newers version, we deny the import with an error)
        this.props.onResult(chunksToResult(this.chunks));
      }
    }
  };

  render() {
    // TODO some instruction on screen + progress indicator
    return (
      <RNCamera style={styles.camera} onBarCodeRead={this.onBarCodeRead} />
    );
  }
}
const styles = StyleSheet.create({
  camera: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "stretch",
  },
});

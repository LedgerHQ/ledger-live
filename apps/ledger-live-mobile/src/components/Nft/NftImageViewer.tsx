import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ScreenName } from "~/const";
import type { NftNavigatorParamList } from "../RootNavigator/types/NftNavigator";
import type { StackNavigatorProps } from "../RootNavigator/types/helpers";
import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import Spinning from "../Spinning";
import BigSpinner from "~/icons/BigSpinner";
import ImageNotFoundIcon from "~/icons/ImageNotFound";

type Props = StackNavigatorProps<NftNavigatorParamList, ScreenName.NftImageViewer>;

const NftImageViewer = ({ route }: Props) => {
  const { params } = route;
  const [hasErrored, setHasErrored] = useState(false);

  return (
    <>
      {hasErrored ? (
        <View style={styles.error}>
          <ImageNotFoundIcon width={40} height={40} />
        </View>
      ) : (
        <ImageZoom
          uri={params.metadata.medias.original.uri}
          minScale={1}
          maxScale={3}
          onError={() => {
            setHasErrored(true);
          }}
          renderLoader={() => (
            <View style={styles.loader}>
              <Spinning clockwise>
                <BigSpinner />
              </Spinning>
            </View>
          )}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NftImageViewer;

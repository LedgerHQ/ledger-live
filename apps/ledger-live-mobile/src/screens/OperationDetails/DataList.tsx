import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import { withTheme, Theme } from "../../colors";

type Props = {
  data: string[];
  title?: React.ReactNode;
  rightComp?: React.ReactNode;
  colors: Theme["colors"];
};

const DataList = ({ data, title, rightComp, colors }: Props) => {
  const [showAll, setShowAll] = useState(false);

  const toggleShowAll = () => {
    setShowAll(showAll => !showAll);
  };

  const numToShow = 2;
  const shouldShowMore = data.length > numToShow;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
        }}
      >
        {title ? (
          <LText style={styles.sectionTitle} color="grey">
            {title}
          </LText>
        ) : null}
        {rightComp || null}
        {shouldShowMore && (
          <Touchable
            event="OperationDetailsShowMore"
            onPress={() => {
              toggleShowAll();
            }}
          >
            {showAll ? (
              <LText
                style={{
                  color: colors.live,
                }}
              >
                <Trans i18nKey="operationDetails.seeLess" />
              </LText>
            ) : (
              <LText
                style={{
                  color: colors.live,
                }}
              >
                <Trans i18nKey="operationDetails.seeAll" />
              </LText>
            )}
          </Touchable>
        )}
      </View>
      {(shouldShowMore ? data.slice(0, numToShow) : data).map(line => (
        <LText style={styles.value} semiBold selectable key={line}>
          {line}
        </LText>
      ))}
      {showAll &&
        data.slice(numToShow).map(line => (
          <LText style={styles.value} semiBold selectable key={line}>
            {line}
          </LText>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    marginRight: 8,
  },
  value: {},
});
export default withTheme(DataList);

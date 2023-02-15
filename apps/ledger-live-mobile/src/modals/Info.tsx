import React from "react";
import { StyleSheet, View } from "react-native";
import QueuedDrawer from "../components/QueuedDrawer";
import LText, { Opts } from "../components/LText";

type Props = {
  data: ModalInfo[];
  isOpened: boolean;
  onClose: () => void;
};
export type ModalInfo = {
  description?: React.ReactNode;
  Icon?: () => React.ReactElement<
    React.ComponentProps<React.ElementType>,
    React.ElementType
  >;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  titleProps?: Opts;
  descriptionProps?: Opts;
};
export default function InfoModal({ data, isOpened, onClose }: Props) {
  return (
    <QueuedDrawer
      style={styles.root}
      isRequestingToBeOpened={isOpened}
      onClose={onClose}
    >
      {data.map(
        (
          {
            description,
            Icon,
            title,
            footer,
            titleProps = {},
            descriptionProps = {},
          },
          i,
        ) => (
          <View style={styles.section} key={i}>
            <View style={styles.header}>
              {Icon && (
                <View style={styles.iconWrapper}>
                  <Icon />
                </View>
              )}
              {title ? (
                <LText style={styles.title} semiBold secondary {...titleProps}>
                  {title}
                </LText>
              ) : null}
            </View>
            {description ? (
              <LText color="grey" {...descriptionProps}>
                {description}
              </LText>
            ) : null}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        ),
      )}
    </QueuedDrawer>
  );
}
const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  section: {
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    flex: 1,
  },
  footer: {
    marginTop: 12,
  },
});

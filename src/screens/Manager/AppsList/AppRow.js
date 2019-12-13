import React, { useCallback } from "react";

import { View, StyleSheet, TouchableOpacity } from 'react-native';

import {
    formatSize,
} from '@ledgerhq/live-common/lib/apps'
import type { ApplicationVersion } from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import colors from "../../../colors";
import LText from "../../../components/LText";
import AppIcon from './AppIcon';

import AppInstallButton from './AppInstallButton';

const AppRow = ({
    app,
    dispatch,
}) => {
    const {
        name,
        version,
        bytes,
        icon
    } = app;
    return (
        <View style={styles.root}>
            <AppIcon icon={icon} />
            <View style={styles.labelContainer}>
                <LText numberOfLines={1} bold>{name}</LText>
                <LText numberOfLines={1} style={styles.versionText}>{version}</LText>
            </View>
            <LText style={[styles.versionText, styles.sizeText]}>{formatSize(bytes || 0)}</LText>
            <AppInstallButton {...app} dispatch={dispatch} />
        </View>
    )
};


const styles = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.white,
        borderRadius: 0,
        height: 64,
    },
    labelContainer: {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: "40%",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
    versionText: {
        fontSize: 12,
        fontWeight: "bold",
        color: colors.grey,
    },
    sizeText: {
        fontSize: 12,
        width: 44,
        marginHorizontal: 10,
    },
    installedLabel: {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: "auto",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        borderRadius: 4,
        overflow: "hidden",
        paddingHorizontal: 10,
    },
    installedText: {
        paddingLeft: 10,
        color: colors.green
    },
    appButton: {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: "auto",
        alignItems: "flex-start",
        height: 38,
        paddingHorizontal: 10,
        paddingVertical: 12,
        zIndex: 5,
    }
});

export default AppRow;

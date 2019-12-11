import React, { PureComponent } from "react";

import { View, StyleSheet } from 'react-native';

import { Trans } from "react-i18next";

import {
    formatSize,
} from '@ledgerhq/live-common/lib/apps'
import type { ApplicationVersion } from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import colors from "../../../colors";
import Check from "../../../icons/Check";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import AppIcon from './AppIcon';

const APP_CAN_UPDATE = 2;
const APP_INSTALLED = 1;
const APP_INSTALLABLE = 0;

export default class AppRow extends PureComponent {

    get appState() {
        const { installed, canUpdate } = this.props;

        return !installed
            ? APP_INSTALLABLE
            : canUpdate
                ? APP_CAN_UPDATE
                : APP_INSTALLED;
    }

    renderAppState() {
        const appState = this.appState;

        if (appState === APP_INSTALLED) {
            return (
                <View style={styles.installedLabel}>
                    <Check color={colors.green} />
                    <LText style={[styles.installedText]} >{<Trans i18nKey="common.installed" />}</LText>
                </View>
            );
        }

        return (
            <Button
                useTouchable
                type={appState === APP_CAN_UPDATE ? "primary" : "lightPrimary"}
                title={<Trans i18nKey={appState === APP_CAN_UPDATE ? "common.update" : "common.install"} />}
                containerStyle={styles.appButton}
                onPress={() => { }}
            />
        )
    }

    render() {
        const { app } = this.props;

        return (
            <View style={styles.root}>
                <AppIcon icon={app.icon} />
                <View style={styles.labelContainer}>
                    <LText numberOfLines={1} bold>{app.name}</LText>
                    <LText numberOfLines={1} style={styles.versionText}>{app.version}</LText>
                </View>
                <LText style={[styles.versionText, styles.sizeText]}>{formatSize(app.bytes || 0)}</LText>
                {this.renderAppState()}
            </View>
        )
    }
}


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
        paddingVertical: 12
    }
})
import React, { memo, useCallback } from 'react';
import { StyleSheet, View, TouchableHighlight } from 'react-native';

import { Trans } from "react-i18next";

import colors from "../../../colors";
import Check from "../../../icons/Check";
import CloseCircle from "../../../icons/CloseCircle";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import ProgressBar from "../../../components/ProgressBar";

const InstallProgress = memo(({ progress, isInstalling, onCancel }) => {
    const color = isInstalling ? colors.live : colors.alert;
    return (
        <View style={styles.progressContainer} >
            <View style={styles.progressLabel}>
                <LText semiBold style={[styles.appStateText, { color }]}>
                    <Trans i18nKey={isInstalling ? "AppAction.install.loading.button" : "AppAction.uninstall.loading.button"} />
                </LText>
                {!progress && (
                    <TouchableHighlight style={styles.progressCloseButton} onPress={onCancel} underlayColor={colors.lightFog}>
                        <CloseCircle style={styles.progressCloseIcon} color={color} size={14} />
                    </TouchableHighlight>
                )}
            </View>
            <ProgressBar progressColor={color} style={{ flexShrink: 0, flexGrow: 0, flexBasis: 6 }} height={6} progress={progress * 1e2} />
        </View>
    );
})

const AppInstallButton = ({
    name,
    installed,
    canUpdate,
    installing,
    uninstalling,
    progress,
    error,
    dispatch,
}) => {

    const uninstallApp = useCallback(() => {
        dispatch({ type: 'uninstall', name })
    }, [dispatch, name]);

    const installApp = useCallback(() => {
        dispatch({ type: 'install', name })
    }, [dispatch, name]);

    const renderAppState = () => {
        switch (true) {
            case error:
                return <LText style={[styles.installedText]} >Error</LText>;
            case installed:
                return (
                    <View style={styles.installedLabel}>
                        <Check color={colors.green} />
                        <LText semiBold style={[styles.installedText, styles.appStateText]} >
                            {<Trans i18nKey="common.installed" />}
                        </LText>
                    </View>
                );
            case installing:
            case uninstalling:
                return <InstallProgress
                    progress={progress}
                    isInstalling={installing}
                    onCancel={uninstallApp}
                />;
            default:
                return (
                    <Button
                        useTouchable
                        type={canUpdate ? "tertiary" : "lightPrimary"}
                        outline={!canUpdate}
                        title={<Trans i18nKey={canUpdate ? "common.update" : "common.install"} />}
                        containerStyle={styles.appButton}
                        titleStyle={styles.appStateText}
                        onPress={installApp}
                    />
                );
        }
    };

    return (
        <View style={styles.root}>
            {renderAppState()}
        </View>
    )
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    appStateText: {
        fontSize: 12,
    },
    installedLabel: {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: "auto",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
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
        flexBasis: "auto",
        alignItems: "flex-start",
        height: 38,
        paddingHorizontal: 10,
        paddingVertical: 12,
        zIndex: 5,
    },
    progressContainer: {
        flexDirection: "column",
        zIndex: 10,
        width: '100%',
        height: 38,
        backgroundColor: colors.white
    },
    progressLabel: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: colors.white
    },
    progressCloseButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: 28,
    }
});

export default memo(AppInstallButton);

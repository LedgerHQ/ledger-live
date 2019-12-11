// TODO fill me up!
/* @flow */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FlatList } from 'react-navigation';
import i18next from "i18next";
import AppRow from './AppRow';
import colors from "../../../colors";
import Search from "../../../icons/Search";
import Filters from "../../../icons/Filters";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextInput"

import type {
    DeviceInfo,
    ApplicationVersion,
} from "@ledgerhq/live-common/lib/types/manager";

const renderRow = ({ item }: { item: ApplicationVersion }) => (
    <AppRow app={item} />
);

const keyExtractor = (d: ApplicationVersion) => String(d.id);

const AppList = ({ appsList }) => {

    const separator = () => <View style={styles.separator}/>

    const searchBar = (
        <View
            style={[styles.searchBar]}
        >
            <View style={styles.searchBarInput}>
                <View style={styles.searchBarIcon}>
                    <Search size={16} color={colors.smoke} />
                </View>
                <TextInput
                    style={styles.searchBarTextInput}
                    containerStyle={styles.searchBarTextInput}
                    placeholder={i18next.t("manager.appList.searchApps")}
                    placeholderTextColor={colors.smoke}
                    clearButtonMode="always"
                />
            </View>
            <Button
                containerStyle={styles.searchBarFilters}
                type="darkSecondary"
                IconLeft={Filters}
                onPress={() => {}}
            />
        </View>
    );

    return (
        <View style={[styles.root]}>
            { searchBar }
            <FlatList
                style={styles.listStyle}
                data={appsList}
                ItemSeparatorComponent={separator}
                renderItem={renderRow}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: "column",
        borderRadius: 4,
    },
    separator: {
        height: 1,
        width: "100%",
        backgroundColor: colors.lightFog,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: colors.lightFog,
        backgroundColor: colors.white,
        borderRadius: 0,
        height: 64,
    },
    searchBarIcon: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
    },
    searchBarInput: {
        flexGrow: 1,
        flexDirection: "row",
        height: 38,
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: colors.lightGrey,
        borderRadius: 3

    },
    searchBarTextInput: { 
        flex: 1,
        fontSize: 14,
        color: colors.smoke
    },
    searchBarFilters: {
        width: 40,
        height: 38,
        marginLeft: 10,
    },
})

export default AppList;
// TODO fill me up!
/* @flow */
import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlatList } from 'react-navigation';
import { Trans } from 'react-i18next';
import i18next from "i18next";
import AppRow from './AppRow';
import AppFilter from './AppFilter';
import colors from "../../../colors";
import SearchIcon from "../../../icons/Search";

import TextInput from "../../../components/TextInput"
import Search from "../../../components/Search";

import type {
    DeviceInfo,
        ApplicationVersion,
} from "@ledgerhq/live-common/lib/types/manager";

const keyExtractor = (d: ApplicationVersion) => String(d.id);

const separator = () => <View style={styles.separator} />

const renderNoResults = () => (
    <Text style={styles.noResultText}>
        <Trans i18nKey="manager.appList.noApps" />
    </Text>
);

const AppList = ({
    appsList,
    dispatch,
}) => {
    const [query, queryUpdate] = useState('');

    const searchBar = (
        <View style={styles.searchBar}>
            <View style={styles.searchBarInput}>
                <View style={styles.searchBarIcon}>
                    <SearchIcon size={16} color={colors.smoke} />
                </View>
                <TextInput
                    style={styles.searchBarTextInput}
                    containerStyle={styles.searchBarTextInput}
                    placeholder={i18next.t("manager.appList.searchApps")}
                    placeholderTextColor={colors.smoke}
                    clearButtonMode="always"
                    onInputCleared={() => queryUpdate("")}
                    onChangeText={queryUpdate}
                    value={query}
                    numberOfLines={1}
                />
            </View>
            <AppFilter dispatch={dispatch} />
        </View>
    );

    const renderRow = ({ item }: { item: ApplicationVersion }) => (
        <AppRow
            app={item}
            dispatch={dispatch}
        />
    );

    const renderList = (data) => (
        <FlatList
            style={styles.listStyle}
            data={data}
            ItemSeparatorComponent={separator}
            renderItem={renderRow}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
        />
    );

    return (
        <View style={[styles.root]}>
            {searchBar}
            <Search
                fuseOptions={{
                    threshold: 0.1,
                    keys: ['name'],
                }}
                value={query}
                items={appsList}
                render={renderList}
                renderEmptySearch={renderNoResults}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: "column",
        borderRadius: 4,
        backgroundColor: colors.white,
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
        color: colors.smoke,
        height: 38,
    },
    noResultText: {
        textAlign: "center",
        paddingVertical: 26,
        color: colors.smoke,
    }
})

export default AppList;
import React, { memo, useMemo, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, SectionList, View, TouchableHighlight } from 'react-native';
import Filters from "../../../icons/Filters";
import Check from "../../../icons/Check";
import Button from "../../../components/Button";
import colors from "../../../colors";
import BottomModal from "../../../components/BottomModal";
import LText from "../../../components/LText";

const filterSections = [
    {
        title: 'Filters',
        data: [{
            label: 'All',
            value: 'ALL',
            isFilter: true
        }, {
            label: 'Not installed',
            value: 'NOT_INSTALLED',
            isFilter: true
        }, {
            label: 'Live supported',
            value: 'LIVE',
            isFilter: true
        }],
        footerSeparator: true,
    },
    {
        title: 'Sort by',
        data: [{
            label: 'Market Cap',
            value: 'MARKET_CAP',
        }, {
            label: 'Name',
            value: 'NAME',
        }, {
            label: 'Weight',
            value: 'WEIGHT',
        }, {
            label: 'Dependencies',
            value: 'DEPENDENCIES',
        }],
    },
];

const keyExtractor = (item, index) => item + index;

const SectionHeader = ({ section: { title } }) => (
    <View style={[styles.sectionLine, styles.paddingLine]}>
        <LText style={styles.sectionHeader}>{title}</LText>
    </View >
);

const Separator = ({ section: { footerSeparator } }) => Boolean(footerSeparator) &&
    <View style={styles.paddingLine}>
        <View style={styles.separator} />
    </View>

const AppFilter = ({
    dispatch
}) => {
    const [isOpened, openModal] = useState(false);
    const [selectedFilters, selectFilters] = useState([]);
    const [selectedSort, sortBy] = useState(null);

    const toggleFilter = useCallback((value) => {
        const filters = [].concat(selectedFilters);
        const index = filters.indexOf(value);

        if (index >= 0) filters.splice(index, 1);
        else filters.push(value);

        selectFilters(filters);
    }, [selectedFilters, selectFilters]);

    const toggleModal = useCallback((value) => () => {
        openModal(value);
    }, [openModal]);

    const FilterItem = useCallback(({ item: { label, value, isFilter } }) => {
        const isChecked = isFilter
            ? selectedFilters.indexOf(value) >= 0
            : selectedSort === value;

        return (
            <TouchableHighlight
                style={[styles.sectionLine, styles.paddingLine]}
                underlayColor={colors.lightFog}
                onPress={() => isFilter ? toggleFilter(value) : sortBy(value)}
            >
                <>
                    <LText bold={isChecked} style={styles.filterName}>{label}</LText>
                    {
                        Boolean(isChecked) && (
                            <View style={styles.checkIcon}>
                                <Check color={colors.live} size={14} />
                            </View>
                        )
                    }
                </>
            </TouchableHighlight>
        );
    });

    return (
        <>
            <Button
                containerStyle={styles.searchBarFilters}
                type="darkSecondary"
                IconLeft={Filters}
                onPress={toggleModal(true)}
            />
            <BottomModal
                isOpened={isOpened}
                onClose={toggleModal(false)}
                containerStyle={styles.modal}
            >
                <SafeAreaView style={styles.root}>
                    <SectionList
                        sections={filterSections}
                        keyExtractor={keyExtractor}
                        renderItem={FilterItem}
                        renderSectionHeader={SectionHeader}
                        renderSectionFooter={Separator}
                    />
                </SafeAreaView>
            </BottomModal>
        </>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: "column",
        paddingVertical: 36,
    },
    modal: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    searchBarFilters: {
        width: 40,
        height: 38,
        marginLeft: 10,
    },
    sectionLine: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: '100%',
        height: 41,
        paddingVertical: 12,
    },
    sectionHeader: {
        fontSize: 11,
        color: colors.grey,
        textTransform: 'uppercase',
    },
    filterName: {
        fontSize: 14,
    },
    paddingLine: {
        paddingHorizontal: 20,
    },
    checkIcon: {
        width: 32,
        alignItems: "center",
        justifyContent: "center"
    },
    separator: {
        width: "100%",
        height: 1,
        backgroundColor: colors.lightFog
    }
})


export default memo(AppFilter);
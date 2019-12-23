import React, { memo, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Filters from '../../../icons/Filters';
import Button from '../../../components/Button';
import colors from '../../../colors';

import FilterModalComponent from '../Modals/FilterModal';

const AppFilter = ({
    dispatch,
    disabled,
}) => {
    const [isOpened, openModal] = useState(false);
    const toggleModal = useCallback((value) => () => openModal(value), [openModal]);

    return (
        <>
            <Button
                containerStyle={styles.searchBarFilters}
                type='darkSecondary'
                IconLeft={Filters}
                onPress={toggleModal(true)}
                disabled={disabled}
            />
            <FilterModalComponent isOpened={!disabled && isOpened} onClose={toggleModal(false)} onFilter={toggleModal(false)} />
        </>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'column',
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        alignItems: 'center',
        justifyContent: 'center'
    },
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: colors.lightFog
    }
})


export default memo(AppFilter);
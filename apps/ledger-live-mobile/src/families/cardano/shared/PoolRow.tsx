import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import { Text } from "@ledgerhq/native-ui";
import Touchable from "~/components/Touchable";
import PoolImage from "./PoolImage";

const PoolRow = ({ onPress, pool }: { onPress: (v: StakePool) => void; pool: StakePool }) => {
  const onPressT = useCallback(() => {
    onPress(pool);
  }, [pool, onPress]);

  return (
    <Touchable
      event="DelegationFlowChosePool"
      eventProperties={{
        poolName: pool.name || pool.poolId,
      }}
      onPress={onPressT}
    >
      <View style={styles.pool}>
        <PoolImage size={32} name={pool.name ?? pool.poolId} />
        <View style={styles.poolBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.poolName}>
            {`${pool.ticker} - ${pool.name}`}
          </Text>
          <Text fontWeight="medium" numberOfLines={1} style={styles.overdelegated}>
            <Trans i18nKey="cardano.delegation.commission" /> <Text>{pool.margin} %</Text>
          </Text>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  pool: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  poolBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  poolName: {
    fontSize: 14,
  },
  overdelegatedIndicator: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
    marginTop: 3,
  },
});

export default PoolRow;

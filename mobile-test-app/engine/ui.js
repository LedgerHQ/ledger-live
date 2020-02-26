// @flow

import React, { useEffect, useState, useReducer, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity
} from "react-native";
import { initialState, reducer, runTests } from "./runner";
import type { Node } from "./runner";

const colors = {
  success: "#0C0",
  done: "#bbb",
  failure: "#C00",
  pending: "#888",
  running: "#333"
};

const allStatuses = node => {
  // $FlowFixMe
  if (node.children.length === 0) return [node.status];
  // $FlowFixMe
  return node.children.map(allStatuses).flat();
};

const groupStatus = node => {
  const all = allStatuses(node);
  const pending = all.filter(a => a === "pending").length;
  const failure = all.filter(a => a === "failure").length;
  const success = all.filter(a => a === "success").length;
  const status = failure > 0 ? "failure" : pending > 0 ? "pending" : all[0];
  return {
    status,
    total: all.length,
    pending,
    failure,
    success
  };
};

const generalStatus = nodes => groupStatus({ children: nodes }).status;

const ViewNode = ({ node, topLevel }: { node: Node, topLevel?: boolean }) => {
  const [collapsed, setCollapsed] = useState(false);

  const stats = groupStatus(node);
  const status = stats.status;

  useEffect(() => {
    if (!collapsed && status === "success") {
      setCollapsed(true);
    }
  }, [status]);

  return (
    <View
      style={{
        flexDirection: "column",
        marginTop: 1,
        padding: topLevel ? 8 : 2
      }}
    >
      <TouchableOpacity
        style={{
          borderBottomWidth: topLevel ? 2 : 0,
          borderBottomColor: colors[status]
        }}
        onPress={() => {
          setCollapsed(!collapsed);
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={{
              fontWeight: topLevel ? "bold" : "normal",
              color: colors[status]
            }}
          >
            {collapsed ? "+" : "-"} {node.name}
          </Text>
          {!topLevel ? null : (
            <View style={{ flexDirection: "row" }}>
              {!stats.failure ? null : (
                <Text
                  style={{
                    fontWeight: "bold",
                    color: colors.failure,
                    marginRight: 4
                  }}
                >
                  {stats.failure} errors
                </Text>
              )}

              <Text
                style={{
                  fontWeight: "bold",
                  color: colors[status]
                }}
              >
                {stats.success} / {stats.total}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <Text style={{ color: "#c22" }}>
        {node.error ? String(node.error) : null}
      </Text>
      {node.children.length === 0 ? null : (
        <View
          style={{
            flexDirection: "column",
            paddingLeft: 10,
            paddingBottom: 10,
            display: collapsed ? "none" : "flex"
          }}
        >
          {node.children.map((node, i) => (
            <ViewNode node={node} key={i} />
          ))}
        </View>
      )}
    </View>
  );
};

const App = ({ testFiles }: *) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    dispatch({ type: "begin", testFiles });
    runTests(testFiles, dispatch)
      .catch(error => {
        dispatch({ type: "error", error });
      })
      .then(result => {
        dispatch({ type: "finish", result });
      });
  }, [testFiles, dispatch]);

  const renderItem = useCallback(({ item }) => (
    <ViewNode topLevel node={item} />
  ));

  const status = generalStatus(state.tree) || "pending";

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 20,
          alignItems: "center",
          backgroundColor: colors[status]
        }}
      >
        <SafeAreaView>
          <Text style={{ fontWeight: "bold", color: "#fff", fontSize: 18 }}>
            {status} OVERALL
          </Text>
        </SafeAreaView>
      </View>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          style={{ flex: 1 }}
          data={state.tree}
          renderItem={renderItem}
          keyExtractor={t => t.name}
        />
      </SafeAreaView>
    </View>
  );
};

export default App;

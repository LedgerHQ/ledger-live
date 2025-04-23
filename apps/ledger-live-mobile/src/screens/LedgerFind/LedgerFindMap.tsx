import React, { useEffect, useState } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Flex, Text, Log } from "@ledgerhq/native-ui";

const API_SERVER = "https://api.ledger.fr";

export const LedgerFindMap = () => {
  const longitude = -122.4324;
  const latitude = 37.78825;
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`${API_SERVER}/get_reports?last=true`);
        const data = await res.json();
        if (data && data.length > 0) {
          const { latitude, longitude } = data[0];
          setLocation({ latitude, longitude });
        }
      } catch (e) {
        console.warn("Failed to fetch location:", e);
      }
    };

    fetchLocation();
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: "black" }]}>
      <Text variant="h4" style={{ color: "white" }}>
        {"Ledger Find"}
      </Text>
      <Text variant="h4" style={{ color: "white" }}>
        {"Ledger Find"}
      </Text>
      <Text variant="h4" style={{ color: "white" }}>
        {"Ledger Find"}
      </Text>
      <Text variant="h4" style={{ color: "white" }}>
        {"Ledger Find"}
      </Text>
      <Text variant="h4" style={{ color: "white" }}>
        {"Ledger Find"}
      </Text>
      <Text variant="h4" style={{ color: "white" }}>{`HARDCODED Longitude: ${longitude}`}</Text>
      <Text variant="h4" style={{ color: "white" }}>{`HARDCODED Latitude: ${latitude}`}</Text>
      {location ? (
        <>
          <Text variant="h4" style={{ color: "white" }}>{`Longitude: ${location.longitude}`}</Text>
          <Text variant="h4" style={{ color: "white" }}>{`Latitude: ${location.latitude}`}</Text>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={location} title="Ledger Device" />
          </MapView>
        </>
      ) : (
        <Text variant="h5" style={{ color: "white" }}>
          {"Loading location…"}
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude,
                longitude,
              }}
              title="Ledger Device"
            />
          </MapView>
        </Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

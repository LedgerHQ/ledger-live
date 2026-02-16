import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { localeSelector } from "~/reducers/settings";

function UserProfileScreen() {
  const navigation = useNavigation();
  const locale = useSelector(localeSelector);

  const isLoading = false;
  const isError = false;

  const profile = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatarUrl: undefined,
    createdAt: new Date().toLocaleDateString(locale),
  };

  const handleEditPress = () => {
    navigation.goBack();
  };

  const handleLogoutPress = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{profile.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Member since</Text>
          <Text style={styles.value}>{profile.createdAt}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>{locale}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
  editButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserProfileScreen;

import { Icons } from "@ledgerhq/native-ui";
import React from "react";
import { Pressable, StyleSheet, Text, View, ScrollView, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.6;

export type ExampleCardProps = {
  id: number;
  from: string;
  amount: number;
  amountUsd: number;
  to: string;
  approvals: number;
  totalApprovals: number;
  expiresIn: number;
};

export function ExampleCard({ card }: { card: ExampleCardProps }) {
  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.label}>{"From"}</Text>
        <View style={styles.fromContainer}>
          <Icons.IdCard color="neutral.c00" />
          <Text style={styles.fromText}>{card.from}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{"Send"}</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.btcAmount}>{card.amount.toFixed(3)} BTC</Text>
          <Text style={styles.usdAmount}>$ {card.amountUsd.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{"To"}</Text>
        <Text style={styles.toAddress}>{card.to}</Text>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.approvalText}>
          {`${card.approvals} of ${card.totalApprovals} Approvals`}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(card.approvals / card.totalApprovals) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.expiryContainer}>
          <Icons.Calendar color="neutral.c00" />
          <Text style={styles.expiryText}>{`Expires in ${card.expiresIn} days`}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.rejectButton}>
          <Icons.DeleteCircle color="neutral.c00" />
          <Text style={styles.buttonText}>{"reject"}</Text>
        </Pressable>
        <Pressable style={styles.reviewButton}>
          <Icons.Eye color="neutral.c100" />
          <Text style={[styles.buttonText, styles.reviewButtonText]}>{"Review"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: "#71717a",
    fontSize: 16,
    marginBottom: 8,
  },
  fromContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fromText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  amountContainer: {
    flexDirection: "column",
    gap: 4,
  },
  btcAmount: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  usdAmount: {
    color: "#71717a",
    fontSize: 18,
  },
  toAddress: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "monospace",
  },
  progressSection: {
    gap: 12,
  },
  approvalText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#3f3f46",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expiryText: {
    color: "#71717a",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 100,
    paddingVertical: 12,
  },
  reviewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 100,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  reviewButtonText: {
    color: "#000",
  },
});

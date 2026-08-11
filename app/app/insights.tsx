// app/insights.tsx
// Reads from global state if we arrived from upload/preview; otherwise
// (arrived from a History item) expects the caller to have already called
// getRecord and set currentRecord — see history/[id].tsx.

import { View, Text, ScrollView } from "react-native";
import { useAppStore } from "../lib/store";

export default function InsightsScreen() {
  const record = useAppStore((s) => s.currentRecord);

  if (!record) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>No insights to show yet.</Text>
      </View>
    );
  }

  const { insights } = record;

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Summary</Text>
      <Text style={{ marginBottom: 16 }}>{insights.summary}</Text>

      <Text style={{ fontSize: 16, fontWeight: "600" }}>Top Items</Text>
      {/* Person 1: swap this for the real bar chart component */}
      {insights.top_items.map((t) => (
        <Text key={t.item}>
          {t.item}: {t.total_sales}
        </Text>
      ))}

      <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 16 }}>Predictions</Text>
      {insights.predictions.map((p) => (
        <Text key={p.item}>
          {p.item}: ~{p.predicted_demand_next_week} next week
        </Text>
      ))}

      {insights.alerts.length > 0 && (
        <>
          <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 16, color: "#b45309" }}>
            Alerts
          </Text>
          {insights.alerts.map((a, i) => (
            <Text key={i} style={{ color: "#b45309" }}>
              ⚠ {a}
            </Text>
          ))}
        </>
      )}
    </ScrollView>
  );
}

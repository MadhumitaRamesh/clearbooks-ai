// app/index.tsx — Home/Dashboard
// Navigation + data wiring only. Person 1 owns the visual design of this
// screen — swap the View/Text/TouchableOpacity below for their components,
// keep the router.push calls and the useEffect data fetch.

import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getDashboard } from "../lib/backend";
import type { DashboardData } from "../lib/types";

export default function Home() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    getDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.message ?? "Couldn't load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(loadDashboard, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/upload", params: { mode: "image" } })}
        style={{ padding: 20, backgroundColor: "#2563eb", borderRadius: 12 }}
      >
        <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>Upload Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push({ pathname: "/upload", params: { mode: "audio" } })}
        style={{ padding: 20, backgroundColor: "#16a34a", borderRadius: 12 }}
      >
        <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>Record Voice</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/history")}>
        <Text style={{ textAlign: "center", marginTop: 8 }}>View History</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator />}
      {error && (
        <View>
          <Text style={{ color: "red" }}>{error}</Text>
          <TouchableOpacity onPress={loadDashboard}>
            <Text style={{ color: "#2563eb" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {dashboard && (
        <View style={{ padding: 16, backgroundColor: "#f3f4f6", borderRadius: 12 }}>
          <Text style={{ fontWeight: "600" }}>Insights</Text>
          <Text>{dashboard.summary}</Text>
        </View>
      )}
    </View>
  );
}

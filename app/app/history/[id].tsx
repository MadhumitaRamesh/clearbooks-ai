// app/history/[id].tsx — Record detail (History -> here)
// Fetches the full record, stores it, then reuses the Insights + Preview
// screens' rendering by pushing to them — avoids duplicating that UI.

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getRecord } from "../../lib/backend";
import { useAppStore } from "../../lib/store";

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const setCurrentRecord = useAppStore((s) => s.setCurrentRecord);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRecord(id)
      .then((record) => {
        setCurrentRecord(record);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Couldn't load this record");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  if (error) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <TouchableOpacity onPress={() => router.push("/preview")}>
        <Text style={{ color: "#2563eb" }}>View extracted data</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/insights")}>
        <Text style={{ color: "#2563eb" }}>View insights</Text>
      </TouchableOpacity>
    </View>
  );
}

// app/history/index.tsx — History
// Fetches the record list on mount, navigates to history/[id] on tap.

import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getHistory } from "../../lib/backend";
import type { RecordListItem } from "../../lib/types";

const STATUS_COLOR: Record<string, string> = {
  pending: "#9ca3af",
  processing: "#f59e0b",
  done: "#16a34a",
  failed: "#dc2626",
};

export default function History() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getHistory()
      .then(setRecords)
      .catch((err) => setError(err.message ?? "Couldn't load history"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  if (error) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
        <TouchableOpacity onPress={load}>
          <Text style={{ color: "#2563eb" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={records}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/history/${item.id}`)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <Text>{item.source_type} · {new Date(item.created_at).toLocaleDateString()}</Text>
          <Text style={{ color: STATUS_COLOR[item.status], fontWeight: "600" }}>{item.status}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

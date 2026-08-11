// app/preview.tsx — Data Preview
// Reads the just-uploaded record from global state (set in upload.tsx) —
// no fetch needed here. Person 1 restyles this as a real table.

import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "../lib/store";

export default function Preview() {
  const router = useRouter();
  const record = useAppStore((s) => s.currentRecord);

  if (!record) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>No record to preview yet.</Text>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={{ color: "#2563eb" }}>Go home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
        Confirm extracted data
      </Text>
      <FlatList
        data={record.extracted.structured.transactions}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
            <Text>{item.item}</Text>
            <Text>
              {item.quantity} x {item.unit_price} = {item.total}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity
        onPress={() => router.push("/insights")}
        style={{ padding: 16, backgroundColor: "#2563eb", borderRadius: 12, marginTop: 16 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Looks good — see insights</Text>
      </TouchableOpacity>
    </View>
  );
}

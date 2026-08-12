import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Stack } from "expo-router";
import { ensureSession } from "../lib/supabase";
import { theme } from "../constants/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    ensureSession()
      .then(() => setReady(true))
      .catch((err) => setAuthError(err.message ?? "Could not sign in"));
  }, []);

  if (authError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.colors.background }}>
        <Text style={{ textAlign: "center", color: theme.colors.text }}>
          Couldn't connect: {authError}{"\n"}Check your internet connection and try again.
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: theme.colors.background }
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="upload" options={{ presentation: 'modal', title: 'Upload' }} />
      <Stack.Screen name="preview" options={{ title: 'Preview' }} />
      <Stack.Screen name="insights/[recordId]" options={{ title: 'Insights' }} />
    </Stack>
  );
}

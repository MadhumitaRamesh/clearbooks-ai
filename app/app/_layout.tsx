// app/_layout.tsx
// Root layout: signs the owner in anonymously on launch, then renders the
// stack. Screens under app/ don't need to worry about auth — by the time
// they mount, ensureSession() has already resolved once.

import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Stack } from "expo-router";
import { ensureSession } from "../lib/supabase";

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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ textAlign: "center" }}>
          Couldn't connect: {authError}{"\n"}Check your internet connection and try again.
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="history/index" />
      <Stack.Screen name="history/[id]" />
    </Stack>
  );
}

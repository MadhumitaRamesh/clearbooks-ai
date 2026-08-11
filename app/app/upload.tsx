// app/upload.tsx — Upload/Record screen
// Navigation + upload wiring only. Person 1 restyles the picker/mic UI;
// keep the uploadImage/uploadAudio calls, the processing state, and the
// router.replace on success (replace, not push, so back doesn't return here).

import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { uploadImage, uploadAudio, pollRecordUntilDone } from "../lib/backend";
import { useAppStore } from "../lib/store";

export default function Upload() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { isUploading, setIsUploading, uploadError, setUploadError } = useAppStore();

  const [status, setStatus] = useState<"idle" | "uploading" | "processing">("idle");

  async function handlePickImage() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;
    await runUpload(() => uploadImage(result.assets[0].uri));
  }

  // Person 4 note: wire the actual mic recorder (expo-av) here once
  // Person 1's Upload screen UI defines the recorder component's shape.
  async function handleRecordAudio(fileUri: string) {
    await runUpload(() => uploadAudio(fileUri));
  }

  async function runUpload(call: () => ReturnType<typeof uploadImage>) {
    setIsUploading(true);
    setUploadError(null);
    setStatus("uploading");
    try {
      const record = await call();
      setStatus("processing");
      const finished =
        record.record.status === "done" || record.record.status === "failed"
          ? record
          : await pollRecordUntilDone(record.record.id);

      useAppStore.getState().setCurrentRecord(finished);

      if (finished.record.status === "failed") {
        setUploadError("Processing failed — try again with a clearer photo or recording.");
        setStatus("idle");
        return;
      }
      router.replace("/preview");
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
      setStatus("idle");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 18 }}>{mode === "audio" ? "Record a voice note" : "Take a photo"}</Text>

      {status === "idle" && (
        <TouchableOpacity
          onPress={mode === "audio" ? () => {} : handlePickImage}
          style={{ padding: 20, backgroundColor: "#2563eb", borderRadius: 12 }}
        >
          <Text style={{ color: "white" }}>{mode === "audio" ? "Start Recording" : "Open Camera"}</Text>
        </TouchableOpacity>
      )}

      {(status === "uploading" || status === "processing") && (
        <View style={{ alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="large" />
          <Text>{status === "uploading" ? "Uploading..." : "Processing..."}</Text>
        </View>
      )}

      {uploadError && (
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={{ color: "red", textAlign: "center" }}>{uploadError}</Text>
          <TouchableOpacity onPress={mode === "audio" ? () => {} : handlePickImage}>
            <Text style={{ color: "#2563eb" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

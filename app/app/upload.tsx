import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { theme } from '../constants/theme';
import { uploadImage, uploadAudio, pollRecordUntilDone } from '../lib/backend';
import { useAppStore } from '../lib/store';

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = (event: string, callback: any) => {};

try {
  const STT = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = STT.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = STT.useSpeechRecognitionEvent;
} catch (e) {
  console.warn("expo-speech-recognition native module not found");
}

export default function UploadScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'image' | 'audio' }>();
  
  const { isUploading, setIsUploading, uploadError, setUploadError } = useAppStore();
  const [status, setStatus] = useState<"idle" | "uploading" | "processing">("idle");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");

  useSpeechRecognitionEvent('result', (event) => {
    setLiveTranscript(event.results[0]?.transcript || "");
  });
  
  // For audio pulsing animation
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [recording, pulseAnim]);

  const handleUploadImage = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert("Permission to access camera/gallery is required!");
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 1 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        runUpload(() => uploadImage(result.assets[0].uri));
      }
    } catch (e: any) {
      console.error(e);
      setUploadError(e.message ?? "Failed to open camera");
    }
  };

  const handleToggleAudio = async () => {
    try {
      if (recording) {
        setStatus("processing");
        setIsUploading(true);
        await recording.stopAndUnloadAsync();
        ExpoSpeechRecognitionModule?.stop();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
          runUpload(() => uploadAudio(uri));
        } else {
          setIsUploading(false);
          setUploadError("Failed to save recording");
          setStatus("idle");
        }
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setLiveTranscript("");
        
        try {
          if (ExpoSpeechRecognitionModule) {
            const sttPerm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (sttPerm.granted) {
              ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
              });
            }
          }
        } catch (sttErr) {
          console.warn("Live STT failed or not available in this client:", sttErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to start recording', err);
      setUploadError(err.message ?? "Failed to record");
    }
  };

  const runUpload = async (call: () => ReturnType<typeof uploadImage>) => {
    setIsUploading(true);
    setUploadError(null);
    setStatus("uploading");
    try {
      const record = await call();
      setStatus("processing");
      
      const finished = (record.record.status === "done" || record.record.status === "failed")
        ? record
        : await pollRecordUntilDone(record.record.id);

      useAppStore.getState().setCurrentRecord(finished);

      if (finished.record.status === "failed") {
        setUploadError("Processing failed — try again with a clearer photo or recording.");
        setStatus("idle");
        return;
      }
      
      router.replace("/preview");
    } catch (e: any) {
      console.error("Upload Error:", e);
      setUploadError(e.message ?? "Upload failed");
      setStatus("idle");
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading || status === "processing" || status === "uploading") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        <Text style={styles.processingText}>
          {status === "uploading" ? "Uploading..." : "Reading your record..."}
        </Text>
      </View>
    );
  }

  if (uploadError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{uploadError || "Something went wrong while processing."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setUploadError(null)}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {type === 'image' ? 'Upload Receipt' : 'Record Voice Note'}
      </Text>
      
      <View style={styles.content}>
        {type === 'image' ? (
          <>
            <TouchableOpacity style={styles.bigButton} onPress={() => handleUploadImage(true)}>
              <Text style={styles.bigIcon}>📸</Text>
              <Text style={styles.buttonLabel}>Take Photo</Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>- OR -</Text>
            
            <TouchableOpacity style={[styles.bigButton, styles.secondaryButton]} onPress={() => handleUploadImage(false)}>
              <Text style={styles.bigIcon}>🖼️</Text>
              <Text style={styles.buttonLabel}>Choose from Gallery</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.audioContainer}>
            <TouchableOpacity onPress={handleToggleAudio} activeOpacity={0.8}>
              <Animated.View style={[
                styles.micButton, 
                recording && styles.micButtonRecording,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <Text style={styles.micIcon}>{recording ? '⏹️' : '🎙️'}</Text>
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.recordingText}>
              {recording ? 'Recording... Tap to stop' : 'Tap to start recording'}
            </Text>
            {recording && liveTranscript ? (
              <Text style={styles.liveTranscriptText}>"{liveTranscript}"</Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.l,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    ...(theme.typography.h2 as any),
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bigButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
  },
  bigIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.m,
  },
  buttonLabel: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
  },
  orText: {
    ...(theme.typography.body as any),
    color: theme.colors.textLight,
    marginVertical: theme.spacing.xl,
  },
  audioContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: theme.colors.error,
    shadowColor: theme.colors.error,
  },
  micIcon: {
    fontSize: 64,
  },
  recordingText: {
    ...(theme.typography.body as any),
    color: theme.colors.textSecondary || theme.colors.textLight,
    marginTop: theme.spacing.xl,
  },
  liveTranscriptText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginTop: theme.spacing.m,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  loader: {
    marginBottom: theme.spacing.l,
    transform: [{ scale: 1.5 }],
  },
  processingText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.m,
  },
  errorText: {
    ...(theme.typography.body as any),
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  retryText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.surface,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { theme } from '../constants/theme';
import { mockUploadImage, mockUploadAudio } from '../lib/mockApi';

export default function UploadScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'image' | 'audio' }>();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
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
        processFile(result.assets[0].uri, 'image');
      }
    } catch (e) {
      console.error(e);
      setError(true);
    }
  };

  const handleToggleAudio = async () => {
    try {
      if (recording) {
        setProcessing(true);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
          processFile(uri, 'audio');
        } else {
          setProcessing(false);
          setError(true);
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
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setError(true);
    }
  };

  const processFile = async (uri: string, mode: 'image' | 'audio') => {
    setProcessing(true);
    setError(false);
    try {
      const response = mode === 'image' 
        ? await mockUploadImage(uri) 
        : await mockUploadAudio(uri);
      
      router.replace({ 
        pathname: '/preview', 
        params: { data: JSON.stringify(response) } 
      });
    } catch (e) {
      setProcessing(false);
      setError(true);
    }
  };

  if (processing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        <Text style={styles.processingText}>Reading your record...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Something went wrong while processing.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setError(false)}>
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
    shadowColor: '#000',
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

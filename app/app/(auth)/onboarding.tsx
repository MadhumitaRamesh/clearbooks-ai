import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem('shopName', shopName);
      await AsyncStorage.setItem('ownerName', ownerName);
    } catch (e) {
      console.error('Error saving to AsyncStorage', e);
    }
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.icon}>👋</Text>
          <Text style={styles.title}>Welcome to ClearBooks AI</Text>
          <Text style={styles.subtitle}>Digitize your shop's records with ease.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>What's your name?</Text>
          <TextInput 
            style={styles.input}
            placeholder="e.g. John Doe"
            placeholderTextColor={theme.colors.textLight}
            value={ownerName}
            onChangeText={setOwnerName}
          />

          <Text style={styles.label}>What's the name of your shop?</Text>
          <TextInput 
            style={styles.input}
            placeholder="e.g. Corner Store"
            placeholderTextColor={theme.colors.textLight}
            value={shopName}
            onChangeText={setShopName}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, (!shopName || !ownerName) && styles.buttonDisabled]} 
          onPress={handleStart}
          disabled={!shopName || !ownerName}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...(theme.typography.body as any),
    color: theme.colors.textSecondary || theme.colors.textLight,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.xxl,
  },
  label: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    ...(theme.typography.body as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.surface,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please enter your email and a password");
      return;
    }
    setLoading(true);
    setError('');
    
    // First try to sign in
    let { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    // If user doesn't exist, create an account
    if (authError && authError.message.includes("Invalid login credentials")) {
      const res = await supabase.auth.signUp({ email, password });
      data = res.data;
      authError = res.error;
    }
    
    if (authError || !data.session) {
      setLoading(false);
      setError(authError?.message || "Login failed. Ensure 'Confirm Email' is turned OFF in Supabase.");
      return;
    }

    // Check if profile exists
    const userId = data.session.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setLoading(false);
    
    if (!profile) {
      setStep('profile');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSaveProfile = async () => {
    if (!shopName || !ownerName) {
      setError("Please fill out both fields");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      
      if (userId) {
        await supabase.from('profiles').insert({
          id: userId,
          shop_name: shopName,
          owner_name: ownerName
        });
      }
      
      await AsyncStorage.setItem('shopName', shopName);
      await AsyncStorage.setItem('ownerName', ownerName);
      
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.icon}>{step === 'profile' ? '👋' : '🔐'}</Text>
          <Text style={styles.title}>
            {step === 'auth' ? "Sign In / Sign Up" : "Welcome to ClearBooks AI"}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'auth' ? "Enter your email and a password to continue." : 
             "Digitize your shop's records with ease."}
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.form}>
          {step === 'auth' && (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={styles.input}
                placeholder="Required"
                placeholderTextColor={theme.colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 'profile' && (
            <>
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
              <TouchableOpacity 
                style={[styles.button, (!shopName || !ownerName) && styles.buttonDisabled]} 
                onPress={handleSaveProfile}
                disabled={!shopName || !ownerName || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Setup</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, padding: theme.spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  icon: { fontSize: 64, marginBottom: theme.spacing.m },
  title: { ...theme.typography.h1, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.s },
  subtitle: { ...(theme.typography.body as any), color: theme.colors.textSecondary || theme.colors.textLight, textAlign: 'center' },
  errorText: { color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.m },
  form: { marginBottom: theme.spacing.xxl },
  label: { ...(theme.typography.h3 as any), color: theme.colors.text, marginBottom: theme.spacing.s },
  input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, ...(theme.typography.body as any), color: theme.colors.text, marginBottom: theme.spacing.l },
  button: { backgroundColor: theme.colors.primary, padding: theme.spacing.l, borderRadius: theme.borderRadius.l, alignItems: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: theme.colors.border, shadowOpacity: 0, elevation: 0 },
  buttonText: { ...(theme.typography.h3 as any), color: theme.colors.surface },
});

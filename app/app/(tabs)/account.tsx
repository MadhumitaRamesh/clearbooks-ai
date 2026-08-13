import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function AccountScreen() {
  const router = useRouter();
  
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email || 'Anonymous Session');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          setShopName(profile.shop_name || '');
          setOwnerName(profile.owner_name || '');
        } else {
          // Fallback to AsyncStorage if they haven't saved to DB yet
          const savedShop = await AsyncStorage.getItem('shopName');
          const savedOwner = await AsyncStorage.getItem('ownerName');
          if (savedShop) setShopName(savedShop);
          if (savedOwner) setOwnerName(savedOwner);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: session.user.id,
          shop_name: shopName,
          owner_name: ownerName
        });
        if (upsertError) throw upsertError;
        
        await AsyncStorage.setItem('shopName', shopName);
        await AsyncStorage.setItem('ownerName', ownerName);
        
        Alert.alert("Success", "Profile saved!");
      }
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Layout guard will automatically route them to /onboarding
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Account</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address (Read-only)</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Owner Name</Text>
          <TextInput 
            style={styles.input}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="e.g. John Doe"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Shop Name</Text>
          <TextInput 
            style={styles.input}
            value={shopName}
            onChangeText={setShopName}
            placeholder="e.g. Corner Store"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.xl,
  },
  title: {
    ...(theme.typography.h1 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  formGroup: {
    marginBottom: theme.spacing.l,
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
  },
  disabledInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textLight,
  },
  button: {
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginTop: theme.spacing.l,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.surface,
  },
  signOutButton: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.m,
  },
  signOutText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
  }
});

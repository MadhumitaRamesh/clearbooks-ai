import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { RecordDetail } from '../types/api';

export default function PreviewScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  
  let parsedData: RecordDetail | null = null;
  try {
    if (data) parsedData = JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse data");
  }

  const [transactions, setTransactions] = useState(
    parsedData?.extracted?.structured?.transactions || []
  );

  const handleSave = () => {
    // In a real app, send confirmed data to backend.
    if (parsedData?.record?.id) {
      router.replace(`/insights/${parsedData.record.id}`);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleRetry = () => {
    router.back();
  };

  const updateQuantity = (index: number, newQty: string) => {
    const updated = [...transactions];
    updated[index].quantity = parseInt(newQty) || 0;
    updated[index].total = updated[index].quantity * updated[index].unit_price;
    setTransactions(updated);
  };

  if (!parsedData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No data to preview.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Confirm Your Record</Text>
        <Text style={styles.subtitle}>Please review the extracted items before saving.</Text>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 3 }]}>Item</Text>
          <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
        </View>
        
        {transactions.map((tx, index) => (
          <View key={index} style={styles.row}>
            <Text style={[styles.cell, { flex: 3 }]} numberOfLines={2}>{tx.item}</Text>
            <TextInput
              style={[styles.inputCell, { flex: 1, textAlign: 'center' }]}
              value={tx.quantity.toString()}
              keyboardType="number-pad"
              onChangeText={(val) => updateQuantity(index, val)}
            />
            <Text style={[styles.cell, { flex: 1.5, textAlign: 'right' }]}>${tx.unit_price}</Text>
            <Text style={[styles.cell, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>${tx.total}</Text>
          </View>
        ))}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>
            ${transactions.reduce((acc, tx) => acc + tx.total, 0)}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Looks Good, Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
          <Text style={styles.secondaryButtonText}>Retry Upload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  title: {
    ...(theme.typography.h2 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...(theme.typography.body as any),
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.s,
  },
  headerCell: {
    ...(theme.typography.caption as any),
    color: theme.colors.textLight,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cell: {
    ...(theme.typography.body as any),
    color: theme.colors.text,
  },
  inputCell: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.s,
    padding: 4,
    ...(theme.typography.body as any),
    color: theme.colors.text,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.l,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryLabel: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
  },
  summaryValue: {
    ...(theme.typography.h2 as any),
    color: theme.colors.primary,
  },
  footer: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.surface,
  },
  secondaryButton: {
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...(theme.typography.body as any),
    color: theme.colors.textSecondary || theme.colors.textLight,
    fontWeight: '600',
  },
  errorText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { getRecord } from '../../lib/backend';
import { RecordDetail } from '../../types/api';

export default function InsightsScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const router = useRouter();
  
  const [data, setData] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    if (!recordId) return;
    setLoading(true);
    setError(false);
    try {
      const recordData = await getRecord(recordId as string);
      setData(recordData);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [recordId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Generating insights...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load insights.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { insights } = data;
  const maxSales = Math.max(...insights.top_items.map(item => item.total_sales));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.summaryText}>{insights.summary}</Text>

      {insights.alerts && insights.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {insights.alerts.map((alert, index) => (
            <Text key={index} style={styles.alertText}>{alert}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Items (Sales)</Text>
        <View style={styles.chartContainer}>
          {insights.top_items.map((item, index) => {
            const percentage = Math.max((item.total_sales / maxSales) * 100, 5); // min 5% width
            return (
              <View key={index} style={styles.chartRow}>
                <View style={styles.chartLabelContainer}>
                  <Text style={styles.chartLabel}>{item.item}</Text>
                  <Text style={styles.chartValue}>${item.total_sales}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demand Predictions</Text>
        <View style={styles.predictionsList}>
          {insights.predictions.map((pred, index) => (
            <View key={index} style={styles.predictionCard}>
              <Text style={styles.predictionIcon}>🔮</Text>
              <Text style={styles.predictionText}>
                You'll likely need <Text style={styles.highlightText}>~{pred.predicted_demand_next_week} units</Text> of {pred.item} next week.
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.m,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...(theme.typography.body as any),
    color: theme.colors.textLight,
    marginTop: theme.spacing.m,
  },
  errorText: {
    ...(theme.typography.body as any),
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
  },
  retryButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
  },
  retryText: {
    color: theme.colors.surface,
    ...(theme.typography.body as any),
  },
  summaryText: {
    ...(theme.typography.h2 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
    lineHeight: 32,
  },
  alertsContainer: {
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  alertText: {
    color: theme.colors.warningDark, // darker warning for better contrast
    ...(theme.typography.body as any),
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  chartContainer: {
    gap: theme.spacing.m,
  },
  chartRow: {
    marginBottom: theme.spacing.s,
  },
  chartLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  chartLabel: {
    ...(theme.typography.body as any),
    color: theme.colors.text,
    fontWeight: '500',
  },
  chartValue: {
    ...(theme.typography.body as any),
    color: theme.colors.textSecondary || theme.colors.textLight,
  },
  barTrack: {
    height: 12,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.pill,
  },
  predictionsList: {
    gap: theme.spacing.m,
  },
  predictionCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  predictionIcon: {
    fontSize: 24,
    marginRight: theme.spacing.m,
  },
  predictionText: {
    ...(theme.typography.body as any),
    color: theme.colors.text,
    flex: 1,
    lineHeight: 24,
  },
  highlightText: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  homeButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  homeButtonText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.primary,
  }
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { getDashboard, getHistory } from '../../lib/backend';
import { RecordDetail, RecordStatus } from '../../types/api';

export default function HomeScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<RecordDetail['insights'] | null>(null);
  const [history, setHistory] = useState<RecordDetail['record'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [dash, hist] = await Promise.all([getDashboard(), getHistory()]);
      setDashboard(dash);
      setHistory(hist.slice(0, 3)); // Only last 3
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderStatusBadge = (status: RecordStatus) => {
    let color = theme.colors.textLight;
    if (status === 'done') color = theme.colors.success;
    if (status === 'failed') color = theme.colors.error;
    if (status === 'processing') color = theme.colors.warning;
    
    return (
      <View style={[styles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.badgeText, { color }]}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome, Shop Owner!</Text>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/upload?type=image')}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Upload Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/upload?type=audio')}>
          <Text style={styles.actionIcon}>🎙️</Text>
          <Text style={styles.actionText}>Record Voice</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load data.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Insights</Text>
            <Text style={styles.summaryText}>{dashboard?.summary}</Text>
            {(dashboard?.alerts?.length ?? 0) > 0 && (
              <View style={styles.alertBox}>
                {dashboard?.alerts.map((alert, i) => (
                  <Text key={i} style={styles.alertText}>{alert}</Text>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {history.map(record => (
            <TouchableOpacity 
              key={record.id} 
              style={styles.historyCard}
              onPress={() => router.push(`/insights/${record.id}`)}
            >
              <View>
                <Text style={styles.recordId}>{record.id}</Text>
                <Text style={styles.recordDate}>{new Date(record.created_at).toLocaleDateString()}</Text>
              </View>
              {renderStatusBadge(record.status)}
            </TouchableOpacity>
          ))}
        </>
      )}
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
  greeting: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.s,
  },
  actionText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.surface,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  summaryText: {
    ...(theme.typography.body as any),
    color: theme.colors.textLight,
    marginBottom: theme.spacing.m,
  },
  alertBox: {
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
  },
  alertText: {
    color: theme.colors.warning,
    ...(theme.typography.caption as any),
    fontWeight: '600',
  },
  sectionTitle: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recordId: {
    ...(theme.typography.body as any),
    fontWeight: '600',
    color: theme.colors.text,
  },
  recordDate: {
    ...(theme.typography.caption as any),
    color: theme.colors.textLight,
  },
  badge: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.s,
  },
  badgeText: {
    ...(theme.typography.caption as any),
    fontWeight: '700',
  }
});

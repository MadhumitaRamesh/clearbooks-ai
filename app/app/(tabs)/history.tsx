import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { getHistory } from '../../lib/backend';
import { RecordDetail, RecordStatus } from '../../types/api';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<RecordDetail['record'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const hist = await getHistory();
      // Sort newest first
      const sorted = hist.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setHistory(sorted);
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
    let bgColor = theme.colors.border;
    
    if (status === 'done') {
      color = theme.colors.success;
      bgColor = theme.colors.success + '20';
    } else if (status === 'failed') {
      color = theme.colors.error;
      bgColor = theme.colors.error + '20';
    } else if (status === 'processing') {
      color = theme.colors.warning;
      bgColor = theme.colors.warning + '20';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        {status === 'processing' && <ActivityIndicator size="small" color={color} style={styles.spinner} />}
        <Text style={[styles.badgeText, { color }]}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load history.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.historyCard}
            onPress={() => router.push(`/insights/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.sourceIcon}>{item.source_type === 'image' ? '📸' : '🎙️'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.recordId}>{item.id}</Text>
                <Text style={styles.recordDate}>
                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            </View>
            {renderStatusBadge(item.status)}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No records found.</Text>
            <Text style={styles.emptySubtext}>Upload a photo or record voice to get started.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
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
  historyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  sourceIcon: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  recordId: {
    ...(theme.typography.body as any),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  recordDate: {
    ...(theme.typography.caption as any),
    color: theme.colors.textLight,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.s,
  },
  spinner: {
    marginRight: 4,
  },
  badgeText: {
    ...(theme.typography.caption as any),
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.m,
  },
  emptyText: {
    ...(theme.typography.h3 as any),
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  emptySubtext: {
    ...(theme.typography.body as any),
    color: theme.colors.textLight,
    textAlign: 'center',
  }
});

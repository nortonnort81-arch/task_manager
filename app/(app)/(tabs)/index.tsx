import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchTasks } from '@/lib/tasks';
import type { TaskRow } from '@/types/database';

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchTasks();
      setTasks(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && tasks.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      {error ? (
        <View style={styles.banner}>
          <ThemedText type="default" style={styles.err}>
            {error}
          </ThemedText>
        </View>
      ) : null}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={tasks.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <ThemedText type="default" style={styles.empty}>
            No tasks yet. Tap + to add one.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })} />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  empty: { textAlign: 'center', opacity: 0.65 },
  banner: { padding: 12, backgroundColor: 'rgba(198,40,40,0.12)' },
  err: { color: '#b71c1c', textAlign: 'center' },
});

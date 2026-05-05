import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getTaskImagePublicUrl } from '@/lib/tasks';
import type { TaskRow } from '@/types/database';

type Props = {
  task: TaskRow;
  onPress: () => void;
};

function formatDue(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export function TaskCard({ task, onPress }: Props) {
  const thumb = getTaskImagePublicUrl(task.image_path);
  const dueLabel = formatDue(task.due_at);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        task.completed && styles.rowDone,
        pressed && styles.rowPressed,
      ]}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbPlaceholder} />
      )}
      <View style={styles.body}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.title, task.completed && styles.titleDone]}
          numberOfLines={2}>
          {task.title}
        </ThemedText>
        {dueLabel ? (
          <ThemedText type="default" style={styles.meta}>
            {dueLabel}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.35)',
    gap: 12,
  },
  rowDone: { opacity: 0.55 },
  rowPressed: { opacity: 0.85 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16 },
  titleDone: { textDecorationLine: 'line-through' },
  meta: { fontSize: 13, opacity: 0.75 },
});

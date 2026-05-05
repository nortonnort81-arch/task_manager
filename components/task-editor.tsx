import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cancelTaskReminder, requestReminderPermissions, scheduleTaskReminder } from '@/lib/reminders';
import {
  createTask,
  deleteTask,
  fetchTaskById,
  getTaskImagePublicUrl,
  removeTaskImage,
  updateTask,
  uploadTaskImage,
} from '@/lib/tasks';

type Props = {
  taskId?: string;
};

export function TaskEditor({ taskId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const border = colorScheme === 'dark' ? '#333' : '#e5e5e5';
  const subtle = colorScheme === 'dark' ? '#888' : '#666';

  const [loading, setLoading] = useState(!!taskId);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [completed, setCompleted] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(async () => {
    if (!taskId?.trim()) return;
    setLoading(true);
    try {
      const row = await fetchTaskById(taskId);
      if (!row) {
        Alert.alert('Not found', 'This task no longer exists.');
        router.back();
        return;
      }
      setTitle(row.title);
      setNotes(row.notes ?? '');
      setDueAt(row.due_at ? new Date(row.due_at) : null);
      setCompleted(row.completed);
      setImagePath(row.image_path);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load task');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo library access is needed to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const clearImage = () => {
    setLocalImageUri(null);
    setImagePath(null);
  };

  const syncReminder = async (id: string, taskTitle: string, due: Date | null, isDone: boolean) => {
    await cancelTaskReminder(id);
    if (!due || isDone) return;
    const ok = await requestReminderPermissions();
    if (!ok) {
      Alert.alert(
        'Notifications off',
        'Enable notifications in system settings to get reminded at the due time.'
      );
      return;
    }
    await scheduleTaskReminder(id, taskTitle, due);
  };

  const onSave = async () => {
    if (!user?.id) return;
    const t = title.trim();
    if (!t) {
      Alert.alert('Title required', 'Please enter a title.');
      return;
    }

    setSaving(true);
    try {
      if (!taskId) {
        const row = await createTask({
          userId: user.id,
          title: t,
          notes: notes.trim() || null,
          dueAt,
          completed: false,
        });
        let path: string | null = null;
        if (localImageUri) {
          path = await uploadTaskImage(user.id, row.id, localImageUri);
          await updateTask(row.id, { image_path: path });
        }
        await syncReminder(row.id, t, dueAt, false);
        router.replace('/(app)/(tabs)');
        return;
      }

      const prevPath = (await fetchTaskById(taskId))?.image_path;
      let nextPath = imagePath;

      if (localImageUri) {
        if (prevPath) await removeTaskImage(prevPath);
        nextPath = await uploadTaskImage(user.id, taskId, localImageUri);
      } else if (prevPath && !imagePath) {
        await removeTaskImage(prevPath);
        nextPath = null;
      }

      await updateTask(taskId, {
        title: t,
        notes: notes.trim() || null,
        due_at: dueAt ? dueAt.toISOString() : null,
        completed,
        image_path: nextPath,
      });
      await syncReminder(taskId, t, dueAt, completed);
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!taskId) return;
    Alert.alert('Delete task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const row = await fetchTaskById(taskId);
            if (row?.image_path) await removeTaskImage(row.image_path);
            await cancelTaskReminder(taskId);
            await deleteTask(taskId);
            router.back();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
          }
        },
      },
    ]);
  };

  const previewUri = localImageUri ?? getTaskImagePublicUrl(imagePath);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Title
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you need to do?"
          placeholderTextColor={subtle}
          style={[styles.input, { borderColor: border, color: Colors[colorScheme].text }]}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Notes
        </ThemedText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional details"
          placeholderTextColor={subtle}
          multiline
          style={[
            styles.input,
            styles.notes,
            { borderColor: border, color: Colors[colorScheme].text },
          ]}
        />

        {taskId ? (
          <View style={styles.rowBetween}>
            <ThemedText type="defaultSemiBold">Completed</ThemedText>
            <Switch value={completed} onValueChange={setCompleted} trackColor={{ true: tint }} />
          </View>
        ) : null}

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Due
        </ThemedText>
        <View style={styles.rowBetween}>
          <ThemedText type="default">
            {dueAt ? dueAt.toLocaleString() : 'No date'}
          </ThemedText>
          <View style={styles.inline}>
            <Pressable onPress={() => setShowPicker(true)} style={styles.smallBtn}>
              <ThemedText type="link">{dueAt ? 'Change' : 'Set'}</ThemedText>
            </Pressable>
            {dueAt ? (
              <Pressable onPress={() => setDueAt(null)} style={styles.smallBtn}>
                <ThemedText type="link">Clear</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              if (Platform.OS !== 'ios') setShowPicker(false);
              if (date) setDueAt(date);
            }}
          />
        )}
        {Platform.OS === 'ios' && showPicker ? (
          <Pressable onPress={() => setShowPicker(false)} style={styles.smallBtn}>
            <ThemedText type="link">Done</ThemedText>
          </Pressable>
        ) : null}

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Image
        </ThemedText>
        <View style={styles.imageRow}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.preview} contentFit="cover" />
          ) : (
            <View style={[styles.preview, styles.previewEmpty, { borderColor: border }]} />
          )}
          <View style={styles.imageActions}>
            <Pressable onPress={pickImage} style={[styles.btnSecondary, { borderColor: border }]}>
              <ThemedText type="defaultSemiBold">{previewUri ? 'Replace' : 'Choose'}</ThemedText>
            </Pressable>
            {previewUri ? (
              <Pressable onPress={clearImage} style={[styles.btnSecondary, { borderColor: border }]}>
                <ThemedText type="defaultSemiBold">Remove</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onSave}
          disabled={saving}
          style={[styles.btnPrimary, { backgroundColor: tint, opacity: saving ? 0.6 : 1 }]}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>{taskId ? 'Save' : 'Create'}</Text>
          )}
        </Pressable>

        {taskId ? (
          <Pressable onPress={onDelete} style={styles.btnDanger}>
            <ThemedText style={styles.btnDangerText}>Delete task</ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40, gap: 8 },
  label: { marginTop: 12, marginBottom: 4, fontSize: 13, opacity: 0.85 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  notes: { minHeight: 100, textAlignVertical: 'top' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inline: { flexDirection: 'row', gap: 12 },
  smallBtn: { paddingVertical: 4 },
  imageRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', marginTop: 4 },
  preview: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#eee' },
  previewEmpty: { borderWidth: 1, borderStyle: 'dashed', backgroundColor: 'transparent' },
  imageActions: { flex: 1, gap: 10 },
  btnSecondary: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  btnDanger: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  btnDangerText: { color: '#c62828', fontSize: 16, fontWeight: '600' },
});

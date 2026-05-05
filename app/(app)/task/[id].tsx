import { Redirect, useLocalSearchParams } from 'expo-router';

import { TaskEditor } from '@/components/task-editor';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const taskId = Array.isArray(id) ? id[0] : id;
  if (!taskId) {
    return <Redirect href="/(app)/(tabs)" />;
  }
  return <TaskEditor taskId={taskId} />;
}

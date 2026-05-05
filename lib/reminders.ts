import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady = false;

export async function ensureAndroidReminderChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0a7ea4',
  });
  channelReady = true;
}

export async function requestReminderPermissions() {
  await ensureAndroidReminderChannel();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }
  const ask = await Notifications.requestPermissionsAsync();
  return ask.granted || ask.status === Notifications.PermissionStatus.GRANTED;
}

export async function scheduleTaskReminder(taskId: string, title: string, dueAt: Date) {
  await ensureAndroidReminderChannel();
  await cancelTaskReminder(taskId);
  if (dueAt.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: taskId,
    content: {
      title: 'Reminder',
      body: title,
      data: { taskId },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
    },
  });
}

export async function cancelTaskReminder(taskId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(taskId);
  } catch {
    // Cancel is safe to ignore if id unknown
  }
}

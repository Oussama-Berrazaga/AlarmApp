import AlarmManager, { DayOfWeek, DAYS_OF_WEEK } from "@/services/alarmModule";
import { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Switch,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Alarm {
  id: string;
  title: string;
  message: string;
  time: Date;
  days?: string;
  isExact: boolean;
}

export default function Index() {
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [alarmTitle, setAlarmTitle] = useState<string>("My Alarm");
  const [alarmMessage, setAlarmMessage] = useState<string>("Time to wake up!");
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isExactAlarm, setIsExactAlarm] = useState<boolean>(false);

  // Days of week for repeating alarms
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  // Platform check
  const isAndroid = Platform.OS === "android";

  if (!isAndroid) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Alarm functionality is only available on Android
        </Text>
      </View>
    );
  }

  const showPicker = (): void => {
    setShowDatePicker(true);
  };

  const onChangeDate = (event: any, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const toggleDay = (day: DayOfWeek): void => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const setAlarm = async (): Promise<void> => {
    try {
      if (isExactAlarm) {
        // For exact alarms, use the timestamp version
        const response = await AlarmManager.setExactAlarm(
          date,
          alarmTitle,
          alarmMessage
        );
        const newAlarm: Alarm = {
          id: date.getTime().toString(),
          title: alarmTitle,
          message: alarmMessage,
          time: date,
          isExact: true,
        };
        setAlarms([...alarms, newAlarm]);
        Alert.alert("Success", response);
      } else {
        // For regular alarms, use hours and minutes
        const hour = date.getHours();
        const minute = date.getMinutes();
        const days = selectedDays.length > 0 ? selectedDays : [];

        const response = await AlarmManager.setAlarm(
          hour,
          minute,
          alarmTitle,
          alarmMessage,
          days
        );

        const daysMap: Record<number, string> = {
          1: "Sun",
          2: "Mon",
          3: "Tue",
          4: "Wed",
          5: "Thu",
          6: "Fri",
          7: "Sat",
        };

        const dayNames = days.map((day) => daysMap[day]).join(", ");

        const newAlarm: Alarm = {
          id: `${hour}-${minute}-${Date.now()}`,
          title: alarmTitle,
          message: alarmMessage,
          time: date,
          days: dayNames,
          isExact: false,
        };
        setAlarms([...alarms, newAlarm]);
        Alert.alert("Success", response);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const cancelAlarm = async (alarm: Alarm): Promise<void> => {
    try {
      if (alarm.isExact) {
        const response = await AlarmManager.cancelAlarm(alarm.time);
        Alert.alert("Success", response);
      } else {
        Alert.alert(
          "Info",
          "Only exact alarms can be canceled programmatically."
        );
      }

      // Remove from our local state regardless
      setAlarms(alarms.filter((a) => a.id !== alarm.id));
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    }
  };
  return (
    <View style={styles.container}>
      {/* <StatusBar style="auto" /> */}

      <Text style={styles.title}>Alarm App</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Alarm Title"
          value={alarmTitle}
          onChangeText={setAlarmTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Alarm Message"
          value={alarmMessage}
          onChangeText={setAlarmMessage}
        />

        <View style={styles.switchContainer}>
          <Text>Exact Alarm: </Text>
          <Switch
            value={isExactAlarm}
            onValueChange={(value: boolean) => {
              setIsExactAlarm(value);
              if (value) {
                setSelectedDays([]);
              }
            }}
          />
        </View>

        <Button
          title={`Select Time (${formatTime(date)})`}
          onPress={showPicker}
        />

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeDate}
          />
        )}

        {!isExactAlarm && (
          <View style={styles.daysContainer}>
            <Text style={styles.subtitle}>Repeat on:</Text>
            <View style={styles.daysGrid}>
              {(Object.entries(DAYS_OF_WEEK) as [string, DayOfWeek][]).map(
                ([name, value]) => (
                  <View key={name} style={styles.dayItem}>
                    <Text>{name.substring(0, 3)}</Text>
                    <Switch
                      value={selectedDays.includes(value)}
                      onValueChange={() => toggleDay(value)}
                    />
                  </View>
                )
              )}
            </View>
          </View>
        )}

        <Button title="Set Alarm" onPress={setAlarm} />
      </View>

      <View style={styles.alarmsContainer}>
        <Text style={styles.subtitle}>Set Alarms:</Text>
        <ScrollView style={styles.alarmsList}>
          {alarms.map((alarm) => (
            <View key={alarm.id} style={styles.alarmItem}>
              <View>
                <Text style={styles.alarmTitle}>{alarm.title}</Text>
                <Text>{formatTime(alarm.time)}</Text>
                {alarm.days && <Text>Repeats: {alarm.days}</Text>}
                <Text>Type: {alarm.isExact ? "Exact" : "Regular"}</Text>
              </View>
              <Button
                title="Cancel"
                onPress={() => cancelAlarm(alarm)}
                color="red"
              />
            </View>
          ))}
          {alarms.length === 0 && (
            <Text style={styles.noAlarms}>No alarms set</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  daysContainer: {
    marginVertical: 10,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayItem: {
    width: "30%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  alarmsContainer: {
    flex: 1,
  },
  alarmsList: {
    flex: 1,
  },
  alarmItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  alarmTitle: {
    fontWeight: "bold",
  },
  noAlarms: {
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
  },
});

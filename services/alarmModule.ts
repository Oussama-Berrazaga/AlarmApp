import { NativeModules, Platform } from 'react-native';

// Define days of week constants for easier use
export const DAYS_OF_WEEK = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7
} as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[keyof typeof DAYS_OF_WEEK];

// Interface for the native module
interface AlarmModuleInterface {
  setAlarm(hour: number, minute: number, title: string, message: string, days: number[]): Promise<string>;
  setExactAlarm(timestamp: number, title: string, message: string): Promise<string>;
  cancelAlarm(timestamp: number): Promise<string>;
}

// Export the interface for the manager - this will be used by consumers
export interface AlarmManagerInterface {
  /**
   * Set an alarm using Android's system alarm clock
   * @param hour Hour (0-23)
   * @param minute Minute (0-59)
   * @param title Alarm title
   * @param message Alarm message
   * @param days Array of days for repeating (use DAYS_OF_WEEK constants)
   * @returns Promise with success message
   */
  setAlarm(hour: number, minute: number, title: string, message: string, days?: DayOfWeek[]): Promise<string>;
  
  /**
   * Set an exact alarm for a specific timestamp
   * @param date Date object for when alarm should trigger
   * @param title Alarm title
   * @param message Alarm message
   * @returns Promise with success message
   */
  setExactAlarm(date: Date, title: string, message: string): Promise<string>;
  
  /**
   * Cancel a previously set alarm
   * @param date The date object used when setting the alarm
   * @returns Promise with success message
   */
  cancelAlarm(date: Date): Promise<string>;
}

const { AlarmModule } = NativeModules;

// Default implementation (if native module not available)
const defaultImplementation: AlarmManagerInterface = {
  setAlarm: (hour: number, minute: number, title: string, message: string, days?: DayOfWeek[]) => 
    Promise.reject('Native AlarmModule not available'),
  setExactAlarm: (date: Date, title: string, message: string) => 
    Promise.reject('Native AlarmModule not available'),
  cancelAlarm: (date: Date) => 
    Promise.reject('Native AlarmModule not available'),
};

// Make an adapter between the native module and our interface
const createAlarmManager = (nativeModule: AlarmModuleInterface): AlarmManagerInterface => {
  return {
    setAlarm: (hour: number, minute: number, title: string, message: string, days: DayOfWeek[] = []) => {
      // Convert our strongly typed DayOfWeek array to plain numbers for the native module
      const dayNumbers: number[] = days;
      return nativeModule.setAlarm(hour, minute, title, message, dayNumbers);
    },

    setExactAlarm: (date: Date, title: string, message: string) => {
      const timestamp = date.getTime();
      return nativeModule.setExactAlarm(timestamp, title, message);
    },

    cancelAlarm: (date: Date) => {
      const timestamp = date.getTime();
      return nativeModule.cancelAlarm(timestamp);
    }
  };
};

// Export the module with safety checks
const AlarmManager: AlarmManagerInterface = Platform.OS === 'android' && AlarmModule 
  ? createAlarmManager(AlarmModule as AlarmModuleInterface)
  : defaultImplementation;

export default AlarmManager;
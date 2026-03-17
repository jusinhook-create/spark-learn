import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    median?: {
      onesignal: {
        register: () => void;
        login: (identifier: string) => void;
        info: () => Promise<{ oneSignalId: string; pushToken?: string }>;
      };
    };
  }
}

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!window.median) return;

    // Request push notification permissions
    window.median.onesignal.register();
  }, []);

  useEffect(() => {
    if (!window.median || !user) return;

    // Identify the user with OneSignal using their email or ID
    const identifier = user.email || user.id;
    window.median.onesignal.login(identifier);

    // Log device info for debugging
    window.median.onesignal.info().then((info) => {
      console.log("OneSignal ID:", info.oneSignalId);
    }).catch(() => {
      // Silently fail if info retrieval fails
    });
  }, [user]);
}

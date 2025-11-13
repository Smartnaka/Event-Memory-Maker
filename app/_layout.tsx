import { EventProvider } from '@/contexts/EventContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerTintColor: '#F97316',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Events",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create-event"
        options={{
          title: "Create Event",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="event/[id]"
        options={{
          title: "Event",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add-moment"
        options={{
          title: "Add Moment",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="daily-recap/[eventId]"
        options={{
          title: "Daily Recap",
        }}
      />
      <Stack.Screen
        name="final-report/[eventId]"
        options={{
          title: "Memory Report",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <EventProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </EventProvider>
    </QueryClientProvider>
  );
}

import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "./screens/HomeScreen";
import SavedJokesScreen from "./screens/SavedJokesScreen";

const Tab = createBottomTabNavigator();
const SAVED_JOKES_KEY = "saved_jokes";

export default function App() {
  const [savedJokesCount, setSavedJokesCount] = useState(0);

  const loadSavedJokesCount = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_JOKES_KEY);
      if (saved) {
        const jokes = JSON.parse(saved);
        setSavedJokesCount(jokes.length);
      }
    } catch (error) {
      console.error("Error loading saved jokes count:", error);
    }
  };

  useEffect(() => {
    loadSavedJokesCount();
  }, []);

  const handleJokeSaved = () => {
    loadSavedJokesCount();
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap;

            if (route.name === "Home") {
              iconName = "home";
            } else if (route.name === "Saved") {
              iconName = "favorite";
            } else {
              iconName = "help";
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#FF6B6B",
          tabBarInactiveTintColor: "#8E8E93",
          tabBarStyle: {
            backgroundColor: "#FFF8F0",
            borderTopColor: "#E0E0E0",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: "Dad Jokes",
          }}
        >
          {() => <HomeScreen onJokeSaved={handleJokeSaved} />}
        </Tab.Screen>

        <Tab.Screen
          name="Saved"
          component={SavedJokesScreen}
          options={{
            tabBarLabel: "Saved",
            tabBarBadge: savedJokesCount > 0 ? savedJokesCount : undefined,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

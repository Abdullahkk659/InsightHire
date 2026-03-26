import { Text } from "@react-navigation/elements";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";
import HomePage from "./Components/Home";
import HRDashboard from "./Components/HRDashboard";
import HRLogin from "./Components/HRLogin";
import Instructions from "./Components/Instructions";
import Questions from "./Components/Questions";
import Result from "./Components/Result";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="Home"
        component={HomePage}
        options={({ navigation }) => ({
          title: "InsightHire",
          headerRight: () => (
            <Pressable
              style={{
                backgroundColor: "rgb(0,107,179)",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 8,
              }}
              onPress={() => navigation.navigate("HRLogin")}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>HR Login</Text>
            </Pressable>
          ),
        })}
      />

      <Stack.Screen name="Instructions" component={Instructions} />
      <Stack.Screen name="Questions" component={Questions} />
      <Stack.Screen name="Result" component={Result} />
      <Stack.Screen name="HRDashboard" component={HRDashboard} />
      <Stack.Screen name="HRLogin" component={HRLogin} />
    </Stack.Navigator>
  );
}

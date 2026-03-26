import { CommonActions } from "@react-navigation/native";
import { get, ref, serverTimestamp, set } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { database } from "./firebaseConfig";

const { width, height } = Dimensions.get("window");

// Professional Color Palette
const COLORS = {
  primary: "#2563eb", // Modern blue
  primaryDark: "#1e40af",
  primaryLight: "#3b82f6",
  secondary: "#10b981", // Success green
  accent: "#8b5cf6", // Purple accent
  error: "#ef4444",
  errorLight: "#fee2e2",
  errorDark: "#dc2626",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceVariant: "#f1f5f9",
  text: "#1e293b",
  textSecondary: "#64748b",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  borderDark: "#cbd5e1",
  disabled: "#94a3b8",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export default function HRLogin({ navigation }) {
  const [hrLoginData, setHrLoginData] = useState({
    hrId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const intervalRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  // Initial animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (isLocked && lockoutTimer > 0) {
      intervalRef.current = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLocked, lockoutTimer]);

  // Shake animation for errors
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Button press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Professional Custom Alert
  const showCustomAlert = (title, message, type = "info", buttons = null) => {
    setModalConfig({
      title,
      message,
      type,
      buttons: buttons || [
        {
          text: "OK",
          onPress: () => setModalVisible(false),
          style: "primary",
        },
      ],
    });
    setModalVisible(true);
  };

  // Navigate back to Home
  const handleBackToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Home" }],
      }),
    );
  };

  const handleHrLogin = async () => {
    Keyboard.dismiss();

    // Check if locked out
    if (isLocked) {
      triggerShake();
      showCustomAlert(
        "Account Locked",
        `Too many failed attempts. Please wait ${lockoutTimer} seconds before trying again.`,
        "error",
      );
      return;
    }

    // Validate input
    if (!hrLoginData.hrId.trim() || !hrLoginData.password.trim()) {
      triggerShake();
      showCustomAlert(
        "Invalid Input",
        "Please enter both HR ID and Password to continue.",
        "warning",
      );
      return;
    }

    setLoading(true);
    try {
      const hrRef = ref(database, "hrCredentials/mainHR");
      const snapshot = await get(hrRef);

      if (!snapshot.exists()) {
        // First time - Save credentials
        await set(hrRef, {
          hrId: hrLoginData.hrId,
          password: hrLoginData.password,
          createdAt: serverTimestamp(),
        });

        setFailedAttempts(0);

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "HRDashboard" }],
          }),
        );
      } else {
        // Verify credentials
        const savedHR = snapshot.val();

        if (
          hrLoginData.hrId === savedHR.hrId &&
          hrLoginData.password === savedHR.password
        ) {
          // Successful login
          setFailedAttempts(0);
          setHrLoginData({ hrId: "", password: "" });

          showCustomAlert(
            "Login Successful",
            "Welcome to the HR Dashboard!",
            "success",
            [
              {
                text: "Continue",
                onPress: () => {
                  setModalVisible(false);
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: "HRDashboard" }],
                    }),
                  );
                },
                style: "success",
              },
            ],
          );
        } else {
          // Wrong credentials
          triggerShake();
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);

          if (newFailedAttempts >= 3) {
            setIsLocked(true);
            setLockoutTimer(30);
            setHrLoginData({ hrId: "", password: "" });

            showCustomAlert(
              "Account Locked",
              "Too many failed login attempts. Your account has been locked for 30 seconds for security purposes.",
              "error",
            );
          } else {
            showCustomAlert(
              "Invalid Credentials",
              `The HR ID or Password you entered is incorrect.\n\nAttempts remaining: ${3 - newFailedAttempts}`,
              "error",
            );
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      triggerShake();
      showCustomAlert(
        "Login Error",
        "An error occurred during login. Please check your connection and try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Get icon based on modal type
  const getModalIcon = () => {
    switch (modalConfig.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  // Get icon color based on modal type
  const getModalIconColor = () => {
    switch (modalConfig.type) {
      case "success":
        return COLORS.secondary;
      case "error":
        return COLORS.error;
      case "warning":
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Custom Modal Dialog */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.modalContent}>
                {/* Icon */}
                <View
                  style={[
                    styles.modalIcon,
                    { backgroundColor: getModalIconColor() + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalIconText,
                      { color: getModalIconColor() },
                    ]}
                  >
                    {getModalIcon()}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.modalTitle}>{modalConfig.title}</Text>

                {/* Message */}
                <Text style={styles.modalMessage}>{modalConfig.message}</Text>

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  {modalConfig.buttons.map((button, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.modalButton,
                        button.style === "primary" && styles.modalButtonPrimary,
                        button.style === "success" && styles.modalButtonSuccess,
                        pressed && styles.modalButtonPressed,
                      ]}
                      onPress={button.onPress}
                    >
                      <Text style={styles.modalButtonText}>{button.text}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Login Form */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {/* Logo/Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>HR</Text>
            </View>
            <Text style={styles.heading}>HR Login</Text>
            <Text style={styles.subheading}>
              Access your dashboard securely
            </Text>
          </View>

          {/* Lockout Warning */}
          {isLocked && (
            <Animated.View style={styles.lockoutContainer}>
              <View style={styles.lockoutIcon}>
                <Text style={styles.lockoutIconText}>🔒</Text>
              </View>
              <Text style={styles.lockoutText}>Account Locked</Text>
              <Text style={styles.lockoutSubtext}>
                Wait {lockoutTimer} seconds
              </Text>
            </Animated.View>
          )}

          {/* Failed Attempts Warning */}
          {!isLocked && failedAttempts > 0 && (
            <Animated.View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Failed attempts: {failedAttempts}/3
              </Text>
            </Animated.View>
          )}

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>HR ID</Text>
            <TextInput
              placeholder="Enter your HR ID"
              placeholderTextColor={COLORS.textLight}
              style={[styles.input, isLocked && styles.inputDisabled]}
              value={hrLoginData.hrId}
              onChangeText={(v) => setHrLoginData({ ...hrLoginData, hrId: v })}
              editable={!loading && !isLocked}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              style={[styles.input, isLocked && styles.inputDisabled]}
              value={hrLoginData.password}
              onChangeText={(v) =>
                setHrLoginData({ ...hrLoginData, password: v })
              }
              editable={!loading && !isLocked}
              autoCapitalize="none"
            />
          </View>

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={[
                styles.button,
                (loading || isLocked) && styles.buttonDisabled,
              ]}
              onPress={handleHrLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={loading || isLocked}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLocked ? `Locked (${lockoutTimer}s)` : "Login"}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure HR Management System</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  form: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.surface,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.text,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  lockoutContainer: {
    backgroundColor: COLORS.errorLight,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: "center",
  },
  lockoutIcon: {
    marginBottom: 8,
  },
  lockoutIconText: {
    fontSize: 32,
  },
  lockoutText: {
    fontSize: 18,
    color: COLORS.errorDark,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 4,
  },
  lockoutSubtext: {
    fontSize: 14,
    color: COLORS.errorDark,
    textAlign: "center",
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: COLORS.warningLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.warning,
    textAlign: "center",
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    fontSize: 16,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: COLORS.surfaceVariant,
    borderColor: COLORS.borderDark,
    color: COLORS.disabled,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalContent: {
    padding: 32,
    alignItems: "center",
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconText: {
    fontSize: 36,
    fontWeight: "700",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonSuccess: {
    backgroundColor: COLORS.secondary,
  },
  modalButtonPressed: {
    opacity: 0.8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
});

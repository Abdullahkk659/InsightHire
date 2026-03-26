import { useNavigation } from "@react-navigation/native";
import { get, ref, set } from "firebase/database";
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

// Professional Color Palette - Matching HR Login
const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  primaryLight: "#3b82f6",
  secondary: "#10b981",
  accent: "#8b5cf6",
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

export default function HomePage() {
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
    onContinue: () => {},
  });

  const [screen, setScreen] = useState("home");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Initial entrance animation
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

  // Reset animations when screen changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [screen]);

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

  const showSuccessModal = (title, message, type = "success", onContinue) => {
    setSuccessModal({
      visible: true,
      title,
      message,
      type,
      onContinue,
    });
  };

  const hideSuccessModal = () => {
    setSuccessModal({
      visible: false,
      title: "",
      message: "",
      type: "success",
      onContinue: () => {},
    });
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();

    if (!formData.firstName.trim()) {
      triggerShake();
      showSuccessModal(
        "Invalid Input",
        "Please enter your first name",
        "error",
        hideSuccessModal,
      );
      return;
    }

    if (!formData.lastName.trim()) {
      triggerShake();
      showSuccessModal(
        "Invalid Input",
        "Please enter your last name",
        "error",
        hideSuccessModal,
      );
      return;
    }

    if (!formData.email.trim()) {
      triggerShake();
      showSuccessModal(
        "Invalid Input",
        "Please enter your email",
        "error",
        hideSuccessModal,
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      triggerShake();
      showSuccessModal(
        "Invalid Email",
        "Please enter a valid email address",
        "error",
        hideSuccessModal,
      );
      return;
    }

    if (!formData.password) {
      triggerShake();
      showSuccessModal(
        "Invalid Input",
        "Please enter a password",
        "error",
        hideSuccessModal,
      );
      return;
    }

    if (formData.password.length < 6) {
      triggerShake();
      showSuccessModal(
        "Weak Password",
        "Password must be at least 6 characters long",
        "warning",
        hideSuccessModal,
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      triggerShake();
      showSuccessModal(
        "Password Mismatch",
        "Passwords do not match. Please try again.",
        "error",
        hideSuccessModal,
      );
      return;
    }

    setLoading(true);

    try {
      const emailKey = formData.email
        .toLowerCase()
        .replace(/\./g, "_")
        .replace(/@/g, "_at_")
        .replace(/\#/g, "_")
        .replace(/\$/g, "_")
        .replace(/\[/g, "_")
        .replace(/\]/g, "_");

      const userRef = ref(database, `users/${emailKey}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setLoading(false);
        triggerShake();
        showSuccessModal(
          "Account Exists",
          "An account with this email already exists. Please login instead.",
          "warning",
          hideSuccessModal,
        );
        return;
      }

      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        createdAt: new Date().toISOString(),
      };

      await set(userRef, userData);
      setLoading(false);

      showSuccessModal(
        "Registration Successful!",
        `Welcome ${formData.firstName}! Your account has been created successfully.`,
        "success",
        () => {
          hideSuccessModal();
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
          setScreen("userLogin");
        },
      );
    } catch (error) {
      console.error("Error saving user data:", error);
      setLoading(false);
      triggerShake();

      let errorMessage = "Failed to create account. ";

      if (error.code === "PERMISSION_DENIED") {
        errorMessage +=
          "Permission denied. Please check your Firebase database rules.";
      } else if (error.message.includes("network")) {
        errorMessage += "Please check your internet connection.";
      } else {
        errorMessage += error.message;
      }

      showSuccessModal(
        "Registration Failed",
        errorMessage,
        "error",
        hideSuccessModal,
      );
    }
  };

  const handleUserLogin = async () => {
    Keyboard.dismiss();

    if (!loginData.email.trim()) {
      triggerShake();
      showSuccessModal(
        "Invalid Input",
        "Please enter your email",
        "error",
        hideSuccessModal,
      );
      return;
    }

    if (!loginData.password) {
      triggerShake();
      showSuccessModal(
        "Invalid Input",
        "Please enter your password",
        "error",
        hideSuccessModal,
      );
      return;
    }

    setLoading(true);

    try {
      const emailKey = loginData.email
        .toLowerCase()
        .replace(/\./g, "_")
        .replace(/@/g, "_at_")
        .replace(/\#/g, "_")
        .replace(/\$/g, "_")
        .replace(/\[/g, "_")
        .replace(/\]/g, "_");

      const userRef = ref(database, `users/${emailKey}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setLoading(false);
        triggerShake();
        showSuccessModal(
          "Login Failed",
          "Wrong email or password. Please check your credentials and try again.",
          "error",
          hideSuccessModal,
        );
        return;
      }

      const userData = snapshot.val();

      if (loginData.password === userData.password) {
        setLoading(false);

        showSuccessModal(
          "Login Successful!",
          `Welcome back, ${userData.firstName}!`,
          "success",
          () => {
            hideSuccessModal();
            setLoginData({
              email: "",
              password: "",
            });
            navigation.navigate("Instructions", {
              userInfo: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
              },
            });
          },
        );
      } else {
        setLoading(false);
        triggerShake();
        showSuccessModal(
          "Login Failed",
          "Wrong email or password. Please check your credentials and try again.",
          "error",
          hideSuccessModal,
        );
      }
    } catch (error) {
      console.error("Error during login:", error);
      setLoading(false);
      triggerShake();

      let errorMessage = "Login failed. ";

      if (error.code === "PERMISSION_DENIED") {
        errorMessage +=
          "Permission denied. Please check your Firebase database rules.";
      } else if (error.message.includes("network")) {
        errorMessage += "Please check your internet connection.";
      } else {
        errorMessage += error.message;
      }

      showSuccessModal("Login Error", errorMessage, "error", hideSuccessModal);
    }
  };

  // Get modal icon based on type
  const getModalIcon = () => {
    switch (successModal.type) {
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

  // Get modal icon color based on type
  const getModalIconColor = () => {
    switch (successModal.type) {
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

  const SuccessModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModal.visible}
        onRequestClose={hideSuccessModal}
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
                  style={[styles.modalIconText, { color: getModalIconColor() }]}
                >
                  {getModalIcon()}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>{successModal.title}</Text>

              {/* Message */}
              <Text style={styles.modalMessage}>{successModal.message}</Text>

              {/* Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: getModalIconColor() },
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={successModal.onContinue}
              >
                <Text style={styles.modalButtonText}>
                  {successModal.type === "error" ? "Try Again" : "Continue"}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // User Login Screen
  if (screen === "userLogin") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <SuccessModal />
          <Animated.View
            style={[
              styles.form,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>IH</Text>
              </View>
              <Text style={styles.heading}>Welcome Back</Text>
              <Text style={styles.subheading}>Sign in to continue</Text>
            </View>

            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                value={loginData.email}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                onChangeText={(v) => setLoginData({ ...loginData, email: v })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry
                style={styles.input}
                value={loginData.password}
                editable={!loading}
                onChangeText={(v) =>
                  setLoginData({ ...loginData, password: v })
                }
              />
            </View>

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleUserLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </Pressable>
            </Animated.View>

            {/* Footer Link */}
            <Pressable onPress={() => setScreen("signup")} disabled={loading}>
              <Text style={styles.linkText}>
                Don't have an account?{" "}
                <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Sign Up Screen
  if (screen === "signup") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <SuccessModal />
          <Animated.View
            style={[
              styles.form,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>IH</Text>
              </View>
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.subheading}>Join InsightHire today</Text>
            </View>

            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                placeholder="Enter your first name"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                value={formData.firstName}
                editable={!loading}
                onChangeText={(v) => setFormData({ ...formData, firstName: v })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                placeholder="Enter your last name"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                value={formData.lastName}
                editable={!loading}
                onChangeText={(v) => setFormData({ ...formData, lastName: v })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                value={formData.email}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry
                style={styles.input}
                value={formData.password}
                editable={!loading}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry
                style={styles.input}
                value={formData.confirmPassword}
                editable={!loading}
                onChangeText={(v) =>
                  setFormData({ ...formData, confirmPassword: v })
                }
              />
            </View>

            {/* Sign Up Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </Pressable>
            </Animated.View>

            {/* Footer Link */}
            <Pressable
              onPress={() => setScreen("userLogin")}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkTextBold}>Login</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Home Screen
  return (
    <View style={styles.container}>
      <SuccessModal />
      <Animated.View
        style={[
          styles.homeContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroLogoContainer}>
            <Text style={styles.heroLogoText}>IH</Text>
          </View>
          <Text style={styles.heroTitle}>InsightHire</Text>
          <View style={styles.divider} />
        </View>

        {/* Content */}
        <Text style={styles.heroDescription}>
          Take a short personality assessment to help us recommend the right
          department for you.
        </Text>

        {/* Buttons */}
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }], width: "100%" }}
        >
          <Pressable
            style={styles.button}
            onPress={() => setScreen("signup")}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.buttonText}>Apply Now</Text>
          </Pressable>
        </Animated.View>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setScreen("userLogin")}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? Login
          </Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.homeFooter}>
          <Text style={styles.footerText}>Find your perfect fit</Text>
        </View>
      </Animated.View>
    </View>
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
  homeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroLogoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  heroLogoText: {
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.surface,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  heroDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
    maxWidth: 420,
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
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    width: "100%",
    maxWidth: 420,
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
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 16,
    width: "100%",
    maxWidth: 420,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  homeFooter: {
    marginTop: 40,
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
  modalButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 150,
  },
  modalButtonPressed: {
    opacity: 0.8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
    textAlign: "center",
  },
});

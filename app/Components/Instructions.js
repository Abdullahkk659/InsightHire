import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Professional Color Palette - Matching the app theme
const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  primaryLight: "#3b82f6",
  secondary: "#10b981",
  accent: "#8b5cf6",
  error: "#ef4444",
  errorLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceVariant: "#f1f5f9",
  text: "#1e293b",
  textSecondary: "#64748b",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  success: "#10b981",
  successLight: "#d1fae5",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export default function Instructions({ navigation, route }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;

  // Individual instruction animations
  const instruction1Anim = useRef(new Animated.Value(0)).current;
  const instruction2Anim = useRef(new Animated.Value(0)).current;
  const instruction3Anim = useRef(new Animated.Value(0)).current;
  const instruction4Anim = useRef(new Animated.Value(0)).current;
  const instruction5Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const userInfo = route.params?.userInfo;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Header slides in
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Card fades and scales in
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
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Stagger instruction items
      Animated.stagger(100, [
        Animated.spring(instruction1Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(instruction2Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(instruction3Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(instruction4Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(instruction5Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(buttonAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

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

  const handleProceed = () => {
    handlePressOut();
    setTimeout(() => {
      navigation.navigate("Questions", {
        userInfo: userInfo,
      });
    }, 150);
  };

  const handleExit = () => {
    navigation.goBack();
  };

  // Create animation style for each instruction
  const getInstructionStyle = (animValue) => ({
    opacity: animValue,
    transform: [
      {
        translateX: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerSlideAnim }] },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>IH</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>InsightHire</Text>
              <Text style={styles.headerSubtitle}>Personality Assessment</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.exitButton,
              pressed && styles.exitButtonPressed,
            ]}
            onPress={handleExit}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: cardScaleAnim },
                ],
              },
            ]}
          >
            {/* Icon Header */}
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📋</Text>
            </View>

            <Text style={styles.title}>Before You Begin</Text>
            <Text style={styles.subtitle}>
              Please read the instructions carefully before starting the
              assessment
            </Text>

            {/* User Info Card */}
            {userInfo && (
              <Animated.View
                style={[
                  styles.userInfoCard,
                  getInstructionStyle(instruction1Anim),
                ]}
              >
                <View style={styles.userInfoHeader}>
                  <View style={styles.userAvatarContainer}>
                    <Text style={styles.userAvatarText}>
                      {userInfo.firstName?.charAt(0)}
                      {userInfo.lastName?.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.userInfoTextContainer}>
                    <Text style={styles.userInfoLabel}>Candidate</Text>
                    <Text style={styles.userInfoName}>
                      {userInfo.firstName} {userInfo.lastName}
                    </Text>
                    <Text style={styles.userInfoEmail}>{userInfo.email}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Instructions Section */}
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>
                Assessment Guidelines
              </Text>

              <Animated.View style={getInstructionStyle(instruction1Anim)}>
                <InstructionItem
                  number="1"
                  text="You will answer 10 carefully designed questions"
                  icon="📝"
                />
              </Animated.View>

              <Animated.View style={getInstructionStyle(instruction2Anim)}>
                <InstructionItem
                  number="2"
                  text="Choose the option that best represents you"
                  icon="✓"
                />
              </Animated.View>

              <Animated.View style={getInstructionStyle(instruction3Anim)}>
                <InstructionItem
                  number="3"
                  text="You cannot go back once you proceed to the next question"
                  icon="⚠️"
                  warning
                />
              </Animated.View>

              <Animated.View style={getInstructionStyle(instruction4Anim)}>
                <InstructionItem
                  number="4"
                  text="Answer honestly for the most accurate results"
                  icon="💡"
                />
              </Animated.View>

              <Animated.View style={getInstructionStyle(instruction5Anim)}>
                <InstructionItem
                  number="5"
                  text="Complete the test in one sitting (approx. 5 minutes)"
                  icon="⏱️"
                />
              </Animated.View>
            </View>

            {/* Action Buttons */}
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: buttonAnim,
                  transform: [
                    {
                      translateY: buttonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <Pressable
                style={styles.proceedButton}
                onPress={handleProceed}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Text style={styles.proceedButtonText}>Start Assessment</Text>
                <Text style={styles.proceedButtonIcon}>→</Text>
              </Pressable>

              <Text style={styles.disclaimerText}>
                By proceeding, you agree to answer all questions honestly
              </Text>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Instruction Item Component
function InstructionItem({ number, text, icon, warning }) {
  return (
    <View
      style={[styles.instructionItem, warning && styles.instructionItemWarning]}
    >
      <View style={styles.instructionNumberContainer}>
        <Text style={styles.instructionNumber}>{number}</Text>
      </View>
      <Text style={styles.instructionText}>{text}</Text>
      <Text style={styles.instructionIcon}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.surface,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  exitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exitButtonPressed: {
    backgroundColor: COLORS.border,
  },
  exitButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
    color: COLORS.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  userInfoCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.surface,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userInfoName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  userInfoEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  instructionsSection: {
    marginBottom: 28,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionItemWarning: {
    backgroundColor: COLORS.warningLight,
    borderColor: COLORS.warning,
  },
  instructionNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.surface,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "500",
  },
  instructionIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  buttonContainer: {
    alignItems: "center",
  },
  proceedButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  proceedButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  proceedButtonIcon: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: "700",
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

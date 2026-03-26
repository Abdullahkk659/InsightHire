import { get, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { database } from "./firebaseConfig";

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

// Shuffle function (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function Questions({ route, navigation }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState("");
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const userInfo = route.params?.userInfo;

  // Scoring accumulator - ALL 5 BIG FIVE TRAITS
  const [scores, setScores] = useState({
    Openness: 0,
    Conscientiousness: 0,
    Extraversion: 0,
    Agreeableness: 0,
    Neuroticism: 0,
  });

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(1)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const completionFadeAnim = useRef(new Animated.Value(0)).current;
  const completionScaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Individual option animations
  const option1Anim = useRef(new Animated.Value(0)).current;
  const option2Anim = useRef(new Animated.Value(0)).current;
  const option3Anim = useRef(new Animated.Value(0)).current;
  const optionScaleAnims = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  // Load questions from Firebase
  useEffect(() => {
    loadQuestionsFromFirebase();
  }, []);

  const loadQuestionsFromFirebase = async () => {
    try {
      console.log("🔄 Attempting to load questions from Firebase...");

      const questionsRef = ref(database, "questions");
      const snapshot = await get(questionsRef);

      console.log("📊 Snapshot exists:", snapshot.exists());

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(
          "✅ Data retrieved:",
          Object.keys(data).length,
          "questions",
        );
        console.log("📝 First question sample:", data[Object.keys(data)[0]]);

        const questionsArray = Object.keys(data).map((key) => {
          const question = data[key];
          return {
            id: key,
            text: question.text || "Question text missing",
            answers: question.answers || {
              Agree: "Openness",
              Neutral: "Conscientiousness",
              Disagree: "Neuroticism",
            },
            // Provide default values of 0 if parameters are missing
            openness: question.openness !== undefined ? question.openness : 0,
            conscientiousness:
              question.conscientiousness !== undefined
                ? question.conscientiousness
                : 0,
            extraversion:
              question.extraversion !== undefined ? question.extraversion : 0,
            agreeableness:
              question.agreeableness !== undefined ? question.agreeableness : 0,
            neuroticism:
              question.neuroticism !== undefined ? question.neuroticism : 0,
          };
        });

        console.log(
          "✅ Questions array created:",
          questionsArray.length,
          "questions",
        );
        console.log("📝 First mapped question:", questionsArray[0]);

        // Shuffle the questions
        const shuffledQuestions = shuffleArray(questionsArray);
        console.log("🔀 Questions shuffled");

        setQuestions(shuffledQuestions);
        setLoading(false);

        // Animate entrance
        setTimeout(() => {
          animateEntrance();
        }, 100);
      } else {
        console.error("❌ No questions found in database");
        setErrorMessage(
          "No questions found in database. Please check Firebase.",
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error loading questions:", error);
      console.error("Error details:", error.message, error.code);
      setErrorMessage(`Failed to load questions: ${error.message}`);
      setLoading(false);
    }
  };

  const animateEntrance = () => {
    // Header slides in
    Animated.spring(headerSlideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Stagger option animations
    Animated.stagger(100, [
      Animated.spring(option1Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(option2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(option3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 40,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (completed) {
      Animated.parallel([
        Animated.timing(completionFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(completionScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [completed]);

  // Shake animation for warning
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

  const animateOptionPress = (index) => {
    const scaleAnim = optionScaleAnims[index];
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const showErrorModal = (title, message) => {
    setShowWarningModal(true);
  };

  const handleNext = () => {
    if (!selected) {
      triggerShake();
      setShowWarningModal(true);
      return;
    }

    // DUAL SCORING SYSTEM - Combines answer-based AND parameter-based scoring
    const currentQuestionData = questions[currentQuestion];
    const parameter = currentQuestionData.answers[selected]; // Old system

    // New system - all 5 trait parameters
    const opennessValue = currentQuestionData.openness || 0;
    const conscientiousnessValue = currentQuestionData.conscientiousness || 0;
    const extraversionValue = currentQuestionData.extraversion || 0;
    const agreeablenessValue = currentQuestionData.agreeableness || 0;
    const neuroticismValue = currentQuestionData.neuroticism || 0;

    let newScores = { ...scores };

    // Calculate points per question for equal distribution across 30 questions
    const pointsPerQuestion = 17; // For answer-based system

    // 1. ANSWER-BASED SCORING (Original system)
    if (parameter) {
      newScores[parameter] = Math.min(
        100,
        scores[parameter] + pointsPerQuestion,
      );
    }

    // 2. PARAMETER-BASED SCORING (New system for ALL 5 traits)
    // Calculate score multiplier based on selected answer
    let multiplier = 0;
    if (selected === "Agree") {
      multiplier = 1; // Full value
    } else if (selected === "Neutral") {
      multiplier = 0; // No change
    } else if (selected === "Disagree") {
      multiplier = -1; // Opposite value
    }

    // Points per question to reach 100 after all questions
    const basePoints = 100 / 30; // ~3.33 points per question

    // Update all trait scores based on their parameters
    if (opennessValue !== 0) {
      const change = basePoints * opennessValue * multiplier;
      newScores.Openness = Math.max(
        0,
        Math.min(100, newScores.Openness + change),
      );
    }

    if (conscientiousnessValue !== 0) {
      const change = basePoints * conscientiousnessValue * multiplier;
      newScores.Conscientiousness = Math.max(
        0,
        Math.min(100, newScores.Conscientiousness + change),
      );
    }

    if (extraversionValue !== 0) {
      const change = basePoints * extraversionValue * multiplier;
      newScores.Extraversion = Math.max(
        0,
        Math.min(100, newScores.Extraversion + change),
      );
    }

    if (agreeablenessValue !== 0) {
      const change = basePoints * agreeablenessValue * multiplier;
      newScores.Agreeableness = Math.max(
        0,
        Math.min(100, newScores.Agreeableness + change),
      );
    }

    if (neuroticismValue !== 0) {
      const change = basePoints * neuroticismValue * multiplier;
      newScores.Neuroticism = Math.max(
        0,
        Math.min(100, newScores.Neuroticism + change),
      );
    }

    setScores(newScores);

    // Check if we've completed all questions
    const isLastQuestion = currentQuestion === questions.length - 1;

    // Fade out and scale down card
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isLastQuestion) {
        setProgress(100);
        setCompleted(true);
      } else {
        setCurrentQuestion(currentQuestion + 1);
        setProgress(((currentQuestion + 2) / questions.length) * 100);
        setSelected("");

        // Reset option animations
        option1Anim.setValue(0);
        option2Anim.setValue(0);
        option3Anim.setValue(0);
      }

      // Fade in and scale up card
      Animated.parallel([
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animate options for new question
        if (!isLastQuestion) {
          Animated.stagger(100, [
            Animated.spring(option1Anim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(option2Anim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(option3Anim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    });
  };

  const redirect = () => {
    console.log("Navigating with scores:", scores);
    console.log("User info:", userInfo);
    navigation.navigate("Result", {
      scores: scores,
      userInfo: userInfo,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const getOptionStyle = (animValue) => ({
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  // Error state
  if (!loading && errorMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Error Loading Questions</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadQuestionsFromFirebase}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading questions...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View
                style={[
                  styles.modalIcon,
                  { backgroundColor: COLORS.warningLight },
                ]}
              >
                <Text style={styles.modalIconText}>⚠</Text>
              </View>
              <Text style={styles.modalTitle}>Selection Required</Text>
              <Text style={styles.modalMessage}>
                Please select an option before proceeding to the next question.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: COLORS.warning },
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={() => setShowWarningModal(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerSlideAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>IH</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>InsightHire</Text>
              <Text style={styles.headerSubtitle}>Assessment in Progress</Text>
            </View>
            <View style={styles.questionCounter}>
              <Text style={styles.counterText}>
                {currentQuestion + 1} / {questions.length}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>

        {/* Question Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFadeAnim,
              transform: [{ scale: cardScaleAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {!completed ? (
            <>
              {/* Question Badge */}
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>
                  Question {currentQuestion + 1}
                </Text>
              </View>

              {/* Question Text */}
              <Text style={styles.questionText}>
                {questions[currentQuestion]?.text}
              </Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {["Agree", "Neutral", "Disagree"].map((option, index) => {
                  const animValue = [option1Anim, option2Anim, option3Anim][
                    index
                  ];
                  const isSelected = selected === option;

                  return (
                    <Animated.View
                      key={option}
                      style={[
                        getOptionStyle(animValue),
                        { transform: [{ scale: optionScaleAnims[index] }] },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                        onPress={() => {
                          setSelected(option);
                          animateOptionPress(index);
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.optionIndicator,
                            isSelected && styles.optionIndicatorSelected,
                          ]}
                        >
                          {isSelected && (
                            <Text style={styles.optionCheckmark}>✓</Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Next Button */}
              <Animated.View
                style={{
                  transform: [{ scale: buttonScaleAnim }],
                }}
              >
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                >
                  <Text style={styles.nextButtonText}>Next Question</Text>
                  <Text style={styles.nextButtonIcon}>→</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            // Completion Screen
            <Animated.View
              style={{
                opacity: completionFadeAnim,
                transform: [{ scale: completionScaleAnim }],
                alignItems: "center",
              }}
            >
              <View style={styles.completionIconContainer}>
                <Text style={styles.completionIcon}>🎉</Text>
              </View>
              <Text style={styles.completionTitle}>Assessment Complete!</Text>
              <Text style={styles.completionText}>
                Congratulations! You've successfully completed all questions.
                Your personalized results are ready to view.
              </Text>
              <TouchableOpacity
                style={styles.viewResultsButton}
                onPress={redirect}
              >
                <Text style={styles.viewResultsButtonText}>
                  View My Results
                </Text>
                <Text style={styles.viewResultsButtonIcon}>✨</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "600",
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: COLORS.surface,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.error,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  headerContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
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
  questionCounter: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
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
    minHeight: 400,
  },
  questionBadge: {
    backgroundColor: COLORS.primaryLight + "20",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  questionBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  questionText: {
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "500",
  },
  optionsContainer: {
    marginBottom: 32,
    gap: 16,
  },
  optionCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionCardSelected: {
    backgroundColor: COLORS.primaryLight + "10",
    borderColor: COLORS.primary,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionIndicatorSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionCheckmark: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  nextButtonIcon: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: "700",
  },
  completionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.successLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: COLORS.success,
  },
  completionIcon: {
    fontSize: 52,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 16,
  },
  completionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  viewResultsButton: {
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
  },
  viewResultsButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  viewResultsButtonIcon: {
    fontSize: 20,
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

export default Questions;

import { LinearGradient } from "expo-linear-gradient";
import { get, push, ref, set } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

export default function Result({ route, navigation }) {
  const { scores, userInfo } = route.params;
  const [departments, setDepartments] = useState({});
  const [recommendedDept, setRecommendedDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedToFirebase, setSavedToFirebase] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleScaleAnim = useRef(new Animated.Value(0.8)).current;
  const suggestionFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const cardRotateAnim = useRef(new Animated.Value(0)).current;

  // Bar animation values for scores - ALL 5 BIG FIVE TRAITS
  const opennessAnim = useRef(new Animated.Value(0)).current;
  const conscientiousnessAnim = useRef(new Animated.Value(0)).current;
  const extraversionAnim = useRef(new Animated.Value(0)).current;
  const agreeablenessAnim = useRef(new Animated.Value(0)).current;
  const neuroticismAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for trophy
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!loading) {
      animateEntrance();
    }
  }, [loading]);

  useEffect(() => {
    // Pulse animation for trophy icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const loadDepartments = async () => {
    try {
      const deptsRef = ref(database, "departments");
      const snapshot = await get(deptsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setDepartments(data);

        // Determine recommended department based on highest score across ALL 5 traits
        const maxScore = Math.max(...Object.values(scores));
        const topParameter = Object.keys(scores).find(
          (key) => scores[key] === maxScore,
        );

        // Find department matching the top parameter
        const recommended = Object.keys(data).find(
          (key) => data[key].requiredParameter === topParameter,
        );

        setRecommendedDept(recommended);

        // Save results to Firebase after determining recommendation
        await saveResultsToFirebase(recommended, data[recommended]);

        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      setLoading(false);
    }
  };

  const saveResultsToFirebase = async (
    recommendedDeptKey,
    recommendedDeptData,
  ) => {
    try {
      console.log("Saving results to Firebase...");
      console.log("User Info received:", userInfo);

      const resultsRef = ref(database, "results");
      const newResultRef = push(resultsRef);

      const resultData = {
        timestamp: new Date().toISOString(),
        userInfo: {
          email: userInfo?.email || "unknown@email.com",
          firstName: userInfo?.firstName || "Unknown",
          lastName: userInfo?.lastName || "User",
          fullName:
            userInfo?.firstName && userInfo?.lastName
              ? `${userInfo.firstName} ${userInfo.lastName}`
              : "Unknown User",
        },
        scores: {
          openness: Math.round(scores.Openness),
          conscientiousness: Math.round(scores.Conscientiousness),
          extraversion: Math.round(scores.Extraversion),
          agreeableness: Math.round(scores.Agreeableness),
          neuroticism: Math.round(scores.Neuroticism),
        },
        recommendedDepartment: {
          key: recommendedDeptKey,
          name: recommendedDeptData?.name || "Unknown",
          description: recommendedDeptData?.description || "",
          icon: recommendedDeptData?.icon || "🏆",
          requiredParameter: recommendedDeptData?.requiredParameter || "",
        },
        maxScore: Math.max(...Object.values(scores)),
        dominantTrait: Object.keys(scores).find(
          (key) => scores[key] === Math.max(...Object.values(scores)),
        ),
        completedDate: new Date().toLocaleDateString(),
        completedTime: new Date().toLocaleTimeString(),
      };

      console.log("Result data to save:", resultData);

      await set(newResultRef, resultData);

      setSavedToFirebase(true);
      console.log("✅ Results saved successfully to Firebase!");
    } catch (error) {
      console.error("❌ Error saving results to Firebase:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
    }
  };

  const animateEntrance = () => {
    // Header slide in
    Animated.spring(headerSlideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Card entrance with slight rotation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(titleScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(cardRotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animateBars();
    });
  };

  const animateBars = () => {
    const animations = [
      Animated.spring(opennessAnim, {
        toValue: scores.Openness / 100,
        tension: 40,
        friction: 7,
        useNativeDriver: false,
      }),
      Animated.spring(conscientiousnessAnim, {
        toValue: scores.Conscientiousness / 100,
        tension: 40,
        friction: 7,
        delay: 200,
        useNativeDriver: false,
      }),
      Animated.spring(extraversionAnim, {
        toValue: scores.Extraversion / 100,
        tension: 40,
        friction: 7,
        delay: 400,
        useNativeDriver: false,
      }),
      Animated.spring(agreeablenessAnim, {
        toValue: scores.Agreeableness / 100,
        tension: 40,
        friction: 7,
        delay: 600,
        useNativeDriver: false,
      }),
      Animated.spring(neuroticismAnim, {
        toValue: scores.Neuroticism / 100,
        tension: 40,
        friction: 7,
        delay: 800,
        useNativeDriver: false,
      }),
    ];

    Animated.stagger(150, animations).start(() => {
      Animated.spring(suggestionFadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
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

  const redirect = () => {
    handlePressOut();
    setTimeout(() => {
      navigation.navigate("Home");
    }, 150);
  };

  const cardRotate = cardRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-2deg", "0deg"],
  });

  const getColorForScore = (score) => {
    if (score >= 70) return [COLORS.secondary, "#059669"];
    if (score >= 40) return [COLORS.warning, "#d97706"];
    return [COLORS.error, "#dc2626"];
  };

  const getScoreCategory = (score) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Moderate";
    return "Low";
  };

  const getPersonalityInsight = () => {
    const openness = Math.round(scores.Openness);
    const conscientiousness = Math.round(scores.Conscientiousness);
    const extraversion = Math.round(scores.Extraversion);
    const agreeableness = Math.round(scores.Agreeableness);
    const neuroticism = Math.round(scores.Neuroticism);

    // Find dominant trait
    const traits = {
      Openness: openness,
      Conscientiousness: conscientiousness,
      Extraversion: extraversion,
      Agreeableness: agreeableness,
      Neuroticism: neuroticism,
    };

    const maxScore = Math.max(...Object.values(traits));
    const dominantTrait = Object.keys(traits).find(
      (key) => traits[key] === maxScore,
    );

    // Generate insight based on dominant trait and secondary traits
    let insight = "";

    switch (dominantTrait) {
      case "Openness":
        insight =
          "You are intellectually curious and open to new experiences. ";
        if (extraversion > 50) {
          insight +=
            "Your social nature complements your creative thinking, making you an innovative collaborator.";
        } else {
          insight +=
            "You prefer deep, independent exploration of ideas and concepts.";
        }
        break;
      case "Conscientiousness":
        insight = "You are organized, reliable, and goal-oriented. ";
        if (agreeableness > 50) {
          insight +=
            "Your cooperative nature makes you an excellent team player who ensures tasks are completed efficiently.";
        } else {
          insight +=
            "You maintain high standards and work systematically toward your objectives.";
        }
        break;
      case "Extraversion":
        insight =
          "You are energetic, outgoing, and thrive in social situations. ";
        if (agreeableness > 50) {
          insight +=
            "Your warmth and sociability make you a natural team leader and motivator.";
        } else {
          insight +=
            "You're assertive and enjoy taking charge in group settings.";
        }
        break;
      case "Agreeableness":
        insight = "You are cooperative, empathetic, and value harmony. ";
        if (conscientiousness > 50) {
          insight +=
            "Your dependable and considerate nature makes you a trusted team member.";
        } else {
          insight +=
            "You prioritize relationships and work well in collaborative environments.";
        }
        break;
      case "Neuroticism":
        insight = "You are sensitive and emotionally aware. ";
        if (conscientiousness > 50) {
          insight +=
            "Your attention to detail helps you anticipate and prepare for potential challenges.";
        } else {
          insight +=
            "You're attuned to your emotions and the nuances of your environment.";
        }
        break;
      default:
        insight = "You have a balanced personality profile across all traits.";
    }

    return insight;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Analyzing your results...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { transform: [{ translateY: headerSlideAnim }] },
            ]}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>InsightHire</Text>
                <Text style={styles.headerSubtitle}>Assessment Complete</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  savedToFirebase && styles.statusBadgeSaved,
                ]}
              >
                <Text style={styles.statusText}>
                  {savedToFirebase ? "✓ Saved" : "✓ Complete"}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Main Result Card */}
          <Animated.View
            style={[
              styles.resultCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: titleScaleAnim },
                  { rotate: cardRotate },
                ],
              },
            ]}
          >
            {/* Trophy Icon with Pulse */}
            <Animated.View
              style={[
                styles.trophyContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.trophyIcon}>
                {recommendedDept ? departments[recommendedDept]?.icon : "🏆"}
              </Text>
            </Animated.View>

            <Text style={styles.title}>Your Results</Text>
            <Text style={styles.subtitle}>Personality Assessment Analysis</Text>

            {/* User Info Display */}
            {userInfo && (
              <View style={styles.userInfoCard}>
                <Text style={styles.userInfoTitle}>Candidate Information</Text>
                <Text style={styles.userInfoText}>
                  {userInfo.firstName} {userInfo.lastName}
                </Text>
                <Text style={styles.userInfoEmail}>{userInfo.email}</Text>
              </View>
            )}

            {/* Score Bars - ALL 5 BIG FIVE TRAITS */}
            <View style={styles.scoresSection}>
              <Text style={styles.sectionTitle}>Personality Traits</Text>

              <ScoreBar
                label="Openness to Experience"
                score={Math.round(scores.Openness)}
                category={getScoreCategory(scores.Openness)}
                animValue={opennessAnim}
                color={getColorForScore(scores.Openness)}
                description="Imagination, creativity, and openness to new ideas"
              />

              <ScoreBar
                label="Conscientiousness"
                score={Math.round(scores.Conscientiousness)}
                category={getScoreCategory(scores.Conscientiousness)}
                animValue={conscientiousnessAnim}
                color={getColorForScore(scores.Conscientiousness)}
                description="Organization, reliability, and goal-directed behavior"
              />

              <ScoreBar
                label="Extraversion"
                score={Math.round(scores.Extraversion)}
                category={getScoreCategory(scores.Extraversion)}
                animValue={extraversionAnim}
                color={getColorForScore(scores.Extraversion)}
                description="Sociability, assertiveness, and energy in social settings"
              />

              <ScoreBar
                label="Agreeableness"
                score={Math.round(scores.Agreeableness)}
                category={getScoreCategory(scores.Agreeableness)}
                animValue={agreeablenessAnim}
                color={getColorForScore(scores.Agreeableness)}
                description="Cooperation, empathy, and consideration for others"
              />

              <ScoreBar
                label="Neuroticism"
                score={Math.round(scores.Neuroticism)}
                category={getScoreCategory(scores.Neuroticism)}
                animValue={neuroticismAnim}
                color={getColorForScore(scores.Neuroticism)}
                description="Emotional sensitivity and response to stress"
              />
            </View>

            {/* Personality Insight */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>💡</Text>
                <Text style={styles.insightTitle}>Personality Insight</Text>
              </View>
              <Text style={styles.insightText}>{getPersonalityInsight()}</Text>
            </View>

            {/* Suggested Department */}
            {recommendedDept && (
              <Animated.View
                style={[
                  styles.recommendation,
                  {
                    opacity: suggestionFadeAnim,
                    transform: [
                      {
                        translateY: suggestionFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationIconContainer}>
                    <Text style={styles.recommendationIcon}>🎯</Text>
                  </View>
                  <View style={styles.recommendationTextContainer}>
                    <Text style={styles.recommendationLabel}>
                      Best Match Department
                    </Text>
                    <Text style={styles.recommendationName}>
                      {departments[recommendedDept]?.name}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recommendationDescription}>
                  {departments[recommendedDept]?.description}
                </Text>
              </Animated.View>
            )}

            {/* Action Button */}
            <Animated.View
              style={{ transform: [{ scale: buttonScaleAnim }], width: "100%" }}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={redirect}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
              >
                <Text style={styles.actionButtonText}>Return to Home</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* Score Bar Component */
function ScoreBar({ label, score, category, animValue, color, description }) {
  const barWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreBarLabel}>{label}</Text>
          <Text style={styles.scoreBarCategory}>{category}</Text>
          {description && (
            <Text style={styles.scoreBarDescription}>{description}</Text>
          )}
        </View>
        <Text style={styles.scoreBarValue}>{score}%</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]}>
          <LinearGradient
            colors={color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.barGradient}
          />
        </Animated.View>
      </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.primaryLight + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statusBadgeSaved: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  trophyContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.warningLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: COLORS.warning,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trophyIcon: {
    fontSize: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  userInfoCard: {
    width: "100%",
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfoTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userInfoText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scoresSection: {
    width: "100%",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },
  scoreBarContainer: {
    width: "100%",
    marginBottom: 24,
  },
  scoreBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  scoreBarLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  scoreBarCategory: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreBarDescription: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: "italic",
    lineHeight: 16,
  },
  scoreBarValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  barTrack: {
    width: "100%",
    height: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barFill: {
    height: "100%",
  },
  barGradient: {
    flex: 1,
  },
  insightCard: {
    width: "100%",
    backgroundColor: COLORS.accent + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  recommendation: {
    width: "100%",
    backgroundColor: COLORS.primaryLight + "10",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recommendationIcon: {
    fontSize: 24,
  },
  recommendationTextContainer: {
    flex: 1,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recommendationName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  recommendationDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
  },
});

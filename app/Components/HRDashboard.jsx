import { CommonActions } from "@react-navigation/native";
import { get, onValue, ref, remove, set, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

export default function HRDashboard({ navigation }) {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [candidatesData, setCandidatesData] = useState({
    All: [],
    IT: [],
    Accounting: [],
    Communications: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [stats, setStats] = useState({
    totalCandidates: 0,
    openPositions: 5,
    pendingInterviews: 0,
    approved: 0,
    rejected: 0,
    departments: 3,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const statsScaleAnim = useRef(new Animated.Value(0.9)).current;

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  // Initial entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
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
        Animated.spring(statsScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Fetch candidates from Firebase
  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = () => {
    const resultsRef = ref(database, "results");

    const unsubscribe = onValue(
      resultsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const resultsData = snapshot.val();

          const organized = {
            All: [],
            IT: [],
            Accounting: [],
            Communications: [],
          };

          let totalCount = 0;
          let pendingCount = 0;
          let approvedCount = 0;
          let rejectedCount = 0;

          Object.keys(resultsData).forEach((key) => {
            const result = resultsData[key];
            const dept = result.recommendedDepartment?.key || "IT";

            const candidate = {
              id: key,
              name:
                result.userInfo?.fullName ||
                (result.userInfo?.firstName && result.userInfo?.lastName
                  ? `${result.userInfo.firstName} ${result.userInfo.lastName}`
                  : `Candidate ${key.slice(-4)}`),
              email: result.userInfo?.email || "",
              score: result.maxScore || 0,
              maxScore: result.maxScore,
              status: result.status || "Pending",
              department: dept,
              departmentName: result.recommendedDepartment?.name || "Unknown",
              completedDate: result.completedDate || "N/A",
              completedTime: result.completedTime || "N/A",
              scores: result.scores || {},
              conscientiousness: result.scores?.conscientiousness || 0,
              extraversion: result.scores?.extraversion || 0,
              openness: result.scores?.openness || 0,
              reviewedAt: result.reviewedAt || null,
              reviewedDate: result.reviewedDate || null,
              reviewedTime: result.reviewedTime || null,
            };

            if (candidate.status === "Pending") pendingCount++;
            else if (candidate.status === "Approved") approvedCount++;
            else if (candidate.status === "Rejected") rejectedCount++;

            if (organized[dept]) {
              organized[dept].push(candidate);
            }

            organized.All.push(candidate);
            totalCount++;
          });

          Object.keys(organized).forEach((dept) => {
            organized[dept].sort((a, b) => b.maxScore - a.maxScore);
          });

          setCandidatesData(organized);
          setStats({
            totalCandidates: totalCount,
            openPositions: 5,
            pendingInterviews: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            departments: 3,
          });
        } else {
          setCandidatesData({
            All: [],
            IT: [],
            Accounting: [],
            Communications: [],
          });
        }
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Firebase error:", error);
        showCustomAlert(
          "Error",
          "Failed to load test results. Please refresh.",
          "error",
        );
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => unsubscribe();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCandidates();
  };

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

  const updateCandidateStatus = async (candidateId, newStatus) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [candidateId]: true }));

      const resultRef = ref(database, `results/${candidateId}`);
      const snapshot = await get(resultRef);

      if (!snapshot.exists()) {
        throw new Error("Candidate data not found");
      }

      const candidateData = snapshot.val();

      if (
        candidateData.status === "Approved" ||
        candidateData.status === "Rejected"
      ) {
        showCustomAlert(
          "Already Processed",
          `This candidate has already been ${candidateData.status.toLowerCase()}.`,
          "warning",
        );
        setUpdatingStatus((prev) => ({ ...prev, [candidateId]: false }));
        return;
      }

      const reviewData = {
        status: newStatus,
        reviewedAt: new Date().toISOString(),
        reviewedDate: new Date().toLocaleDateString(),
        reviewedTime: new Date().toLocaleTimeString(),
      };

      await update(resultRef, reviewData);

      if (newStatus === "Approved") {
        const approvedRef = ref(database, `approvedCandidates/${candidateId}`);
        await set(approvedRef, {
          ...candidateData,
          ...reviewData,
        });

        const rejectedRef = ref(database, `rejectedCandidates/${candidateId}`);
        await remove(rejectedRef).catch(() => {});
      } else if (newStatus === "Rejected") {
        const rejectedRef = ref(database, `rejectedCandidates/${candidateId}`);
        await set(rejectedRef, {
          ...candidateData,
          ...reviewData,
        });

        const approvedRef = ref(database, `approvedCandidates/${candidateId}`);
        await remove(approvedRef).catch(() => {});
      }

      setUpdatingStatus((prev) => ({ ...prev, [candidateId]: false }));

      showCustomAlert(
        "Success",
        `Candidate has been successfully ${newStatus.toLowerCase()}!`,
        "success",
      );
    } catch (error) {
      console.error("❌ Error updating status:", error);
      setUpdatingStatus((prev) => ({ ...prev, [candidateId]: false }));
      showCustomAlert(
        "Error",
        `Failed to update candidate status. ${error.message}`,
        "error",
      );
    }
  };

  const handleApprove = (candidateId) => {
    showCustomAlert(
      "Approve Candidate",
      "Are you sure you want to approve this candidate?",
      "confirm",
      [
        {
          text: "Cancel",
          onPress: () => setModalVisible(false),
          style: "secondary",
        },
        {
          text: "Approve",
          onPress: () => {
            setModalVisible(false);
            updateCandidateStatus(candidateId, "Approved");
          },
          style: "success",
        },
      ],
    );
  };

  const handleReject = (candidateId) => {
    showCustomAlert(
      "Reject Candidate",
      "Are you sure you want to reject this candidate?",
      "confirm",
      [
        {
          text: "Cancel",
          onPress: () => setModalVisible(false),
          style: "secondary",
        },
        {
          text: "Reject",
          onPress: () => {
            setModalVisible(false);
            updateCandidateStatus(candidateId, "Rejected");
          },
          style: "danger",
        },
      ],
    );
  };

  const handleLogout = () => {
    showCustomAlert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      "confirm",
      [
        {
          text: "Cancel",
          onPress: () => setModalVisible(false),
          style: "secondary",
        },
        {
          text: "Logout",
          onPress: () => {
            setModalVisible(false);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "HRLogin" }],
              }),
            );
          },
          style: "danger",
        },
      ],
    );
  };

  const getModalIcon = () => {
    switch (modalConfig.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "confirm":
        return "?";
      default:
        return "ℹ";
    }
  };

  const getModalIconColor = () => {
    switch (modalConfig.type) {
      case "success":
        return COLORS.success;
      case "error":
        return COLORS.error;
      case "warning":
        return COLORS.warning;
      case "confirm":
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContainer}>
            <View style={styles.modalContent}>
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
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              <Text style={styles.modalMessage}>{modalConfig.message}</Text>
              <View style={styles.modalButtons}>
                {modalConfig.buttons.map((button, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.modalButton,
                      button.style === "primary" && styles.modalButtonPrimary,
                      button.style === "secondary" &&
                        styles.modalButtonSecondary,
                      button.style === "success" && styles.modalButtonSuccess,
                      button.style === "danger" && styles.modalButtonDanger,
                      pressed && styles.modalButtonPressed,
                    ]}
                    onPress={button.onPress}
                  >
                    <Text
                      style={[
                        styles.modalButtonText,
                        button.style === "secondary" &&
                          styles.modalButtonTextSecondary,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerSlideAnim }] },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>HR</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>InsightHire</Text>
              <Text style={styles.headerSubtitle}>HR Dashboard</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeText}>Welcome, HR Team!</Text>

            {/* Department Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
            >
              {["All", "IT", "Accounting", "Communications"].map((dept) => (
                <Pressable
                  key={dept}
                  style={[
                    styles.tab,
                    selectedDepartment === dept && styles.tabActive,
                  ]}
                  onPress={() => setSelectedDepartment(dept)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedDepartment === dept && styles.tabTextActive,
                    ]}
                  >
                    {dept}
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      selectedDepartment === dept && styles.tabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        selectedDepartment === dept &&
                          styles.tabBadgeTextActive,
                      ]}
                    >
                      {candidatesData[dept]?.length || 0}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* Stats Cards */}
            <Animated.View
              style={[
                styles.statsContainer,
                { transform: [{ scale: statsScaleAnim }] },
              ]}
            >
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.statCardHalf]}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: COLORS.primary + "20" },
                    ]}
                  >
                    <Text style={styles.statIcon}>👥</Text>
                  </View>
                  <Text style={[styles.statNumber, { color: COLORS.primary }]}>
                    {stats.totalCandidates}
                  </Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf]}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: COLORS.warning + "20" },
                    ]}
                  >
                    <Text style={styles.statIcon}>⏳</Text>
                  </View>
                  <Text style={[styles.statNumber, { color: COLORS.warning }]}>
                    {stats.pendingInterviews}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.statCardHalf]}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: COLORS.success + "20" },
                    ]}
                  >
                    <Text style={styles.statIcon}>✓</Text>
                  </View>
                  <Text style={[styles.statNumber, { color: COLORS.success }]}>
                    {stats.approved}
                  </Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>

                <View style={[styles.statCard, styles.statCardHalf]}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: COLORS.error + "20" },
                    ]}
                  >
                    <Text style={styles.statIcon}>✕</Text>
                  </View>
                  <Text style={[styles.statNumber, { color: COLORS.error }]}>
                    {stats.rejected}
                  </Text>
                  <Text style={styles.statLabel}>Rejected</Text>
                </View>
              </View>
            </Animated.View>

            {/* Candidates Section */}
            <View style={styles.candidatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedDepartment} Candidates
                </Text>
                <View style={styles.candidateCountBadge}>
                  <Text style={styles.candidateCountText}>
                    {candidatesData[selectedDepartment]?.length || 0}
                  </Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading candidates...</Text>
                </View>
              ) : candidatesData[selectedDepartment]?.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>
                    No candidates in {selectedDepartment}
                  </Text>
                </View>
              ) : (
                candidatesData[selectedDepartment]?.map((candidate) => (
                  <View key={candidate.id} style={styles.candidateCard}>
                    {/* Candidate Header */}
                    <View style={styles.candidateHeader}>
                      <View style={styles.candidateAvatarContainer}>
                        <Text style={styles.candidateAvatar}>
                          {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </Text>
                      </View>
                      <View style={styles.candidateHeaderInfo}>
                        <Text style={styles.candidateName}>
                          {candidate.name}
                        </Text>
                        <Text style={styles.candidateEmail} numberOfLines={1}>
                          {candidate.email}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          candidate.status === "Approved" &&
                            styles.statusApproved,
                          candidate.status === "Rejected" &&
                            styles.statusRejected,
                          candidate.status === "Pending" &&
                            styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {candidate.status}
                        </Text>
                      </View>
                    </View>

                    {/* Candidate Details */}
                    <View style={styles.candidateDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Score:</Text>
                        <Text style={styles.detailValue}>
                          {candidate.maxScore} pts
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Department:</Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: COLORS.primary },
                          ]}
                        >
                          {candidate.departmentName}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>
                          {candidate.completedDate}
                        </Text>
                      </View>
                    </View>

                    {/* Score Breakdown */}
                    <View style={styles.scoresBreakdown}>
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreChipLabel}>C</Text>
                        <Text style={styles.scoreChipValue}>
                          {candidate.conscientiousness}
                        </Text>
                      </View>
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreChipLabel}>E</Text>
                        <Text style={styles.scoreChipValue}>
                          {candidate.extraversion}
                        </Text>
                      </View>
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreChipLabel}>O</Text>
                        <Text style={styles.scoreChipValue}>
                          {candidate.openness}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    {candidate.status === "Pending" && (
                      <View style={styles.actionButtons}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionButton,
                            styles.approveButton,
                            updatingStatus[candidate.id] &&
                              styles.buttonDisabled,
                            pressed && styles.actionButtonPressed,
                          ]}
                          onPress={() => handleApprove(candidate.id)}
                          disabled={updatingStatus[candidate.id]}
                        >
                          {updatingStatus[candidate.id] ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.actionButtonIcon}>✓</Text>
                              <Text style={styles.actionButtonText}>
                                Approve
                              </Text>
                            </>
                          )}
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionButton,
                            styles.rejectButton,
                            updatingStatus[candidate.id] &&
                              styles.buttonDisabled,
                            pressed && styles.actionButtonPressed,
                          ]}
                          onPress={() => handleReject(candidate.id)}
                          disabled={updatingStatus[candidate.id]}
                        >
                          {updatingStatus[candidate.id] ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.actionButtonIcon}>✕</Text>
                              <Text style={styles.actionButtonText}>
                                Reject
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.surface,
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
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutButtonPressed: {
    backgroundColor: COLORS.border,
  },
  logoutText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginRight: 8,
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  tabBadge: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: COLORS.surface + "30",
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabBadgeTextActive: {
    color: COLORS.surface,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardHalf: {
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  candidatesSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  candidateCountBadge: {
    backgroundColor: COLORS.primaryLight + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  candidateCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  candidateCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  candidateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  candidateAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  candidateAvatar: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.surface,
  },
  candidateHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  statusApproved: {
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  statusPending: {
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  statusRejected: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },
  candidateDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
  scoresBreakdown: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  scoreChip: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  scoreChipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    flexDirection: "row",
    gap: 6,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.surface,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
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
    padding: 28,
    alignItems: "center",
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 32,
    fontWeight: "700",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPressed: {
    opacity: 0.8,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  modalButtonDanger: {
    backgroundColor: COLORS.error,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.surface,
  },
  modalButtonTextSecondary: {
    color: COLORS.text,
  },
});

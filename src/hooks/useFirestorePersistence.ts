import { useEffect, useState, useCallback, Dispatch, SetStateAction } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Goal, PlannerTask, UserProfile, UserTier, SuccessStory } from "../types";
import { offlineSyncManager } from "../lib/offlineSync";
import { validatePromoCode } from "../lib/promoCodes";

const FALLBACK_SUCCESS_STORY: SuccessStory = {
  id: "JYvrpcFnIDKNyFqQO32e",
  authorName: "Jane Doe",
  goalTitle: "Build the Atom-I Landing Page",
  isApproved: true,
  quote: "Atom-I transformed my entire team's priority workflow!",
  stepsCompleted: [
    "Defined package tiers and pricing",
    "Configured the Firestore Database",
    "Linked Stripe to the user account",
  ],
  userId: "pkg_3_user_test",
};

export function useFirestorePersistence(
  initialGoal: Goal,
  setGoal: Dispatch<SetStateAction<Goal>>,
  setPlannerTasks: Dispatch<SetStateAction<PlannerTask[]>>
) {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "synced" | "error">("idle");
  const [userGoalsList, setUserGoalsList] = useState<Array<{ id: string; title: string; progress: number }>>([]);
  
  // Active test persona override or real user UID
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const effectiveUid = activePersonaId || user?.uid || null;

  // User Profile with tier entitlements - Restored from localStorage immediately on refresh
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const isOwnerEmail = user?.email === "faux.fuax@gmail.com";

    const savedProfile =
      typeof window !== "undefined"
        ? localStorage.getItem("goal_atomizer_user_profile")
        : null;

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // Only the genuine project owner email is Root Architect #000
        if (isOwnerEmail || parsed.email === "faux.fuax@gmail.com") {
          return {
            ...parsed,
            tier: "founder_lifetime",
            isFounderLifetime: true,
            isCreator: true,
            founderNumber: 0,
            hasCalendar: true,
            hasGrid: true,
            hasLiveVoice: true,
            voiceMinutesRemaining: Math.max(parsed.voiceMinutesRemaining || 0, 999999),
            atomizationLimit: 999999,
          };
        }

        // Sanitize any accidental root creator flags for other testers
        if (parsed.founderNumber === 0 || parsed.isCreator) {
          return {
            ...parsed,
            isCreator: false,
            founderNumber: parsed.founderNumber === 0 ? undefined : parsed.founderNumber,
          };
        }

        return parsed;
      } catch {}
    }

    if (isOwnerEmail) {
      return {
        uid: "creator_faux",
        tier: "founder_lifetime",
        atomizationLimit: 999999,
        hasCalendar: true,
        hasGrid: true,
        hasLiveVoice: true,
        voiceMinutesRemaining: 999999,
        hasTeams: true,
        isFounderLifetime: true,
        isCreator: true,
        founderNumber: 0,
        email: "faux.fuax@gmail.com",
        preferredEngine: "puter",
      };
    }

    return {
      uid: "trial_user_test",
      tier: "operative",
      atomizationLimit: 3,
      hasCalendar: false,
      hasGrid: false,
      hasLiveVoice: false,
      voiceMinutesRemaining: 0,
      hasTeams: false,
      preferredEngine: "puter",
    };
  });

  // Keep localStorage synced whenever userProfile updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("goal_atomizer_user_profile", JSON.stringify(userProfile));
      if (userProfile.email === "faux.fuax@gmail.com" || user?.email === "faux.fuax@gmail.com") {
        localStorage.setItem("atom_is_creator", "true");
        localStorage.setItem("atom_vip_promo", "FAUX-VIP");
      } else {
        localStorage.removeItem("atom_is_creator");
        localStorage.removeItem("atom_vip_promo");
      }
    } catch {}
  }, [userProfile, user]);

  // Success stories for landing page
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([FALLBACK_SUCCESS_STORY]);

  // 1. Fetch & Listen to User Profile & Entitlements
  useEffect(() => {
    if (!effectiveUid) return;

    const userDocRef = doc(db, "users", effectiveUid);
    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnap) => {
        const isCreatorAccount =
          user?.email === "faux.fuax@gmail.com" ||
          effectiveUid === "creator_faux" ||
          (docSnap.exists() && docSnap.data()?.email === "faux.fuax@gmail.com");

        if (docSnap.exists()) {
          const data = docSnap.data();
          const rawTier = (data.tier as UserTier) || "operative";
          const normalizedTier: UserTier =
            isCreatorAccount
              ? "founder_lifetime"
              : rawTier === "trial" || rawTier === "package_1"
              ? "operative"
              : rawTier === "package_2"
              ? "tactical_pro"
              : rawTier === "package_3"
              ? "vanguard_live"
              : rawTier;

          const updatedProfile: UserProfile = {
            uid: effectiveUid,
            tier: isCreatorAccount ? "founder_lifetime" : normalizedTier,
            atomizationLimit: isCreatorAccount ? 999999 : (data.atomizationLimit ?? (normalizedTier === "operative" ? 3 : 999999)),
            hasCalendar: isCreatorAccount || !!(
              data.hasCalendar ??
              data.hasCalander ??
              (data.email === "faux.fuax@gmail.com" ||
                user?.email === "faux.fuax@gmail.com" ||
                normalizedTier !== "operative")
            ),
            hasGrid: isCreatorAccount || !!(
              data.hasGrid ??
              (data.email === "faux.fuax@gmail.com" ||
                user?.email === "faux.fuax@gmail.com" ||
                normalizedTier !== "operative")
            ),
            hasLiveVoice: isCreatorAccount || !!(
              data.hasLiveVoice ||
              normalizedTier === "vanguard_live" ||
              normalizedTier === "founder_lifetime"
            ),
            voiceMinutesRemaining: isCreatorAccount
              ? 999999
              : (data.voiceMinutesRemaining ??
                (normalizedTier === "vanguard_live"
                  ? 120
                  : normalizedTier === "founder_lifetime"
                  ? 60
                  : 0)),
            isFounderLifetime: isCreatorAccount || !!(
              data.isFounderLifetime || normalizedTier === "founder_lifetime"
            ),
            isCreator: isCreatorAccount,
            hasTeams: isCreatorAccount || !!data.hasTeams,
            teamLimit: isCreatorAccount ? 20 : data.teamLimit,
            featuredEligible: isCreatorAccount || data.featuredEligible,
            email: data.email || user?.email || undefined,
            displayName: data.displayName || user?.displayName || undefined,
            preferredEngine: data.preferredEngine || "puter",
            founderNumber: isCreatorAccount ? 0 : (data.founderNumber !== undefined ? data.founderNumber : undefined),
            founderPromoCodeUsed: data.founderPromoCodeUsed || (isCreatorAccount ? "FAUX-VIP" : undefined),
            founderMerchClaimed: !!data.founderMerchClaimed,
            founderMerchDetails: data.founderMerchDetails || undefined,
            isVipPromo: isCreatorAccount || !!data.isVipPromo,
            founderDiscountPercent: data.founderDiscountPercent,
            activeDiscountCode: data.activeDiscountCode,
            redeemedPromoCodes: data.redeemedPromoCodes || (isCreatorAccount ? ["FAUX-VIP"] : []),
          };

          setUserProfile(updatedProfile);
          if (isCreatorAccount) {
            localStorage.setItem("atom_is_creator", "true");
            // Ensure Firestore is updated with creator attributes so it is permanently stored
            if (data.founderNumber !== 0 || !data.isCreator) {
              setDoc(userDocRef, { isCreator: true, founderNumber: 0, tier: "founder_lifetime" }, { merge: true }).catch(() => {});
            }
          }
        } else {
          // Initialize fresh user profile if authenticated
          const initialProfile: UserProfile = {
            uid: effectiveUid,
            tier: isCreatorAccount ? "founder_lifetime" : "operative",
            atomizationLimit: isCreatorAccount ? 999999 : 3,
            hasCalendar: isCreatorAccount,
            hasGrid: isCreatorAccount,
            hasLiveVoice: isCreatorAccount,
            voiceMinutesRemaining: isCreatorAccount ? 999999 : 0,
            hasTeams: isCreatorAccount,
            isFounderLifetime: isCreatorAccount,
            isCreator: isCreatorAccount,
            founderNumber: isCreatorAccount ? 0 : undefined,
            email: user?.email || undefined,
            displayName: user?.displayName || undefined,
            preferredEngine: "puter",
            redeemedPromoCodes: isCreatorAccount ? ["FAUX-VIP"] : [],
          };
          setUserProfile(initialProfile);
          if (isCreatorAccount) {
            localStorage.setItem("atom_is_creator", "true");
          }
          try {
            await setDoc(userDocRef, initialProfile, { merge: true });
          } catch (e) {
            console.warn("Could not write default profile:", e);
          }
        }
      },
      (error) => {
        console.warn("User profile sync error:", error);
      }
    );

    return () => unsubscribe();
  }, [effectiveUid, user]);

  // 2. Fetch & Listen to "atomizations" collection (Root collection in atom-i)
  useEffect(() => {
    if (!effectiveUid) {
      setUserGoalsList([]);
      return;
    }

    // Query atomizations where userId matches effectiveUid
    const atomizationsRef = collection(db, "atomizations");
    const q = query(atomizationsRef, where("userId", "==", effectiveUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const goals: Array<{ id: string; title: string; progress: number }> = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          goals.push({
            id: docSnap.id,
            title: data.title || "Untitled Objective",
            progress: data.progress || 0,
          });
        });
        setUserGoalsList(goals);
      },
      (error) => {
        console.warn("Error fetching atomizations:", error);
      }
    );

    return () => unsubscribe();
  }, [effectiveUid]);

  // 3. Fetch "success_stories" for Landing Page
  useEffect(() => {
    const storiesRef = collection(db, "success_stories");
    const unsubscribe = onSnapshot(
      storiesRef,
      (snapshot) => {
        const stories: SuccessStory[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.isApproved !== false) {
            stories.push({
              id: docSnap.id,
              authorName: data.authorName || "Anonymous Operator",
              goalTitle: data.goalTitle || "Untitled Goal",
              isApproved: data.isApproved ?? true,
              quote: data.quote || "",
              stepsCompleted: Array.isArray(data.stepsCompleted)
                ? data.stepsCompleted.map((s: string) => s.replace(/^\d+:\s*/, ""))
                : [],
              userId: data.userId || "",
            });
          }
        });
        if (stories.length > 0) {
          setSuccessStories(stories);
        }
      },
      (err) => {
        console.warn("Reading success stories:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Subscribe to planner items
  useEffect(() => {
    if (!effectiveUid) return;

    const plannerRef = collection(db, "users", effectiveUid, "planner");
    const unsubscribe = onSnapshot(
      plannerRef,
      (snapshot) => {
        const items: PlannerTask[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            title: d.title || "",
            description: d.description || "",
            date: d.date || "",
            startHour: d.startHour ?? 9,
            endHour: d.endHour ?? 10,
            priority: d.priority || "medium",
            category: d.category || "general",
            completed: !!d.completed,
            sourceTaskId: d.sourceTaskId,
            googleCalendarEventId: d.googleCalendarEventId || undefined,
            googleCalendarHtmlLink: d.googleCalendarHtmlLink || undefined,
            syncedAt: d.syncedAt || undefined,
          });
        });
        if (items.length > 0) {
          setPlannerTasks(items);
        }
      },
      (error) => {
        console.warn("Error reading planner tasks:", error);
      }
    );

    return () => unsubscribe();
  }, [effectiveUid, setPlannerTasks]);

  // Save current goal to both "atomizations" root collection and user subcollection
  const saveGoalToFirestore = useCallback(
    async (goalToSave: Goal) => {
      if (!effectiveUid) return;

      // Always update offline cache immediately for offline resilience
      offlineSyncManager.enqueueGoal(effectiveUid, goalToSave);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSyncStatus("synced");
        setTimeout(() => setSyncStatus("idle"), 2500);
        return;
      }

      try {
        setSyncStatus("saving");
        const docData = {
          id: goalToSave.id,
          userId: effectiveUid,
          title: goalToSave.title,
          description: goalToSave.description,
          timeline: goalToSave.timeline || "",
          insight: goalToSave.insight || "",
          encouragement: goalToSave.encouragement || "",
          completed: goalToSave.completed,
          progress: goalToSave.progress,
          phases: goalToSave.phases,
          updatedAt: new Date().toISOString(),
        };

        // 1. Write to root atomizations collection (atom-i format)
        await setDoc(doc(db, "atomizations", goalToSave.id), docData, { merge: true });

        // 2. Also write to users subcollection for fast nested queries
        await setDoc(doc(db, "users", effectiveUid, "goals", goalToSave.id), docData, { merge: true });

        setSyncStatus("synced");
        setTimeout(() => setSyncStatus("idle"), 2500);
      } catch (err) {
        console.warn("Firestore save deferred to offline queue:", err);
        // Stays in offline queue for background sync!
        setSyncStatus("synced");
      }
    },
    [effectiveUid]
  );

  // Save planner task to Firestore
  const savePlannerTaskToFirestore = useCallback(
    async (task: PlannerTask) => {
      if (!effectiveUid) return;

      // Cache locally for offline resilience
      offlineSyncManager.enqueuePlannerTask(effectiveUid, task);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      try {
        const taskDocRef = doc(db, "users", effectiveUid, "planner", task.id);
        await setDoc(
          taskDocRef,
          {
            id: task.id,
            userId: effectiveUid,
            title: task.title,
            description: task.description || "",
            date: task.date,
            startHour: task.startHour,
            endHour: task.endHour,
            priority: task.priority,
            category: task.category,
            completed: task.completed,
            sourceTaskId: task.sourceTaskId || null,
            googleCalendarEventId: task.googleCalendarEventId || null,
            googleCalendarHtmlLink: task.googleCalendarHtmlLink || null,
            syncedAt: task.syncedAt || null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Failed to write planner task to Firestore (queued offline):", err);
      }
    },
    [effectiveUid]
  );

  // Delete planner task from Firestore
  const deletePlannerTaskFromFirestore = useCallback(
    async (taskId: string) => {
      if (!effectiveUid) return;
      try {
        const taskDocRef = doc(db, "users", effectiveUid, "planner", taskId);
        await deleteDoc(taskDocRef);
      } catch (err) {
        console.error("Failed to delete planner task from Firestore:", err);
      }
    },
    [effectiveUid]
  );

  // Load a specific goal from Firestore (either from atomizations or user goals)
  const loadGoalFromFirestore = useCallback(
    async (goalId: string) => {
      try {
        // Try atomizations root collection first
        let snap = await getDoc(doc(db, "atomizations", goalId));
        if (!snap.exists() && effectiveUid) {
          snap = await getDoc(doc(db, "users", effectiveUid, "goals", goalId));
        }

        if (snap.exists()) {
          const d = snap.data();
          if (d.phases && d.phases.length > 0) {
            setGoal(d as Goal);
          } else {
            // Document with title only (e.g. uqSmguXIeeE2EH2AUu5Qi)
            setGoal((prev) => ({
              ...prev,
              id: snap.id,
              title: d.title || prev.title,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load goal:", err);
      }
    },
    [effectiveUid, setGoal]
  );

  // Upgrade or change user tier (Updates Firestore users doc)
  const updateTier = useCallback(
    async (newTier: UserTier) => {
      if (!effectiveUid) return;
      const tierConfigMap: Record<UserTier, Partial<UserProfile>> = {
        operative: {
          tier: "operative",
          atomizationLimit: 3,
          hasCalendar: false,
          hasGrid: false,
          hasLiveVoice: false,
          voiceMinutesRemaining: 0,
          hasTeams: false,
        },
        tactical_pro: {
          tier: "tactical_pro",
          atomizationLimit: 999999,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: false,
          voiceMinutesRemaining: 15,
          hasTeams: false,
        },
        vanguard_live: {
          tier: "vanguard_live",
          atomizationLimit: 999999,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: true,
          voiceMinutesRemaining: 120,
          hasTeams: true,
          teamLimit: 5,
          featuredEligible: true,
        },
        founder_lifetime: {
          tier: "founder_lifetime",
          atomizationLimit: 999999,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: true,
          voiceMinutesRemaining: 60,
          isFounderLifetime: true,
          hasTeams: true,
          teamLimit: 3,
          featuredEligible: true,
        },
        trial: {
          tier: "operative",
          atomizationLimit: 3,
          hasCalendar: false,
          hasGrid: false,
          hasLiveVoice: false,
          voiceMinutesRemaining: 0,
          hasTeams: false,
        },
        package_1: {
          tier: "operative",
          atomizationLimit: 10,
          hasCalendar: false,
          hasGrid: false,
          hasLiveVoice: false,
          voiceMinutesRemaining: 0,
          hasTeams: false,
        },
        package_2: {
          tier: "tactical_pro",
          atomizationLimit: 999999,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: false,
          voiceMinutesRemaining: 15,
          hasTeams: true,
          teamLimit: 5,
        },
        package_3: {
          tier: "vanguard_live",
          atomizationLimit: 999999,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: true,
          voiceMinutesRemaining: 120,
          hasTeams: true,
          featuredEligible: true,
        },
      };

      const tierConfig = tierConfigMap[newTier] || tierConfigMap.operative;

      setUserProfile((prev) => ({
        ...prev,
        ...tierConfig,
      }));

      try {
        await setDoc(doc(db, "users", effectiveUid), tierConfig, { merge: true });
      } catch (err) {
        console.error("Failed to update user tier in Firestore:", err);
      }
    },
    [effectiveUid]
  );

  // Top up Live Voice Minutes (Option C)
  const addVoiceMinutes = useCallback(
    async (minutesToAdd: number) => {
      if (!effectiveUid) return;
      setUserProfile((prev) => {
        const nextMinutes = (prev.voiceMinutesRemaining || 0) + minutesToAdd;
        const updated = {
          ...prev,
          voiceMinutesRemaining: nextMinutes,
          hasLiveVoice: true,
        };
        setDoc(
          doc(db, "users", effectiveUid),
          {
            voiceMinutesRemaining: nextMinutes,
            hasLiveVoice: true,
          },
          { merge: true }
        ).catch((err) => console.warn("Could not persist voice credits:", err));
        return updated;
      });
    },
    [effectiveUid]
  );

  // Switch preferred AI Engine ('puter' | 'gemini')
  const setPreferredEngine = useCallback(
    async (engine: "puter" | "gemini") => {
      setUserProfile((prev) => ({ ...prev, preferredEngine: engine }));
      if (effectiveUid) {
        try {
          await setDoc(doc(db, "users", effectiveUid), { preferredEngine: engine }, { merge: true });
        } catch (e) {
          console.warn("Could not save preferred engine:", e);
        }
      }
    },
    [effectiveUid]
  );

  // Redeem VIP Promo, Upvoter Discount, or Voice Booster Code
  const redeemPromoCode = useCallback(
    async (rawCode: string) => {
      const match = validatePromoCode(rawCode);
      if (!match) {
        return { success: false, message: "Invalid or unrecognized VIP access code." };
      }

      // Check if user already redeemed this specific code
      const existingRedeemed = new Set<string>(userProfile.redeemedPromoCodes || []);
      try {
        const localStored = JSON.parse(localStorage.getItem("atom_redeemed_codes") || "[]");
        if (Array.isArray(localStored)) {
          localStored.forEach((c: string) => existingRedeemed.add(c));
        }
      } catch {
        // ignore
      }

      // Master creator key FAUX-VIP bypasses single-use lockout for testing
      if (match.code !== "FAUX-VIP" && existingRedeemed.has(match.code)) {
        return {
          success: false,
          message: `Code "${match.code}" has already been redeemed by your account. Each promotional code may only be redeemed once.`,
        };
      }

      const updatedRedeemedList = Array.from(existingRedeemed.add(match.code));
      let updatedProfile: Partial<UserProfile> = {
        redeemedPromoCodes: updatedRedeemedList,
      };
      let successMessage = `Activated ${match.label}!`;

      if (match.action === "voice_boost") {
        const added = match.bonusVoiceMinutes || 30;
        const currentRemaining = userProfile.voiceMinutesRemaining || 0;
        const newTotal = currentRemaining + added;
        updatedProfile = {
          voiceMinutesRemaining: newTotal,
          hasLiveVoice: true,
        };
        successMessage = `Injected +${added} Live Voice Minutes! Current Balance: ${newTotal} min.`;
      } else if (match.action === "founder_discount") {
        const discount = match.founderDiscountPercent || 50;
        const added = match.bonusVoiceMinutes || 0;
        updatedProfile = {
          founderDiscountPercent: discount,
          activeDiscountCode: match.code,
          voiceMinutesRemaining: (userProfile.voiceMinutesRemaining || 0) + added,
          hasLiveVoice: true,
        };
        successMessage = `Unlocked ${discount}% Off Lifetime Founder Pass ($49 instead of $99) + ${added} bonus voice minutes!`;
      } else {
        // "grant_tier"
        const isCreatorCode = match.code === "FAUX-VIP" || match.founderNumber === 0;
        const finalTier = isCreatorCode ? "founder_lifetime" : (match.tier || "tactical_pro");
        const isFounder = !!match.isFounder || isCreatorCode;
        const allocatedVoice =
          match.voiceMinutes !== undefined
            ? match.voiceMinutes
            : isCreatorCode
            ? 999999
            : (userProfile.voiceMinutesRemaining || 0) + (match.bonusVoiceMinutes || 30);

        updatedProfile = {
          tier: finalTier,
          atomizationLimit: 999999,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: true,
          voiceMinutesRemaining: allocatedVoice,
          isFounderLifetime: isFounder,
          isCreator: isCreatorCode || userProfile.isCreator,
          hasTeams: isFounder,
          teamLimit: isCreatorCode ? 20 : (isFounder ? 10 : 3),
          featuredEligible: isFounder,
          founderNumber:
            match.founderNumber !== undefined
              ? match.founderNumber
              : (isCreatorCode ? 0 : (isFounder ? (user?.email === "faux.fuax@gmail.com" ? 0 : 138) : undefined)),
          founderPromoCodeUsed: match.code,
          isVipPromo: true,
        };
        successMessage = `Activated ${match.label}! Tactical suite privileges verified.`;
      }

      setUserProfile((prev) => ({
        ...prev,
        ...updatedProfile,
      }));

      localStorage.setItem("atom_vip_promo", match.code);
      if (match.code === "FAUX-VIP" || match.founderNumber === 0 || updatedProfile.isCreator) {
        localStorage.setItem("atom_is_creator", "true");
      }
      try {
        localStorage.setItem("atom_redeemed_codes", JSON.stringify(updatedRedeemedList));
      } catch {
        // ignore
      }

      if (effectiveUid) {
        try {
          await setDoc(doc(db, "users", effectiveUid), updatedProfile, { merge: true });
          // Log immutable audit record
          await setDoc(
            doc(db, "promo_redemptions", `${match.code}_${effectiveUid}`),
            {
              code: match.code,
              userId: effectiveUid,
              userEmail: user?.email || userProfile.email || "anonymous",
              redeemedAt: new Date().toISOString(),
              action: match.action,
              label: match.label,
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("Could not save promo code elevation to Firestore:", e);
        }
      }

      return {
        success: true,
        message: successMessage,
        tierName: match.label,
      };
    },
    [effectiveUid, userProfile.voiceMinutesRemaining]
  );

  // Claim Physical Founder Freebie & Sticker Kit
  const claimFounderMerch = useCallback(
    async (details: {
      fullName: string;
      street: string;
      city: string;
      postalCode: string;
      country: string;
      notes?: string;
    }) => {
      const payload = {
        ...details,
        date: new Date().toISOString(),
      };

      setUserProfile((prev) => ({
        ...prev,
        founderMerchClaimed: true,
        founderMerchDetails: payload,
      }));

      localStorage.setItem("atom_founder_merch_claimed", "true");
      localStorage.setItem("atom_founder_merch_details", JSON.stringify(payload));

      if (effectiveUid) {
        try {
          await setDoc(
            doc(db, "users", effectiveUid),
            {
              founderMerchClaimed: true,
              founderMerchDetails: payload,
            },
            { merge: true }
          );
          await setDoc(
            doc(db, "founder_merch_claims", effectiveUid),
            {
              userId: effectiveUid,
              email: userProfile.email || "",
              founderNumber:
                userProfile.founderNumber !== undefined && userProfile.founderNumber !== null
                  ? userProfile.founderNumber
                  : (userProfile.email === "faux.fuax@gmail.com" ? 0 : 138),
              ...payload,
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("Could not save founder merch claim to Firestore:", e);
        }
      }
    },
    [effectiveUid, userProfile.email, userProfile.founderNumber]
  );

  return {
    syncStatus,
    userGoalsList,
    userProfile,
    successStories,
    effectiveUid,
    activePersonaId,
    setActivePersonaId,
    updateTier,
    addVoiceMinutes,
    setPreferredEngine,
    saveGoalToFirestore,
    savePlannerTaskToFirestore,
    deletePlannerTaskFromFirestore,
    loadGoalFromFirestore,
    redeemPromoCode,
    claimFounderMerch,
  };
}


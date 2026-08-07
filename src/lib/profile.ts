import { useCallback, useEffect, useState } from "react";

export type Profile = {
  name: string;
  age: string;
  gender: "" | "male" | "female";
  nationality: string;
  avatar?: string | undefined;
  sound: boolean;
  dark: boolean;
};

export const PROFILE_KEY = "mee3ad-profile";

export const DEFAULT_PROFILE: Profile = {
  name: "صديقي",
  age: "",
  gender: "",
  nationality: "",
  sound: true,
  dark: false,
};

export function greetingByHour(h: number) {
  if (h < 5) return { text: "ليلة هادئة", emoji: "🌙" };
  if (h < 12) return { text: "صباح الخير", emoji: "☀️" };
  if (h < 17) return { text: "نهارك سعيد", emoji: "🌤️" };
  return { text: "مساء الخير", emoji: "🌙" };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    document.documentElement.classList.toggle("dark", profile.dark);
  }, [profile, loaded]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  return { profile, loaded, updateProfile };
}

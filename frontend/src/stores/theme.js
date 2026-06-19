import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  dark: false,
  toggle: () => {
    const next = !get().dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sq-theme", next ? "dark" : "light");
    set({ dark: next });
  },
  init: () => {
    const stored = localStorage.getItem("sq-theme");
    const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    set({ dark });
  },
}));

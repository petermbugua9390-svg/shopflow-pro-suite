import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_HARDWARE, HardwareSettings, loadHardware, saveHardware, beep } from "@/lib/hardware";

export function useHardwareSettings() {
  const [settings, setSettings] = useState<HardwareSettings>(DEFAULT_HARDWARE);

  useEffect(() => {
    setSettings(loadHardware());
  }, []);

  const update = useCallback((patch: Partial<HardwareSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveHardware(next);
      return next;
    });
  }, []);

  return { settings, update };
}

/**
 * Global barcode-scanner wedge listener. USB scanners type very fast and end with Enter,
 * so we detect bursts of keystrokes outside of input fields.
 */
export function useBarcodeScanner(onScan: (code: string) => void, enabled = true) {
  const buffer = useRef("");
  const lastKey = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      const now = Date.now();
      if (now - lastKey.current > 120) buffer.current = "";
      lastKey.current = now;

      if (e.key === "Enter") {
        const code = buffer.current;
        buffer.current = "";
        if (code.length >= 4 && !typing) {
          e.preventDefault();
          onScan(code);
        }
        return;
      }
      if (e.key.length === 1) buffer.current += e.key;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onScan, enabled]);
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => {
      setOnline(true);
      beep(1000, 60);
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

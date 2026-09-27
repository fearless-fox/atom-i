import { useState, useEffect, useCallback } from "react";
import { cyberAudio } from "../lib/cyberAudio";

export function useCyberAudio() {
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  useEffect(() => {
    setIsAudioEnabled(cyberAudio.isEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const updated = cyberAudio.toggle();
    setIsAudioEnabled(updated);
    return updated;
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    cyberAudio.setEnabled(enabled);
    setIsAudioEnabled(enabled);
  }, []);

  const playClick = useCallback((pitch = 1.0) => {
    cyberAudio.playCyberClick(pitch);
  }, []);

  const playNodeSelect = useCallback(() => {
    cyberAudio.playNodeSelect();
  }, []);

  const playTaskToggle = useCallback((completed: boolean) => {
    cyberAudio.playTaskToggle(completed);
  }, []);

  const playDrawer = useCallback((isOpen: boolean) => {
    cyberAudio.playDrawerSlide(isOpen);
  }, []);

  const playBranchSuccess = useCallback(() => {
    cyberAudio.playBranchSuccess();
  }, []);

  const playGoalComplete = useCallback(() => {
    cyberAudio.playGoalComplete();
  }, []);

  return {
    isAudioEnabled,
    toggleSound,
    setSoundEnabled,
    playClick,
    playNodeSelect,
    playTaskToggle,
    playDrawer,
    playBranchSuccess,
    playGoalComplete,
  };
}

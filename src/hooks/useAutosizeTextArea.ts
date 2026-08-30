import React, { useLayoutEffect } from "react";

export function useAutosizeTextArea(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  onHeightChange?: (isMultiline: boolean) => void
) {
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      const prevTransition = textarea.style.transition;
      textarea.style.transition = "none";
      
      const prevHeight = textarea.style.height;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      
      textarea.style.height = prevHeight;
      
      const singleLineHeight = 38;
      const targetHeight = Math.min(Math.max(scrollHeight, singleLineHeight), 140);
      
      void textarea.offsetHeight;
      
      textarea.style.transition = prevTransition;
      textarea.style.height = `${targetHeight}px`;
      
      if (onHeightChange) {
        onHeightChange(scrollHeight > 48);
      }
    }
  }, [ref, value, onHeightChange]);
}

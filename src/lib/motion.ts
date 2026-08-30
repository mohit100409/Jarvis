import { Variants, Transition } from "motion/react";

export const duration = {
  instant: 0.12,
  fast: 0.18,
  normal: 0.24,
  page: 0.32,
  drawer: 0.36
};

// Explicitly type the bezier curves as a tuple
type BezierCurve = [number, number, number, number];

export const ease = {
  standard: [0.2, 0, 0, 1] as BezierCurve,
  enter: [0.05, 0.7, 0.1, 1] as BezierCurve,
  exit: [0.3, 0, 1, 1] as BezierCurve
};

// Common Transitions
export const transitionStandard: Transition = {
  duration: duration.normal,
  ease: ease.standard
};

export const transitionEnter: Transition = {
  duration: duration.normal,
  ease: ease.enter
};

export const transitionExit: Transition = {
  duration: duration.fast,
  ease: ease.exit
};

export const transitionSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8
};

// Reusable Variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionEnter },
  exit: { opacity: 0, transition: transitionExit }
};

export const scaleFadeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitionEnter },
  exit: { opacity: 0, scale: 0.96, transition: transitionExit }
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitionEnter },
  exit: { opacity: 0, y: 12, transition: transitionExit }
};

export const pageVariants: Variants = {
  hidden: (direction: number = 1) => ({
    opacity: 0,
    x: direction > 0 ? 30 : -30,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: transitionSpring
  },
  exit: (direction: number = 1) => ({
    opacity: 0,
    x: direction > 0 ? -30 : 30,
    transition: { ...transitionSpring, stiffness: 350, damping: 35 }
  })
};

export const slideHorizontalVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: transitionEnter },
  exit: { opacity: 0, x: 30, transition: transitionExit }
};

export const drawerVariants: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: transitionSpring },
  exit: { x: "-100%", transition: { ...transitionSpring, stiffness: 350, damping: 35 } }
};

export const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitionEnter },
  exit: { opacity: 0, scale: 0.94, y: 8, transition: transitionExit }
};

export const settingsContainerVariants: Variants = {
  hidden: {
    opacity: 0.8,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.05,
    },
  },
};

export const settingsItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 28,
      mass: 0.8,
    },
  },
};

export const _buttonTap = { scale: 0.97 };

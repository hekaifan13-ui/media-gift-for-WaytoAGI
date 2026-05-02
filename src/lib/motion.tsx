// @ts-nocheck
// Simple motion stub - replaces framer-motion/motion with CSS transitions
import React from 'react';

const makeMotionComponent = (tag: string) => {
  const Component = React.forwardRef(({ children, className, style, initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, onClick, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, ...rest }, ref) => {
    return React.createElement(tag, { ref, className, style, onClick, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, ...rest }, children);
  });
  Component.displayName = `motion.${tag}`;
  return Component;
};

export const motion = new Proxy({}, {
  get: (_target, prop: string) => makeMotionComponent(prop),
}) as any;

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

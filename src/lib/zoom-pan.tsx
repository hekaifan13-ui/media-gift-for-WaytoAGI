// @ts-nocheck
// Lightweight zoom/pan wrapper - replaces react-zoom-pan-pinch.
// Provides TransformWrapper + TransformComponent with wheel zoom and drag pan.

import React, { useRef, useState, useCallback, useEffect, CSSProperties } from 'react';

type Transform = { scale: number; x: number; y: number };

type WrapperProps = {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  centerOnInit?: boolean;
  wheel?: { step?: number };
  doubleClick?: { disabled?: boolean };
  children: (controls: {
    zoomIn: () => void;
    zoomOut: () => void;
    resetTransform: () => void;
  }) => React.ReactNode;
};

type Ctx = {
  transform: Transform;
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
  minScale: number;
  maxScale: number;
  step: number;
  containerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  centerOnInit: boolean;
};

const TransformContext = React.createContext<Ctx | null>(null);

export const TransformWrapper: React.FC<WrapperProps> = ({
  initialScale = 1,
  minScale = 0.1,
  maxScale = 4,
  centerOnInit = false,
  wheel,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: initialScale, x: 0, y: 0 });
  const step = wheel?.step ?? 0.1;

  const clamp = useCallback((s: number) => Math.min(maxScale, Math.max(minScale, s)), [minScale, maxScale]);

  const zoomIn = useCallback(() => setTransform((t) => ({ ...t, scale: clamp(t.scale * (1 + step)) })), [clamp, step]);
  const zoomOut = useCallback(() => setTransform((t) => ({ ...t, scale: clamp(t.scale / (1 + step)) })), [clamp, step]);
  const resetTransform = useCallback(() => setTransform({ scale: initialScale, x: 0, y: 0 }), [initialScale]);

  const ctx: Ctx = {
    transform,
    setTransform,
    minScale,
    maxScale,
    step,
    containerRef,
    contentRef,
    centerOnInit,
  };

  return (
    <TransformContext.Provider value={ctx}>
      {children({ zoomIn, zoomOut, resetTransform })}
    </TransformContext.Provider>
  );
};

type ComponentProps = {
  wrapperStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  children: React.ReactNode;
};

export const TransformComponent: React.FC<ComponentProps> = ({ wrapperStyle, contentStyle, children }) => {
  const ctx = React.useContext(TransformContext);
  if (!ctx) return <>{children}</>;
  const { transform, setTransform, minScale, maxScale, containerRef, contentRef, centerOnInit } = ctx;

  // Center content on init
  useEffect(() => {
    if (!centerOnInit) return;
    const c = containerRef.current;
    const inner = contentRef.current;
    if (!c || !inner) return;
    const cw = c.clientWidth;
    const ch = c.clientHeight;
    const iw = inner.scrollWidth;
    const ih = inner.scrollHeight;
    setTransform((t) => ({ ...t, x: (cw - iw * t.scale) / 2, y: (ch - ih * t.scale) / 2 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel zoom centered on cursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setTransform((t) => {
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const ratio = newScale / t.scale;
      const nx = px - (px - t.x) * ratio;
      const ny = py - (py - t.y) * ratio;
      return { scale: newScale, x: nx, y: ny };
    });
  }, [containerRef, minScale, maxScale, setTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, containerRef]);

  // Drag to pan
  const dragState = useRef<{ active: boolean; sx: number; sy: number; ox: number; oy: number }>({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, [contenteditable="true"], [data-no-pan="true"]')) return;
    dragState.current = { active: true, sx: e.clientX, sy: e.clientY, ox: transform.x, oy: transform.y };
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.sx;
      const dy = e.clientY - dragState.current.sy;
      setTransform((t) => ({ ...t, x: dragState.current.ox + dx, y: dragState.current.oy + dy }));
    };
    const up = () => { dragState.current.active = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [setTransform]);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'grab', ...wrapperStyle }}
    >
      <div
        ref={contentRef}
        style={{
          transformOrigin: '0 0',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          willChange: 'transform',
          display: 'inline-block',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

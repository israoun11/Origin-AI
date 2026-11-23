import { Component, lazy, ReactNode, Suspense, useEffect, useState } from 'react';
import { BeanArt } from './ui';

const Hero3D = lazy(() => import('./Hero3D'));

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/** 3D only on capable desktop screens without reduced-motion; otherwise a lightweight static composition. */
export default function HeroVisual() {
  const [use3d, setUse3d] = useState(false);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setUse3d(wide && !calm && webglOk());
  }, []);
  const fallback = <BeanArt className="h-full w-full object-contain opacity-95" />;
  if (!use3d) return fallback;
  return <Boundary fallback={fallback}><Suspense fallback={fallback}><Hero3D /></Suspense></Boundary>;
}

"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";

import { gsap, ScrollTrigger } from "./gsap";

const LENIS_OPTIONS: LenisOptions = {
  anchors: true,
  autoRaf: false,
  lerp: 0.09,
  respectReducedMotion: true,
  smoothWheel: true,
  stopInertiaOnNavigate: true,
  syncTouch: false,
};

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis options={LENIS_OPTIONS} root>
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}

function LenisGsapBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) {
      return;
    }

    const updateLenis = (time: number) => lenis.raf(time * 1000);
    const unsubscribe = lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      unsubscribe();
      gsap.ticker.remove(updateLenis);
    };
  }, [lenis]);

  return null;
}

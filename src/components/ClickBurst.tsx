"use client";

import { useEffect } from "react";

const COLORS = ["#ff6b6b", "#ffd166", "#4dd4ac", "#4d96ff", "#c77dff", "#ff8fab", "#ffffff"];

export default function ClickBurst() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const count = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const particle = document.createElement("span");
        particle.className = "click-burst-particle";
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const distance = 26 + Math.random() * 46;
        const size = 4 + Math.random() * 4;
        particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        document.body.appendChild(particle);
        particle.addEventListener("animationend", () => particle.remove());
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

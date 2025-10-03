import React, { useEffect, useRef, useState } from 'react';
import './HyprStarfield.css';

type Props = {
    delayMs?: number;
};

export default function HyprStarfield({ delayMs = 10000 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number>();
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const shouldRunRef = useRef<boolean>(false);
    const inactivityTimer = useRef<number | null>(null);
    const stepRef = useRef<(() => void) | null>(null);

    const [isIdle, setIsIdle] = useState<boolean>(false);

    // Canvas setup and animation loop
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d', { alpha: true })!;

        let width = 0;
        let height = 0;
        let dpr = Math.max(1, window.devicePixelRatio || 1);

        type Star = {
            x: number;
            y: number;
            r: number;
            speed: number;
            alpha: number;
        };
        let stars: Star[] = [];

        function rand(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        function resize(w: number, h: number) {
            dpr = Math.max(1, window.devicePixelRatio || 1);
            width = Math.floor(w);
            height = Math.floor(h);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // create stars based on area
            const area = width * height;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            const density = 0.00018;
            const targetCount = Math.max(60, Math.min(800, Math.floor(area * density)));
            stars = new Array(targetCount).fill(0).map(() => {
                // radius and speed correlate to create parallax effect
                const layer = Math.random();
                const r = layer < 0.75 ? rand(0.6, 1.1) : layer < 0.95 ? rand(1.1, 1.8) : rand(1.8, 2.6);
                const speed = (r * rand(16, 28)) / 60; // px per frame at 60fps
                const alpha = layer < 0.85 ? rand(0.35, 0.6) : rand(0.6, 0.9);
                return { x: Math.random() * width, y: Math.random() * height, r, speed, alpha };
            });
        }

        function step() {
            // clear frame
            ctx.clearRect(0, 0, width, height);

            // star color from CSS var with fallback
            const rootStyles = getComputedStyle(document.documentElement);
            const textColor = rootStyles.getPropertyValue('--color-text')?.trim() || '#e5e7eb';

            // movement vector from bottom-left to top-right
            const dirX = 1;
            const dirY = -1;
            const len = Math.hypot(dirX, dirY) || 1;
            const nx = dirX / len;
            const ny = dirY / len;

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.x += nx * s.speed;
                s.y += ny * s.speed;

                // wrap around using modulo to maintain uniform density across the canvas
                if (s.x > width) s.x -= width;
                if (s.x < 0) s.x += width;
                if (s.y > height) s.y -= height;
                if (s.y < 0) s.y += height;

                // draw star with a small glow
                ctx.globalAlpha = s.alpha;
                ctx.fillStyle = textColor;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();

                // subtle elongated motion blur along movement
                ctx.globalAlpha = s.alpha * 0.35;
                ctx.strokeStyle = textColor;
                ctx.lineWidth = Math.max(0.5, s.r * 0.6);
                ctx.beginPath();
                ctx.moveTo(s.x - nx * s.speed * 1.5, s.y - ny * s.speed * 1.5);
                ctx.lineTo(s.x, s.y);
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            if (shouldRunRef.current) {
                animationRef.current = requestAnimationFrame(step);
            }
        }

        // expose step
        stepRef.current = step;

        // initial size binding
        const parent = canvas.parentElement!;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Use the element's client box (includes padding) so the canvas truly fills the padded area
                const el = entry.target as HTMLElement;
                const w = el.clientWidth;
                const h = el.clientHeight;
                resize(w, h);
            }
        });
        ro.observe(parent);
        resizeObserverRef.current = ro;

        // initial clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
            stepRef.current = null;
        };
    }, []);

    // Start/stop animation based on idle state
    useEffect(() => {
        if (isIdle) {
            if (!shouldRunRef.current) {
                shouldRunRef.current = true;
                // start the real animation loop
                if (stepRef.current) {
                    animationRef.current = requestAnimationFrame(stepRef.current);
                }
            }
        } else {
            // stop animation
            shouldRunRef.current = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }
        }
    }, [isIdle]);

    // Inactivity detection
    useEffect(() => {
        const resetTimer = () => {
            // on user activity: hide and stop
            setIsIdle(false);
            if (inactivityTimer.current) {
                window.clearTimeout(inactivityTimer.current);
                inactivityTimer.current = null;
            }
            inactivityTimer.current = window.setTimeout(() => {
                setIsIdle(true);
            }, delayMs);
        };

        // seed initial idle reveal after delay
        inactivityTimer.current = window.setTimeout(() => setIsIdle(true), delayMs);

        const opts = { passive: true } as AddEventListenerOptions;
        window.addEventListener('mousemove', resetTimer, opts);
        window.addEventListener('mousedown', resetTimer, opts);
        window.addEventListener('keydown', resetTimer, opts);
        window.addEventListener('wheel', resetTimer, opts);
        window.addEventListener('touchstart', resetTimer, opts);
        window.addEventListener('pointermove', resetTimer, opts);
        // capture scrolls from any element
        window.addEventListener('scroll', resetTimer, { capture: true, passive: true });
        document.addEventListener('scroll', resetTimer, { capture: true, passive: true });

        return () => {
            if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current);
            window.removeEventListener('mousemove', resetTimer, opts);
            window.removeEventListener('mousedown', resetTimer, opts);
            window.removeEventListener('keydown', resetTimer, opts);
            window.removeEventListener('wheel', resetTimer, opts);
            window.removeEventListener('touchstart', resetTimer, opts);
            window.removeEventListener('pointermove', resetTimer, opts);
            window.removeEventListener('scroll', resetTimer, { capture: true } as any);
            document.removeEventListener('scroll', resetTimer, { capture: true } as any);
        };
    }, [delayMs]);

    return (
        <canvas ref={canvasRef} className={`hypr-starfield-canvas ${isIdle ? 'is-visible' : ''}`} aria-hidden="true" />
    );
}

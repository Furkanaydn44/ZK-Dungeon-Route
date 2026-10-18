import React, { useEffect, useRef, useState } from 'react';

// Direction vectors: 1=North, 2=South, 3=East, 4=West
const DIR = { 1: [0, -1], 2: [0, 1], 3: [1, 0], 4: [-1, 0] };

// Canvas palette
const C = {
    bg:             '#080a10',
    floor:          '#13151e',
    floorBorder:    '#1c1f2e',
    floorAlt:       '#111420',   // checkerboard alt
    trail:          'rgba(124,92,252,0.38)',
    trailBorder:    'rgba(160,125,255,0.55)',
    start:          'rgba(52,211,153,0.35)',
    startBorder:    'rgba(52,211,153,0.55)',
    player:         '#a07dff',
    playerCore:     '#7c5cfc',
    playerGlow:     'rgba(124,92,252,0.7)',
    treasure:       '#f5c842',
    treasureGlow:   'rgba(245,200,66,0.75)',
    gridLine:       '#0e1018',
};

function drawDungeon(ctx, gridW, gridH, CELL, GAP, sx, sy, tx, ty, visitedSet, px, py, treasurePulse) {
    const STEP = CELL + GAP;
    const W = gridW * STEP;
    const H = gridH * STEP;

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    for (let row = 0; row < gridH; row++) {
        for (let col = 0; col < gridW; col++) {
            const x = col * STEP;
            const y = row * STEP;
            const key = `${col},${row}`;

            const isTreasure = col === tx && row === ty;
            const isPlayer   = col === px && row === py;
            const isStart    = col === sx && row === sy && !isPlayer;
            const isVisited  = visitedSet.has(key) && !isPlayer && !isTreasure;

            if (isTreasure) {
                // Treasure: pulsing gold block
                const gSize = CELL + treasurePulse * 2;
                const gOff  = -treasurePulse;
                const grd = ctx.createRadialGradient(x + CELL/2, y + CELL/2, 0, x + CELL/2, y + CELL/2, gSize);
                grd.addColorStop(0, 'rgba(245,200,66,0.9)');
                grd.addColorStop(1, 'rgba(245,200,66,0)');
                ctx.fillStyle = grd;
                ctx.fillRect(x + gOff, y + gOff, gSize * 2, gSize * 2);

                ctx.shadowColor = C.treasureGlow;
                ctx.shadowBlur  = 10 + treasurePulse * 3;
                ctx.fillStyle   = C.treasure;
                roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 2);
                ctx.fill();
                ctx.shadowBlur  = 0;

                // Gem cross
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillRect(x + CELL/2 - 1, y + 2, 2, CELL - 4);
                ctx.fillRect(x + 2, y + CELL/2 - 1, CELL - 4, 2);

            } else if (isPlayer) {
                // Player: glowing purple square
                ctx.shadowColor = C.playerGlow;
                ctx.shadowBlur  = 12;
                ctx.fillStyle   = C.playerCore;
                roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Inner highlight
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillRect(x + 2, y + 2, CELL - 4, Math.floor(CELL / 2) - 1);

                // Sword pixel
                if (CELL >= 9) {
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.fillRect(x + Math.floor(CELL/2) - 1, y + 2, 2, CELL - 4);
                    ctx.fillRect(x + 2, y + Math.floor(CELL/2) - 1, CELL - 4, 2);
                }

            } else if (isStart) {
                ctx.fillStyle = C.start;
                roundRect(ctx, x, y, CELL, CELL, 1);
                ctx.fill();
                ctx.strokeStyle = C.startBorder;
                ctx.lineWidth = 0.8;
                ctx.stroke();

            } else if (isVisited) {
                ctx.fillStyle = C.trail;
                roundRect(ctx, x, y, CELL, CELL, 1);
                ctx.fill();
                ctx.strokeStyle = C.trailBorder;
                ctx.lineWidth = 0.5;
                ctx.stroke();

            } else {
                // Stone floor — checkerboard subtle
                ctx.fillStyle = (col + row) % 2 === 0 ? C.floor : C.floorAlt;
                ctx.fillRect(x, y, CELL, CELL);
                ctx.strokeStyle = C.floorBorder;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
            }
        }
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export default function DungeonMap({ startX, startY, treasureX, treasureY, path, onAnimationComplete }) {
    const canvasRef   = useRef(null);
    const animRef     = useRef(null);
    const pulseRef    = useRef(null);
    const stateRef    = useRef({ visited: null, px: 0, py: 0, pulse: 0 });

    const [animStep,  setAnimStep]  = useState(0);
    const [animDone,  setAnimDone]  = useState(false);
    const [animating, setAnimating] = useState(false);

    const sx = Number(startX), sy = Number(startY);
    const tx = Number(treasureX), ty = Number(treasureY);

    const gridW = Math.max(tx, sx) + 6;
    const gridH = Math.max(ty, sy) + 6;
    const CELL  = Math.max(7, Math.min(11, Math.floor(480 / Math.max(gridW, gridH))));
    const GAP   = 1;
    const STEP  = CELL + GAP;

    const canvasW = gridW * STEP;
    const canvasH = gridH * STEP;

    // Redraw helper using current stateRef
    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { visited, px, py, pulse } = stateRef.current;
        drawDungeon(ctx, gridW, gridH, CELL, GAP, sx, sy, tx, ty, visited || new Set([`${sx},${sy}`]), px, py, pulse);
    };

    // Treasure pulse animation (runs continuously)
    useEffect(() => {
        let t = 0;
        const tick = () => {
            t += 0.08;
            stateRef.current.pulse = Math.sin(t) * 2 + 2;
            redraw();
            pulseRef.current = requestAnimationFrame(tick);
        };
        pulseRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(pulseRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sx, sy, tx, ty, gridW, gridH, CELL]);

    // Reset when coords change
    useEffect(() => {
        if (animRef.current) clearTimeout(animRef.current);
        stateRef.current.visited = new Set([`${sx},${sy}`]);
        stateRef.current.px = sx;
        stateRef.current.py = sy;
        setAnimStep(0);
        setAnimDone(false);
        setAnimating(false);
        redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sx, sy, tx, ty]);

    // Path animation
    useEffect(() => {
        if (!path) return;
        if (animRef.current) clearTimeout(animRef.current);

        const visited = new Set([`${sx},${sy}`]);
        stateRef.current.visited = visited;
        stateRef.current.px = sx;
        stateRef.current.py = sy;

        let x = sx, y = sy, step = 0;
        setAnimStep(0);
        setAnimDone(false);
        setAnimating(true);

        const tick = () => {
            if (step >= path.length) {
                setAnimDone(true);
                setAnimating(false);
                if (onAnimationComplete) onAnimationComplete();
                return;
            }
            const dir = path[step];
            const [dx, dy] = DIR[dir] || [0, 0];
            x += dx; y += dy;
            visited.add(`${x},${y}`);
            stateRef.current.px = x;
            stateRef.current.py = y;
            setAnimStep(step + 1);
            step++;
            animRef.current = setTimeout(tick, 38);
        };
        animRef.current = setTimeout(tick, 200);

        return () => { if (animRef.current) clearTimeout(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path]);

    const pct = path ? Math.round((animStep / path.length) * 100) : 0;

    return (
        <div className="dungeon-map-container">
            {/* Header */}
            <div className="dungeon-map-header">
                <span className="dungeon-map-title">🗺️ Zindan Haritası</span>
                <div className="dungeon-map-coords">
                    <span className="dmc-badge dmc-badge--start">⚔️ ({sx},{sy})</span>
                    <span className="dmc-sep">→</span>
                    <span className="dmc-badge dmc-badge--treasure">💎 ({tx},{ty})</span>
                </div>
            </div>

            {/* Canvas */}
            <div className="dungeon-canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={canvasW}
                    height={canvasH}
                    className="dungeon-canvas"
                />
            </div>

            {/* Progress bar */}
            {path && (
                <div className="dungeon-progress">
                    <div className="dp-bar">
                        <div className="dp-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="dp-label">
                        {animDone
                            ? '🏆 Hazine bulundu! 100 adım gizli kaldı.'
                            : animating
                                ? `⚔️ ${animStep} / ${path.length} adım yürünüyor...`
                                : ''}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="dungeon-legend">
                <div className="dl-item"><div className="dl-dot dl-dot--player"></div><span>Oyuncu</span></div>
                <div className="dl-item"><div className="dl-dot dl-dot--treasure"></div><span>Hazine ({tx},{ty})</span></div>
                <div className="dl-item"><div className="dl-dot dl-dot--trail"></div><span>Gizli Rota</span></div>
                <div className="dl-item"><div className="dl-dot dl-dot--floor"></div><span>Zindan Taşları</span></div>
            </div>
        </div>
    );
}

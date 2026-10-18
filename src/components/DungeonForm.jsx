import React, { useState } from 'react';
import { generatePath, validatePath } from '../utils/pathGenerator';
import DungeonMap from './DungeonMap';

// ─── Contract-defined treasure location ──────────────────────────────────────
// These MUST match the values used when DungeonGate was deployed.
// Change here only if you redeploy with different coordinates.
const CONTRACT_TREASURE_X = Number(import.meta.env.VITE_TREASURE_X ?? 50);
const CONTRACT_TREASURE_Y = Number(import.meta.env.VITE_TREASURE_Y ?? 50);

export default function DungeonForm({ onProve }) {
    const [startX,  setStartX]  = useState(0);
    const [startY,  setStartY]  = useState(0);
    // Treasure is FIXED by the deployed contract — never user-editable
    const treasureX = CONTRACT_TREASURE_X;
    const treasureY = CONTRACT_TREASURE_Y;

    const [generatedPath, setPath]  = useState(null);
    const [mapPath, setMapPath]     = useState(null);
    const [pathError, setPathError] = useState('');
    const [animDone,  setAnimDone]  = useState(false);

    const sx = Number(startX), sy = Number(startY);
    const manhattan   = Math.abs(treasureX - sx) + Math.abs(treasureY - sy);
    const coordsValid = manhattan <= 100 && manhattan > 0;

    const resetPath = () => {
        setPath(null);
        setMapPath(null);
        setAnimDone(false);
        setPathError('');
    };

    const handleCoord = (setter) => (e) => { setter(e.target.value); resetPath(); };

    const handleGenerate = () => {
        resetPath();
        try {
            const path = generatePath(sx, sy, treasureX, treasureY);
            const v = validatePath(path, sx, sy, treasureX, treasureY);
            if (!v.valid) { setPathError(v.error || 'Rota doğrulaması başarısız.'); return; }
            setPath(path);
            setTimeout(() => setMapPath(path), 50);
        } catch (err) {
            setPathError(err.message);
        }
    };

    const handleProve = () => {
        if (!generatedPath) return;
        onProve(generatedPath, sx, sy, treasureX, treasureY);
    };

    return (
        <>
            {/* Step Indicator */}
            <div className="steps">
                <div className="step"><div className="step__dot step__dot--active">1</div></div>
                <div className="step__line"></div>
                <div className="step"><div className="step__dot step__dot--pending">2</div></div>
                <div className="step__line"></div>
                <div className="step"><div className="step__dot step__dot--pending">3</div></div>
            </div>

            {/* ── Dungeon Map ── */}
            <DungeonMap
                startX={sx}
                startY={sy}
                treasureX={treasureX}
                treasureY={treasureY}
                path={mapPath}
                onAnimationComplete={() => setAnimDone(true)}
            />

            {/* ── Coordinate Inputs ── */}
            <div className="dungeon-grid-section">
                <label className="form__label">⚔️ Zindan Koordinatları</label>
                <div className="coord-grid">

                    {/* START — user editable */}
                    <div className="coord-group">
                        <span className="coord-label">🚀 Başlangıç <span className="coord-label-sub">(Seçilebilir)</span></span>
                        <div className="coord-inputs">
                            <div className="coord-field">
                                <label className="coord-sublabel">X</label>
                                <input id="start-x" className="form__input form__input--coord"
                                    type="number" min="0" max="99" value={startX}
                                    onChange={handleCoord(setStartX)} />
                            </div>
                            <div className="coord-field">
                                <label className="coord-sublabel">Y</label>
                                <input id="start-y" className="form__input form__input--coord"
                                    type="number" min="0" max="99" value={startY}
                                    onChange={handleCoord(setStartY)} />
                            </div>
                        </div>
                    </div>

                    <div className="coord-arrow">→</div>

                    {/* TREASURE — locked by contract */}
                    <div className="coord-group">
                        <span className="coord-label">
                            💎 Hazine
                            <span className="contract-lock-badge">🔒 Kontrat</span>
                        </span>
                        <div className="coord-inputs">
                            <div className="coord-field">
                                <label className="coord-sublabel">X</label>
                                <input
                                    id="treasure-x"
                                    className="form__input form__input--coord form__input--locked"
                                    type="number"
                                    value={treasureX}
                                    readOnly
                                    title="Kontrat deploy edilirken sabitlendi — değiştirilemez"
                                />
                            </div>
                            <div className="coord-field">
                                <label className="coord-sublabel">Y</label>
                                <input
                                    id="treasure-y"
                                    className="form__input form__input--coord form__input--locked"
                                    type="number"
                                    value={treasureY}
                                    readOnly
                                    title="Kontrat deploy edilirken sabitlendi — değiştirilemez"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lock explanation */}
                <div className="contract-lock-info">
                    <span>🔒</span>
                    <span>
                        Hazine koordinatları <code>DungeonGate.sol</code> deploy edilirken sabitlendi.
                        Kontrat, yalnızca <strong>({treasureX}, {treasureY})</strong> hedefli kanıtları kabul eder.
                        Bu, ZK sisteminin <strong>soundness</strong> özelliğini gösterir.
                    </span>
                </div>

                <div className={`manhattan-badge ${coordsValid ? 'manhattan-badge--ok' : 'manhattan-badge--warn'}`}>
                    <span>Manhattan Mesafesi:</span>
                    <strong>{manhattan} adım</strong>
                    {!coordsValid && <span className="manhattan-warn">&nbsp;(max 100, min 1)</span>}
                </div>
            </div>

            {/* Padding explanation */}
            {coordsValid && (
                <div className="padding-info">
                    <span className="padding-info__icon">🔀</span>
                    <span>
                        <strong>{manhattan}</strong> zorunlu adım +&nbsp;
                        <strong>{100 - manhattan}</strong> nötr dolgu = toplam&nbsp;
                        <strong>100</strong> adım (karıştırılarak gizlenir)
                    </span>
                </div>
            )}

            {pathError && <div className="error-badge">⚠️ {pathError}</div>}

            {/* Info strip */}
            <div className="info-row">
                <div className="info-badge">
                    <span className="info-badge__label">Adım</span>
                    <span className="info-badge__value">100</span>
                </div>
                <div className="info-badge">
                    <span className="info-badge__label">Protokol</span>
                    <span className="info-badge__value">Groth16</span>
                </div>
                <div className="info-badge">
                    <span className="info-badge__label">On-chain</span>
                    <span className="info-badge__value">~200K gas</span>
                </div>
            </div>

            {/* Generate / Skip / Prove */}
            <button
                id="generate-path-button"
                className="btn btn--secondary"
                onClick={handleGenerate}
                disabled={!coordsValid}
            >
                🗺️ Gizli Rota Üret &amp; Animasyonu Başlat
            </button>

            {generatedPath && !animDone && (
                <button className="btn btn--skip" onClick={() => setAnimDone(true)}>
                    ⏭️ Animasyonu Atla
                </button>
            )}

            <button
                id="prove-button"
                className="btn btn--primary"
                disabled={!generatedPath || !animDone}
                onClick={handleProve}
            >
                {generatedPath && !animDone
                    ? '⏳ Animasyon tamamlanıyor...'
                    : '🔐 Zindan Rotasını Kanıtla (ZK-SNARK)'}
            </button>

            <div className="privacy-notice">
                <span className="privacy-notice__icon">🛡️</span>
                <span>
                    <strong>Gizlilik Garantisi:</strong> Harita animasyonu yalnızca gösterim amaçlıdır.
                    ZK kanıtı üretilirken 100 adım asla zincire gönderilmez — yalnızca
                    sabit boyutlu matematiksel kanıt iletilir.
                </span>
            </div>
        </>
    );
}

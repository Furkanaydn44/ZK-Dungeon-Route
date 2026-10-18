import React, { useState } from 'react';
import { submitDungeonProof } from '../utils/contractInteraction';

export default function ProofResult({ proof, publicSignals, onReset }) {
    const [onChainStatus, setOnChainStatus] = useState('idle'); // idle | sending | success | fail
    const [txHash, setTxHash] = useState('');
    const [onChainError, setOnChainError] = useState('');

    // Public signals layout from dungeonRoute.circom:
    // [0] = startX, [1] = startY, [2] = treasureX, [3] = treasureY
    const startX    = publicSignals[0];
    const startY    = publicSignals[1];
    const treasureX = publicSignals[2];
    const treasureY = publicSignals[3];

    const handleOnChainSubmit = async () => {
        setOnChainStatus('sending');
        setOnChainError('');
        try {
            const result = await submitDungeonProof(proof, publicSignals);
            setTxHash(result.txHash);
            setOnChainStatus(result.cleared ? 'success' : 'fail');
        } catch (err) {
            console.error('On-chain submission error:', err);
            if (err.message.includes('MetaMask')) {
                setOnChainError(err.message);
            } else if (err.message.includes('VITE_DUNGEON_ADDRESS')) {
                setOnChainError('Kontrat adresi tanımlı değil. Önce npm run deploy:local çalıştırın.');
            } else if (err.message.includes('treasureX mismatch') || err.message.includes('treasureY mismatch')) {
                setOnChainError('Hazine koordinatları kontrat ayarlarıyla eşleşmiyor.');
            } else {
                setOnChainError(`İşlem başarısız: ${err.reason || err.message}`);
            }
            setOnChainStatus('fail');
        }
    };

    return (
        <div className="result">
            {/* Step Indicator */}
            <div className="steps">
                <div className="step"><div className="step__dot step__dot--completed">✓</div></div>
                <div className="step__line step__line--active"></div>
                <div className="step"><div className="step__dot step__dot--completed">✓</div></div>
                <div className="step__line step__line--active"></div>
                <div className="step"><div className="step__dot step__dot--active">3</div></div>
            </div>

            {/* Success Banner */}
            <div className="result__status result__status--success">
                <span className="result__icon">🏆</span>
                <h2 className="result__title result__title--success">Kanıt Oluşturuldu!</h2>
                <p className="result__desc">
                    Zero-Knowledge kanıtı başarıyla üretildi.
                    100 adımlık gizli rotanız hiçbir zaman ifşa edilmedi.
                </p>
            </div>

            {/* ZKP Philosophy Box */}
            <div className="philosophy-box">
                <div className="philosophy-item">
                    <span className="philosophy-icon">🔒</span>
                    <div>
                        <strong>Gizlilik (Privacy)</strong>
                        <p>Rotanız tarayıcınızda kaldı. Zincire yalnızca 3 eliptik eğri noktası gönderildi.</p>
                    </div>
                </div>
                <div className="philosophy-item">
                    <span className="philosophy-icon">⚡</span>
                    <div>
                        <strong>Özlülük (Succinctness)</strong>
                        <p>100 adım off-chain hesaplandı. On-chain doğrulama sabit ~200K gas — adım sayısından bağımsız.</p>
                    </div>
                </div>
            </div>

            {/* Public Signals */}
            <div className="proof-section">
                <div className="proof-section__title">📊 Açık Sinyaller (Public Signals)</div>
                <div className="proof-signals">
                    <div className="proof-signal">
                        <span className="proof-signal__name">Başlangıç X</span>
                        <span className="proof-signal__value">{startX}</span>
                    </div>
                    <div className="proof-signal">
                        <span className="proof-signal__name">Başlangıç Y</span>
                        <span className="proof-signal__value">{startY}</span>
                    </div>
                    <div className="proof-signal">
                        <span className="proof-signal__name">Hazine X</span>
                        <span className="proof-signal__value proof-signal__value--gold">{treasureX} 🏆</span>
                    </div>
                    <div className="proof-signal">
                        <span className="proof-signal__name">Hazine Y</span>
                        <span className="proof-signal__value proof-signal__value--gold">{treasureY} 🏆</span>
                    </div>
                </div>
                <div className="signal-note">
                    ℹ️ Gizli adımlar (steps[100]) bu listede yer almıyor — ZKP gizliliği burada.
                </div>
            </div>

            {/* Proof Data */}
            <div className="proof-section">
                <div className="proof-section__title">🔑 Groth16 Kanıt Verisi (3 Nokta)</div>
                <div className="proof-data">
                    {JSON.stringify(proof, null, 2)}
                </div>
                <div className="signal-note">
                    ⚡ Bu sabit boyutlu yapı, 100 adımı temsil eder — succinctness kanıtı.
                </div>
            </div>

            {/* On-chain Verification */}
            <div className="proof-section">
                <div className="proof-section__title">⛓️ Blockchain Doğrulama (DungeonGate)</div>

                {onChainStatus === 'idle' && (
                    <button
                        id="onchain-verify-button"
                        className="btn btn--onchain"
                        onClick={handleOnChainSubmit}
                    >
                        🦊 MetaMask ile Zindan Temizleme Kaydı Oluştur
                    </button>
                )}

                {onChainStatus === 'sending' && (
                    <div className="verify-badge verify-badge--pending">
                        ⏳ İşlem gönderiliyor... DungeonGate.clearDungeon() çağrılıyor
                    </div>
                )}

                {onChainStatus === 'success' && (
                    <div className="onchain-success">
                        <div className="verify-badge verify-badge--success">
                            ✅ Zindan temizlendi! hasClearedDungeon[{'{siz}'}] = true
                        </div>
                        {txHash && (
                            <a
                                className="tx-link"
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                İşlemi Etherscan'da görüntüle ↗
                            </a>
                        )}
                    </div>
                )}

                {onChainStatus === 'fail' && (
                    <div>
                        <div className="verify-badge verify-badge--fail">
                            ❌ {onChainError || 'On-chain doğrulama başarısız'}
                        </div>
                        <button
                            className="btn btn--secondary"
                            onClick={() => { setOnChainStatus('idle'); setOnChainError(''); }}
                            style={{ marginTop: '0.5rem' }}
                        >
                            Tekrar Dene
                        </button>
                    </div>
                )}
            </div>

            <button id="reset-button" className="btn btn--secondary" onClick={onReset}>
                ← Yeni Rota Kanıtla
            </button>

            <div className="privacy-notice">
                <span className="privacy-notice__icon">🔒</span>
                <span>
                    <strong>Dikkat:</strong> Yukarıdaki açık sinyallerde rotanız yer almıyor.
                    Kanıt, yalnızca rotanın hedef koordinata ulaştığını ispatlar — adımlarınız gizli.
                </span>
            </div>
        </div>
    );
}

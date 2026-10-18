import React, { useState } from 'react';
import DungeonForm from './components/DungeonForm';
import ProofResult from './components/ProofResult';
import { generateDungeonProof } from './utils/generateProof';

export default function App() {
    const [state, setState] = useState('form'); // form | loading | result | error
    const [proof, setProof] = useState(null);
    const [publicSignals, setPublicSignals] = useState(null);
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState('');
    const [loadingPhase, setLoadingPhase] = useState(0); // 0-2 for step dots

    /**
     * Called by DungeonForm when the user clicks "Zindan Rotasını Kanıtla".
     * steps[] is the secret 100-element path — never leaves this function.
     */
    const handleProve = async (steps, startX, startY, treasureX, treasureY) => {
        setState('loading');
        setLoadingPhase(0);
        setLoadingStep('Devre yükleniyor (dungeonRoute.wasm)...');

        try {
            await new Promise(r => setTimeout(r, 300));
            setLoadingPhase(1);
            setLoadingStep('Witness hesaplanıyor (100 adım off-chain)...');

            await new Promise(r => setTimeout(r, 300));
            setLoadingPhase(2);
            setLoadingStep('Groth16 kanıtı oluşturuluyor...');

            const { proof, publicSignals } = await generateDungeonProof(
                steps, startX, startY, treasureX, treasureY
            );

            setProof(proof);
            setPublicSignals(publicSignals);
            setState('result');
        } catch (err) {
            console.error('Proof generation failed:', err);

            if (err.message?.includes('Assert Failed') || err.message?.includes('assert')) {
                setError('Devre kısıtı ihlali — rota hazine koordinatlarına ulaşmıyor.');
            } else if (err.message?.includes('wasm')) {
                setError('WASM dosyası bulunamadı. Önce "npm run setup" çalıştırın.');
            } else {
                setError(`Kanıt oluşturma hatası: ${err.message}`);
            }
            setState('error');
        }
    };

    const handleReset = () => {
        setState('form');
        setProof(null);
        setPublicSignals(null);
        setError('');
        setLoadingPhase(0);
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <span className="header__icon">⚔️</span>
                <h1 className="header__title">ZK-Dungeon Route</h1>
                <p className="header__subtitle">
                    Gizli 100-adımlık rotanızı ifşa etmeden zindan hazinesine ulaştığınızı kanıtlayın
                </p>
                <div className="header__tags">
                    <span className="header__tag header__tag--privacy">🔒 Gizlilik</span>
                    <span className="header__tag header__tag--succinct">⚡ Özlülük</span>
                    <span className="header__tag header__tag--zk">Groth16 ZK-SNARK</span>
                </div>
            </header>

            {/* Main Card */}
            <main className="card">
                {state === 'form' && <DungeonForm onProve={handleProve} />}

                {state === 'loading' && (
                    <div className="spinner-container">
                        {/* Step Indicator */}
                        <div className="steps">
                            <div className="step">
                                <div className={`step__dot ${loadingPhase >= 0 ? 'step__dot--completed' : 'step__dot--pending'}`}>
                                    {loadingPhase > 0 ? '✓' : '1'}
                                </div>
                            </div>
                            <div className={`step__line ${loadingPhase >= 1 ? 'step__line--active' : ''}`}></div>
                            <div className="step">
                                <div className={`step__dot ${loadingPhase > 1 ? 'step__dot--completed' : loadingPhase === 1 ? 'step__dot--active' : 'step__dot--pending'}`}>
                                    {loadingPhase > 1 ? '✓' : '2'}
                                </div>
                            </div>
                            <div className={`step__line ${loadingPhase >= 2 ? 'step__line--active' : ''}`}></div>
                            <div className="step">
                                <div className={`step__dot ${loadingPhase === 2 ? 'step__dot--active' : 'step__dot--pending'}`}>
                                    3
                                </div>
                            </div>
                        </div>

                        <div className="spinner dungeon-spinner"></div>
                        <div className="spinner-text">{loadingStep}</div>
                        <div className="spinner-text__detail">
                            ZK-SNARK kanıtı tarayıcınızda üretiliyor.
                            100 adım off-chain hesaplanıyor — bu işlem birkaç saniye sürebilir.
                        </div>
                        <div className="succinctness-note">
                            ⚡ Off-chain: O(n) hesaplama → On-chain: O(1) doğrulama
                        </div>
                    </div>
                )}

                {state === 'result' && (
                    <ProofResult
                        proof={proof}
                        publicSignals={publicSignals}
                        onReset={handleReset}
                    />
                )}

                {state === 'error' && (
                    <div className="result">
                        <div className="result__status result__status--fail">
                            <span className="result__icon">⚠️</span>
                            <h2 className="result__title result__title--fail">Hata</h2>
                            <p className="result__desc">{error}</p>
                        </div>
                        <button className="btn btn--secondary" onClick={handleReset}>
                            ← Tekrar Dene
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                <p className="footer__text">
                    Powered by{' '}
                    <a className="footer__link" href="https://docs.circom.io" target="_blank" rel="noopener">Circom</a>
                    {' '}&{' '}
                    <a className="footer__link" href="https://github.com/iden3/snarkjs" target="_blank" rel="noopener">SnarkJS</a>
                    {' '}— Groth16 zk-SNARK · Blokzincir Laboratuvarı Sunumu
                </p>
            </footer>
        </div>
    );
}

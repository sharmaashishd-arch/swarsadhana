/**
 * Sadhana UI Components
 * 
 * Handles all UI for:
 * - Exercise Browser
 * - Exercise Detail
 * - Robot Session
 * - Session Report
 */

class RobotRiyaazUI {
    constructor() {
        this.exerciseManager = null;
        this.robotSession = null;
        this.currentView = 'browser'; // browser, detail, session, report
        
        this.selectedExercise = null;
        this.selectedCategory = '';
        this.currentReport = null;
        this.currentSubdivision = 1;
        this.selectedMode = 'singAlong';
        
        // Audio components (exposed for Guruji)
        this.audioEngine = null;
        this.tanpura = null;
        this.tabla = null;
        this.swarSynth = null;
    }
    
    async init() {
        // Initialize audio components
        window.realisticAudioEngine = new RealisticAudioEngine();
        window.realisticTanpura = new RealisticTanpuraEngine(window.realisticAudioEngine);
        window.realisticTabla = new RealisticTablaEngine(window.realisticAudioEngine);
        window.realisticSwarSynth = new RealisticSwarSynth(window.realisticAudioEngine);
        
        // Store references for Guruji
        this.audioEngine = window.realisticAudioEngine;
        this.tanpura = window.realisticTanpura;
        this.tabla = window.realisticTabla;
        this.swarSynth = window.realisticSwarSynth;
        
        // Sync saptak from global setting
        if (typeof globalSaptak !== 'undefined' && window.SAPTAK) {
            this.audioEngine.setSaptak(globalSaptak);
        }
        
        // Initialize exercise manager
        this.exerciseManager = new ExerciseManager();
        window.exerciseManager = this.exerciseManager;
        
        // Initialize pitch detector
        const pitchDetector = new PitchDetector(window.realisticAudioEngine);
        this.pitchDetector = pitchDetector;
        
        // Initialize robot player
        const robotPlayer = new RobotPlayer(
            window.realisticAudioEngine,
            window.realisticTanpura,
            window.realisticTabla,
            window.realisticSwarSynth
        );
        await robotPlayer.init();
        
        // Initialize robot listener
        const robotListener = new RobotListener(pitchDetector);
        
        // Initialize robot session
        this.robotSession = new RobotSession(this.exerciseManager, robotPlayer, robotListener);
        
        this.robotSession.onStateChange(state => this.onSessionStateChange(state));
        this.robotSession.onSwar((event, index, total) => this.onSwarPlayed(event, index, total));
        this.robotSession.onBeat((beatIndex, swarIndex) => this.onBeatPlayed(beatIndex, swarIndex));
        this.robotSession.onGrade(grade => this.onGrade(grade));
        this.robotSession.onReport(report => this.onReport(report));
        
        // Load exercises
        await this.exerciseManager.loadExercises();
        
        // Render browser
        this.renderExerciseBrowser();
        
        console.log('🕉️ Sadhana UI initialized');
    }
    
    // ============================================
    // EXERCISE BROWSER
    // ============================================
    
    renderExerciseBrowser() {
        const container = document.getElementById('robot-riyaaz-content');
        if (!container) return;
        
        const categories = this.exerciseManager.categories;
        const activeCategory = (this.selectedCategory && categories.includes(this.selectedCategory))
            ? this.selectedCategory
            : categories[0];
        this.selectedCategory = activeCategory;
        
        let html = `
            <div class="exercise-browser">
                <div class="browser-header">
                    <h2>📚 Exercise Library</h2>
                    <p>Select an exercise to practice</p>
                </div>
                <div class="category-tabs">
                    ${categories.map(cat => `
                        <button class="category-tab ${cat === activeCategory ? 'active' : ''}" 
                                onclick="robotUI.filterByCategory('${cat}')">
                            ${cat}
                        </button>
                    `).join('')}
                </div>
                <div class="exercise-list" id="exercise-list">
                    ${this.renderExerciseList(activeCategory)}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.currentView = 'browser';
    }
    
    renderExerciseList(category) {
        const exercises = this.exerciseManager.getExercisesByCategory(category);
        
        if (exercises.length === 0) {
            return '<p class="no-exercises">No exercises in this category</p>';
        }
        
        return exercises.map(ex => {
            const taal = ex.taal_id ? this.exerciseManager.getTaal(ex.taal_id) : null;
            
            return `
                <div class="exercise-card" onclick="robotUI.openExercise('${ex.id}')">
                    <div class="exercise-card-header">
                        <h3>${ex.title}</h3>
                    </div>
                    <p class="exercise-desc">${ex.description || ''}</p>
                    <div class="exercise-meta">
                        ${taal ? `<span class="taal-tag">${taal.name} (${taal.beats} beats)</span>` : ''}
                        ${ex.swars_per_beat > 1 ? `<span class="speed-tag">${ex.swars_per_beat}x</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    filterByCategory(category) {
        this.selectedCategory = category;
        
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent.trim() === category);
        });
        
        document.getElementById('exercise-list').innerHTML = this.renderExerciseList(category);
    }
    
    // ============================================
    // EXERCISE DETAIL
    // ============================================
    
    openExercise(exerciseId) {
        const { exercise, events } = this.robotSession.selectExercise(exerciseId);
        this.selectedExercise = exercise;
        this.selectedCategory = exercise.category || this.selectedCategory;
        this.currentSubdivision = exercise.swars_per_beat || 1;
        this.robotSession.setSubdivision(this.currentSubdivision);
        
        const container = document.getElementById('robot-riyaaz-content');
        const taal = exercise.taal_id ? this.exerciseManager.getTaal(exercise.taal_id) : null;
        const defaults = this.exerciseManager.getAccompanimentDefaults();
        
        const swarDisplay = this.buildSwarDisplay(exercise);
        const sub = this.currentSubdivision;
        
        let html = `
            <div class="exercise-detail">
                <button class="back-btn" onclick="robotUI.renderExerciseBrowser()">
                    ← Back to Exercises
                </button>
                
                <div class="exercise-header">
                    <h2>${exercise.title}</h2>
                    <p>${exercise.description || ''}</p>
                </div>
                
                <div class="swar-display-section">
                    <h3>Swar Pattern</h3>
                    <div class="swar-display">
                        ${swarDisplay}
                    </div>
                </div>
                
                ${taal ? `
                <div class="taal-display-section">
                    <h3>${taal.name} (${taal.nameHindi || ''})</h3>
                    <div class="taal-grid" id="taal-grid">
                        ${this.buildTaalGrid(taal)}
                    </div>
                </div>
                ` : ''}
                
                <div class="session-controls">
                    <div class="accompaniment-defaults">
                        <div class="acc-badge ${defaults.tanpuraEnabled ? 'on' : 'off'}">
                            <span class="acc-icon">🎵</span> Tanpura ${defaults.tanpuraEnabled ? 'ON' : 'OFF'}
                        </div>
                        <div class="acc-badge ${defaults.tablaEnabled ? 'on' : 'off'}">
                            <span class="acc-icon">🥁</span> ${taal ? taal.name : 'Tabla'} ${defaults.tablaEnabled ? 'ON' : 'OFF'}
                        </div>
                        <div class="acc-badge on">
                            <span class="acc-icon">🎹</span> Saptak: ${this._getSaptakLabel()}
                        </div>
                    </div>
                    
                    <div class="subdivision-control">
                        <label>Speed: <span id="subdivision-value">${sub}x</span></label>
                        <div class="subdivision-selector" id="subdivision-selector">
                            <button onclick="robotUI.setSubdivision(1)" class="${sub === 1 ? 'active' : ''}">1x</button>
                            <button onclick="robotUI.setSubdivision(2)" class="${sub === 2 ? 'active' : ''}">2x</button>
                            <button onclick="robotUI.setSubdivision(4)" class="${sub === 4 ? 'active' : ''}">4x</button>
                        </div>
                    </div>
                    
                    <div class="mode-selector" id="mode-selector">
                        <button class="mode-btn active" data-mode="singAlong" onclick="robotUI.selectMode('singAlong')">🎶 Sing Along</button>
                        <button class="mode-btn" data-mode="guidedPractice" onclick="robotUI.selectMode('guidedPractice')">🎓 Guided</button>
                        <button class="mode-btn" data-mode="selfPractice" onclick="robotUI.selectMode('selfPractice')">🎧 Self Practice</button>
                    </div>
                    
                    <div class="accompaniment-toggles" id="accompaniment-toggles">
                        <button class="acc-chip on" id="tanpura-toggle" onclick="robotUI.toggleTanpura()">🎵 Tanpura ON</button>
                        <button class="acc-chip on" id="tabla-toggle" onclick="robotUI.toggleTabla()">${taal ? '🥁 ' + taal.name : '🥁 Tabla'} ON</button>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-start" onclick="robotUI.startSession()">
                            ▶ Start
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.currentView = 'detail';
        
        if (window.robotGurujiUI) {
            window.robotGurujiUI.setExercise(exercise);
        }
    }
    
    buildSwarDisplay(exercise) {
        let html = '';

        const useEnglish = window.globalSwarNotation === 'english';
        const aarohLabel = useEnglish ? 'Aaroh' : 'आरोह';
        const avrohLabel = useEnglish ? 'Avroh' : 'अवरोह';

        const renderSwarLine = (swars, label, direction) => {
            if (!swars) return '';

            const swarElements = swars.map(s => {
                if (s === '-') return '<span class="swar rest">-</span>';
                const swarInfo = this.exerciseManager.getSwarInfo(s) || {};
                return `<span class="swar" data-swar="${s}">${getSwarLabel(s, swarInfo)}</span>`;
            }).join('');

            return `
                <div class="swar-line ${direction}">
                    <span class="line-label">${label}</span>
                    <div class="swars">${swarElements}</div>
                </div>
            `;
        };

        const renderPhrases = (phrases, label, direction) => {
            if (!phrases) return '';

            return `
                <div class="swar-phrases ${direction}">
                    <span class="line-label">${label}</span>
                    <div class="phrases">
                        ${phrases.map(phrase => `
                            <div class="phrase">
                                ${phrase.map(s => {
                                    if (s === '-') return '<span class="swar rest">-</span>';
                                    const info = this.exerciseManager.getSwarInfo(s) || {};
                                    return `<span class="swar">${getSwarLabel(s, info)}</span>`;
                                }).join('')}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        };

        // Aaroh
        if (exercise.aaroh) {
            html += renderSwarLine(exercise.aaroh, aarohLabel, 'aaroh');
        }
        if (exercise.aaroh_phrases) {
            html += renderPhrases(exercise.aaroh_phrases, aarohLabel, 'aaroh');
        }
        if (exercise.aaroh_groups) {
            html += renderPhrases(exercise.aaroh_groups, aarohLabel, 'aaroh');
        }

        // Avroh
        if (exercise.avroh) {
            html += renderSwarLine(exercise.avroh, avrohLabel, 'avroh');
        }
        if (exercise.avroh_phrases) {
            html += renderPhrases(exercise.avroh_phrases, avrohLabel, 'avroh');
        }
        if (exercise.avroh_groups) {
            html += renderPhrases(exercise.avroh_groups, avrohLabel, 'avroh');
        }

        return html;
    }
    
    buildTaalGrid(taal) {
        const beats = taal.beats;
        const talis = taal.tali_beats || taal.talis || [];
        const khalis = taal.khali_beats || taal.khalis || [];
        const bols = taal.bols || [];
        
        let html = '';
        for (let i = 0; i < beats; i++) {
            const beatNum = i + 1;
            const isSam = beatNum === 1;
            const isTali = talis.includes(beatNum);
            const isKhali = khalis.includes(beatNum);
            
            let className = 'taal-beat';
            if (isSam) className += ' sam';
            else if (isTali) className += ' tali';
            else if (isKhali) className += ' khali';
            
            const marker = isKhali ? '०' : (isTali || isSam ? 'X' : '');
            const bol = getBolLabel(bols[i] || '');

            html += `
                <div class="${className}" data-beat="${i}">
                    <span class="beat-num">${beatNum}</span>
                    <span class="beat-bol">${bol}</span>
                    <span class="beat-marker">${marker}</span>
                </div>
            `;
        }
        
        return html;
    }
    
    setSessionTempo(bpm) {
        bpm = parseInt(bpm);
        this.robotSession.setTempo(bpm);
        
        const tempoValue = document.getElementById('session-tempo-value');
        if (tempoValue) tempoValue.textContent = bpm;
        
        const tempoSlider = document.getElementById('session-tempo-slider');
        if (tempoSlider) tempoSlider.value = bpm;
        
        const bpmValue = document.getElementById('session-bpm-value');
        if (bpmValue) bpmValue.textContent = bpm;
        
        const bpmSlider = document.getElementById('session-bpm-slider');
        if (bpmSlider) bpmSlider.value = bpm;
        
        document.querySelectorAll('.tempo-presets button').forEach(btn => {
            const presetBpm = parseInt(btn.getAttribute('onclick').match(/\d+/)[0]);
            btn.classList.toggle('active', Math.abs(bpm - presetBpm) < 10);
        });
    }
    
    setSubdivision(n) {
        n = parseInt(n);
        if (n !== 1 && n !== 2 && n !== 4) return;
        this.currentSubdivision = n;
        this.robotSession.setSubdivision(n);
        
        document.querySelectorAll('.subdivision-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim() === n + 'x');
        });
        
        const subLabel = document.getElementById('subdivision-value');
        if (subLabel) subLabel.textContent = n + 'x';
        
        if (this.currentView === 'session') {
            this.showSessionView();
        }
    }
    
    // ============================================
    // ROBOT SESSION
    // ============================================
    
    selectMode(mode) {
        this.selectedMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
    
    toggleTanpura() {
        const enabled = this.robotSession.toggleTanpura();
        const btn = document.getElementById('tanpura-toggle');
        if (btn) {
            btn.classList.toggle('on', enabled);
            btn.classList.toggle('off', !enabled);
            btn.textContent = `🎵 Tanpura ${enabled ? 'ON' : 'OFF'}`;
        }
    }
    
    toggleTabla() {
        const enabled = this.robotSession.toggleTabla();
        const taal = this.selectedExercise?.taal_id
            ? this.exerciseManager.getTaal(this.selectedExercise.taal_id)
            : null;
        const taalName = taal ? taal.name : 'Tabla';
        const btn = document.getElementById('tabla-toggle');
        if (btn) {
            btn.classList.toggle('on', enabled);
            btn.classList.toggle('off', !enabled);
            btn.textContent = `🥁 ${taalName} ${enabled ? 'ON' : 'OFF'}`;
        }
    }
    
    async startSession() {
        this._syncSaptakToEngines();
        this.showSessionView();
        await this.robotSession.startSession(this.selectedMode);
    }
    
    _getSaptakLabel() {
        const saptak = (typeof globalSaptak !== 'undefined') ? globalSaptak : PRACTICE_DEFAULTS.saptak;
        const labels = { MANDRA: 'Mandra', MADHYA: 'Madhya', TAAR: 'Taar' };
        return labels[saptak] || 'Madhya';
    }
    
    _syncSaptakToEngines() {
        const saptak = (typeof globalSaptak !== 'undefined') ? globalSaptak : PRACTICE_DEFAULTS.saptak;
        if (this.audioEngine) {
            this.audioEngine.setSaptak(saptak);
        }
        if (this.pitchDetector && typeof window.saptakToSemitones === 'function') {
            this.pitchDetector.setSaptak(window.saptakToSemitones(saptak));
        }
    }
    
    stopSession() {
        this.robotSession.stop();
        this.openExercise(this.selectedExercise.id);
    }
    
    async runSelfTest() {
        if (!window.robotGurujiUI) {
            console.error('Guruji not initialized');
            return;
        }
        
        // Switch to Guruji content area
        const container = document.getElementById('robot-riyaaz-content');
        container.innerHTML = '<div id="robot-guruji-content"></div>';
        
        // Set the exercise and run self-test
        window.robotGurujiUI.setExercise(this.selectedExercise);
        await window.robotGurujiUI.runSelfTest();
    }
    
    showSessionView() {
        const container = document.getElementById('robot-riyaaz-content');
        const exercise = this.selectedExercise;
        const taal = exercise.taal_id ? this.exerciseManager.getTaal(exercise.taal_id) : null;
        
        const events = this.robotSession?.currentEvents || [];
        const subdivision = this.currentSubdivision;
        const totalTaalBeats = taal ? taal.beats : 16;
        const talis = taal ? (taal.tali_beats || taal.talis || []) : [];
        const khalis = taal ? (taal.khali_beats || taal.khalis || []) : [];
        const bols = taal ? (taal.bols || []) : [];
        
        const totalBeatColumns = Math.max(1, Math.ceil(events.length / subdivision));
        const currentBpm = this.robotSession?.tempo || exercise.tempo_bpm;
        
        let beatColumnsHtml = '';
        for (let b = 0; b < totalBeatColumns; b++) {
            const taalBeatIdx = b % totalTaalBeats;
            const beatNum = taalBeatIdx + 1;
            const isSam = beatNum === 1;
            const isTali = !isSam && talis.includes(beatNum);
            const isKhali = khalis.includes(beatNum);
            
            let colClass = 'beat-column';
            if (isSam) colClass += ' sam';
            else if (isTali) colClass += ' tali';
            else if (isKhali) colClass += ' khali';
            
            const marker = isSam ? 'X' : isKhali ? '०' : (isTali ? '|' : '');
            const bol = getBolLabel(bols[taalBeatIdx] || '');

            let subcellsHtml = '';
            for (let s = 0; s < subdivision; s++) {
                const eventIdx = b * subdivision + s;
                const event = events[eventIdx];
                const swarLabel = event
                    ? getSwarLabel(event.swar, this.exerciseManager.getSwarInfo(event.swar))
                    : '-';
                const isEmpty = !event;
                
                subcellsHtml += `
                    <div class="swar-subcell ${isEmpty ? 'rest' : 'upcoming'}"
                         data-swar-idx="${eventIdx}">
                        <span class="subcell-swar">${swarLabel}</span>
                    </div>`;
            }
            
            beatColumnsHtml += `
                <div class="${colClass}" data-beat-col="${b}">
                    <div class="beat-cell">
                        <span class="beat-marker">${marker}</span>
                        <span class="beat-num">${beatNum}</span>
                        <span class="beat-bol">${bol}</span>
                    </div>
                    <div class="swar-group">${subcellsHtml}</div>
                </div>`;
        }
        
        let html = `
            <div class="robot-session">
                <div class="session-header">
                    <h2>${exercise.title}</h2>
                    <button class="stop-btn" onclick="robotUI.stopSession()">Stop</button>
                </div>
                
                <div class="session-status" id="session-status">
                    <div class="status-indicator">⏳</div>
                    <div class="status-text">Preparing...</div>
                </div>
                
                <div class="session-controls-bar">
                    <div class="subdivision-compact">
                        <label>Speed</label>
                        <div class="subdivision-selector" id="session-subdivision-selector">
                            <button onclick="robotUI.setSubdivision(1)" class="${subdivision === 1 ? 'active' : ''}">1x</button>
                            <button onclick="robotUI.setSubdivision(2)" class="${subdivision === 2 ? 'active' : ''}">2x</button>
                            <button onclick="robotUI.setSubdivision(4)" class="${subdivision === 4 ? 'active' : ''}">4x</button>
                        </div>
                    </div>
                </div>
                
                <div class="dual-strip-container" id="dual-strip-container">
                    <div class="strip-labels">
                        <span class="strip-label">Taal</span>
                        <span class="strip-label">Swar</span>
                    </div>
                    <div class="dual-strip-scroll" id="dual-strip-scroll">
                        ${beatColumnsHtml}
                    </div>
                </div>
                
                <div class="live-swar-display" id="live-swar-display">
                    <div class="current-swar" id="current-swar">-</div>
                    <div class="swar-progress" id="swar-progress"></div>
                </div>
                
                <div class="live-feedback" id="live-feedback">
                    <div class="pitch-indicator">
                        <div class="pitch-bar">
                            <div class="pitch-marker" id="pitch-marker"></div>
                        </div>
                        <div class="pitch-labels">
                            <span>Flat</span>
                            <span>In Tune</span>
                            <span>Sharp</span>
                        </div>
                    </div>
                    <div class="detected-swar" id="detected-swar">-</div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.currentView = 'session';
    }
    
    onSessionStateChange(state) {
        const statusEl = document.getElementById('session-status');
        if (!statusEl) return;
        
        const states = {
            'idle': { icon: '⏳', text: 'Ready' },
            'counting': { icon: '🎵', text: 'Count in...' },
            'singAlong': { icon: '🎶', text: 'Sing Along...' },
            'demoPhase': { icon: '🕉️', text: 'Watch & Listen...' },
            'demo': { icon: '🕉️', text: 'Watch & Listen' },
            'practice': { icon: '🎤', text: 'Your turn!' },
            'selfPractice': { icon: '🎵', text: 'Self Practice...' },
            'grading': { icon: '📊', text: 'Analyzing...' },
            'complete': { icon: '✅', text: 'Complete!' }
        };
        
        const info = states[state] || states['idle'];
        statusEl.innerHTML = `
            <div class="status-indicator">${info.icon}</div>
            <div class="status-text">${info.text}</div>
        `;
        
        const feedbackEl = document.getElementById('live-feedback');
        if (feedbackEl) {
            const showFeedback = state === 'practice';
            feedbackEl.classList.toggle('active', showFeedback);
        }
    }
    
    onSwarPlayed(event, index, total) {
        const currentSwarEl = document.getElementById('current-swar');
        if (currentSwarEl) {
            const swarInfo = this.exerciseManager.getSwarInfo(event.swar) || {};
            currentSwarEl.textContent = getSwarLabel(event.swar, swarInfo);
            currentSwarEl.className = 'current-swar pulse';
            setTimeout(() => currentSwarEl.classList.remove('pulse'), 200);
        }
        
        const allSubcells = document.querySelectorAll('.swar-subcell[data-swar-idx]');
        allSubcells.forEach(cell => {
            const idx = parseInt(cell.dataset.swarIdx);
            if (cell.classList.contains('rest')) return;
            cell.classList.remove('active', 'done', 'upcoming');
            if (idx < index) cell.classList.add('done');
            else if (idx === index) cell.classList.add('active');
            else cell.classList.add('upcoming');
        });
        
        const currentBeatCol = Math.floor(index / this.currentSubdivision);
        const beatColumns = document.querySelectorAll('.beat-column');
        beatColumns.forEach((col, i) => {
            col.classList.toggle('current', i === currentBeatCol);
        });
        
        const activeCol = beatColumns[currentBeatCol];
        if (activeCol) {
            activeCol.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
        
        const progressEl = document.getElementById('swar-progress');
        if (progressEl) {
            const pct = ((index + 1) / total) * 100;
            progressEl.style.width = pct + '%';
        }
    }
    
    onBeatPlayed(beatIndex, swarIndex) {
        const beatColumns = document.querySelectorAll('.beat-column');
        beatColumns.forEach((col, i) => {
            col.classList.toggle('current', i === beatIndex);
        });
    }
    
    onGrade(grade) {
        const feedbackEl = document.getElementById('live-feedback');
        if (feedbackEl && !feedbackEl.classList.contains('active')) {
            feedbackEl.classList.add('active');
        }
        
        const detectedEl = document.getElementById('detected-swar');
        if (detectedEl) {
            const swarInfo = this.exerciseManager.getSwarInfo(grade.detectedSwar) || {};
            detectedEl.textContent = getSwarLabel(grade.detectedSwar, swarInfo);
            detectedEl.className = 'detected-swar ' + (grade.isCorrectSwar ? 'correct' : 'incorrect');
        }
        
        // Update pitch indicator
        const markerEl = document.getElementById('pitch-marker');
        if (markerEl) {
            // Map cents error (-50 to +50) to position (0% to 100%)
            const position = 50 + (grade.centsError / 100) * 50;
            markerEl.style.left = Math.max(0, Math.min(100, position)) + '%';
            markerEl.className = 'pitch-marker ' + (grade.isInTune ? 'in-tune' : 'out-tune');
        }
    }
    
    // ============================================
    // SESSION REPORT
    // ============================================
    
    onReport(report) {
        this.currentReport = report;
        this.showReportView(report);
    }
    
    showReportView(report) {
        const container = document.getElementById('robot-riyaaz-content');
        const exercise = this.selectedExercise;
        
        const getScoreClass = (score) => {
            if (score >= 90) return 'excellent';
            if (score >= 70) return 'good';
            if (score >= 50) return 'fair';
            return 'needs-work';
        };
        
        let html = `
            <div class="session-report">
                <div class="report-header">
                    <h2>📊 Practice Report</h2>
                    <p>${exercise.title}</p>
                </div>
                
                <div class="overall-score ${getScoreClass(report.scores.overall)}">
                    <div class="score-circle">
                        <span class="score-value">${report.scores.overall}</span>
                        <span class="score-label">Overall</span>
                    </div>
                </div>
                
                <div class="score-breakdown">
                    <div class="score-item">
                        <span class="score-name">Pitch Accuracy</span>
                        <div class="score-bar">
                            <div class="score-fill ${getScoreClass(report.scores.pitch)}" 
                                 style="width: ${report.scores.pitch}%"></div>
                        </div>
                        <span class="score-percent">${report.scores.pitch}%</span>
                    </div>
                    <div class="score-item">
                        <span class="score-name">Tuning (Cents)</span>
                        <div class="score-bar">
                            <div class="score-fill ${getScoreClass(report.scores.tuning)}" 
                                 style="width: ${report.scores.tuning}%"></div>
                        </div>
                        <span class="score-percent">${report.scores.tuning}%</span>
                    </div>
                    <div class="score-item">
                        <span class="score-name">Rhythm</span>
                        <div class="score-bar">
                            <div class="score-fill ${getScoreClass(report.scores.rhythm)}" 
                                 style="width: ${report.scores.rhythm}%"></div>
                        </div>
                        <span class="score-percent">${report.scores.rhythm}%</span>
                    </div>
                    <div class="score-item">
                        <span class="score-name">Completion</span>
                        <div class="score-bar">
                            <div class="score-fill ${getScoreClass(report.scores.completion)}" 
                                 style="width: ${report.scores.completion}%"></div>
                        </div>
                        <span class="score-percent">${report.scores.completion}%</span>
                    </div>
                </div>
                
                <div class="recommendation">
                    <h3>💡 Recommendation</h3>
                    <p>${report.recommendation}</p>
                </div>
                
                ${report.mistakes.length > 0 ? `
                <div class="mistakes-section">
                    <h3>⚠️ Areas to Improve</h3>
                    <div class="mistakes-list">
                        ${report.mistakes.slice(0, 5).map(m => `
                            <div class="mistake-item">
                                <span class="mistake-expected">Expected: ${m.expectedSwar}</span>
                                <span class="mistake-detected">Sang: ${m.detectedSwar}</span>
                                ${!m.isInTune ? `<span class="mistake-cents">${m.centsError > 0 ? '+' : ''}${m.centsError}¢</span>` : ''}
                                ${!m.isOnTime ? `<span class="mistake-timing">${m.timingErrorMs > 0 ? 'Late' : 'Early'}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="report-actions">
                    <button class="btn-retry" onclick="robotUI.startSession()">
                        🔄 Practice Again
                    </button>
                    <button class="btn-back" onclick="robotUI.renderExerciseBrowser()">
                        ← Back to Exercises
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.currentView = 'report';
    }
}

// Export
window.RobotRiyaazUI = RobotRiyaazUI;

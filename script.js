/**
 * BUBBLE PARADISE - Magical Sensory Expansion
 * Designed specifically for autistic children.
 * Calming, repetitive, visually satisfying, predictable, and happy.
 */

// --- UTILITY FUNCTIONS ---

/**
 * Converts a hex color string to an RGB object.
 */
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

/**
 * Draws a standard 5-point star path on the canvas context.
 */
function drawStarPath(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

/**
 * Procedurally draws a glass-like 3D bubble.
 */
function drawBubbleShape(ctx, cx, cy, r, color, squishX, squishY) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(squishX, squishY);
    
    // Draw soft drop shadow underneath
    ctx.fillStyle = 'rgba(109, 89, 122, 0.12)';
    ctx.beginPath();
    ctx.arc(3, 4, r, 0, Math.PI * 2);
    ctx.fill();
    
    const rgb = hexToRgb(color);
    const radGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    radGrad.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.62)`);
    radGrad.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`);
    radGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.58)`);
    
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle darker border
    ctx.strokeStyle = `rgba(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)}, 0.55)`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // White inner highlight rim for 3D look
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-1, -1, r - 3, 0, Math.PI * 2);
    ctx.stroke();
    
    // 3D Highlight Glare (soft white bean at top left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.45, -r * 0.45, r * 0.18, r * 0.32, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle second highlight at bottom right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(r * 0.5, r * 0.5, r * 0.08, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}


// --- ADAPTIVE MUSIC SEQUENCER & UNIQUE SYNTHESIZER ---

class SoundSynth {
    constructor() {
        this.ctx = null;
        this.schedulerTimerId = null;
        this.nextNoteTime = 0.0;
        this.currentStep = 0;       // 16th note steps: 0 to 15
        this.currentBar = 0;        // Chords bar: 0 to 3
        this.bpm = 70.0;
        this.secondsPerStep = 60.0 / this.bpm / 4.0; // step duration
        
        // Pentatonic C Major scale notes
        this.notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        
        // Soothing Chord progression (C Major -> F Major -> A Minor -> G Major)
        this.chords = [
            [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5 (C Maj)
            [349.23, 440.00, 523.25, 698.46], // F4, A4, C5, F5 (F Maj)
            [440.00, 523.25, 659.25, 880.00], // A4, C5, E5, A5 (A Min)
            [392.00, 493.88, 587.33, 783.99]  // G4, B4, D5, G5 (G Maj)
        ];
        
        // High register notes for melody overlays
        this.pentatonicHigh = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
        
        // Track layer gains
        this.gains = {
            musicBox: null,
            bells: null,
            marimba: null,
            melody: null,
            sfx: null
        };
        
        this.happinessRatio = 0.0;
        this.isCelebrating = false;
        
        // Clock scheduling setup
        this.scheduleAheadTime = 0.15; // Schedule 150ms in advance
        this.lookahead = 30.0;          // Tick every 30ms
        
        // Music/SFX controls
        this.musicVolume = 1.0;
        this.sfxVolume = 1.0;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.masterMusicGain = null;
        this.masterSfxGain = null;
        
        // Optional local offline audio files path configuration
        this.localSounds = {
            pop: { paths: ['sounds/pop.mp3.mp3', 'sounds/pop.mp3'], loaded: false, audio: null },
            puppy: { paths: ['sounds/dog.mp3.mp3', 'sounds/dog.mp3', 'sounds/puppy.mp3.mp3', 'sounds/puppy.mp3'], loaded: false, audio: null },
            cat: { paths: ['sounds/cat.mp3.mp3', 'sounds/cat.mp3'], loaded: false, audio: null },
            cow: { paths: ['sounds/cow.mp3.mp3', 'sounds/cow.mp3'], loaded: false, audio: null },
            goat: { paths: ['sounds/goat.mp3.mp3', 'sounds/goat.mp3'], loaded: false, audio: null },
            heart: { paths: ['sounds/heart.mp3.mp3', 'sounds/heart.mp3'], loaded: false, audio: null },
            rainbow: { paths: ['sounds/rainbow.mp3.mp3', 'sounds/rainbow.mp3'], loaded: false, audio: null },
            flower: { paths: ['sounds/flower.mp3.mp3', 'sounds/flower.mp3'], loaded: false, audio: null },
            candy: { paths: ['sounds/candy.mp3.mp3', 'sounds/candy.mp3'], loaded: false, audio: null },
            star: { paths: ['sounds/star.mp3.mp3', 'sounds/star.mp3'], loaded: false, audio: null },
            music: { paths: ['sounds/music.mp3.mp3', 'sounds/music.mp3'], loaded: false, audio: null },
            bgMusic: { paths: ['sounds/bgMusic.mp3.mp3', 'sounds/bgMusic.mp3', 'sounds/bg_music.mp3.mp3', 'sounds/bg_music.mp3'], loaded: false, audio: null },
            celebrationMusic: { paths: ['sounds/celebrationMusic.mp3.mp3', 'sounds/celebrationMusic.mp3', 'sounds/celebration_music.mp3.mp3', 'sounds/celebration_music.mp3'], loaded: false, audio: null }
        };
    }
    
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }
        
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain nodes
        this.masterMusicGain = this.ctx.createGain();
        this.masterMusicGain.connect(this.ctx.destination);
        this.masterMusicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
        
        this.masterSfxGain = this.ctx.createGain();
        this.masterSfxGain.connect(this.ctx.destination);
        this.masterSfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
        
        // Create gains for separate adaptive channels
        Object.keys(this.gains).forEach(layer => {
            const gain = this.ctx.createGain();
            if (layer === 'sfx') {
                gain.connect(this.masterSfxGain);
            } else {
                gain.connect(this.masterMusicGain);
            }
            
            // Set volumes (Music Box base is active, others silent initially)
            let defaultVol = 0.0;
            if (layer === 'musicBox') defaultVol = 0.12;
            else if (layer === 'sfx') defaultVol = 0.28;
            
            gain.gain.setValueAtTime(defaultVol, this.ctx.currentTime);
            this.gains[layer] = gain;
        });
        

        // Try preloading local sound files by trying candidate paths recursively
        Object.keys(this.localSounds).forEach(key => {
            const item = this.localSounds[key];
            const synth = this;
            
            function tryLoadPath(index) {
                if (index >= item.paths.length) return;
                
                const path = item.paths[index];
                const audio = new Audio(path);
                audio.preload = 'auto';
                if (key === 'bgMusic' || key === 'celebrationMusic') {
                    audio.loop = true;
                }
                
                function onCanPlay() {
                    item.loaded = true;
                    item.audio = audio;
                    console.log(`Local sound file loaded offline: ${path}`);
                    
                    audio.removeEventListener('canplaythrough', onCanPlay);
                    audio.removeEventListener('error', onError);
                    
                    // If background music finishes loading, start playing it if in normal state
                    if (key === 'bgMusic' && !synth.isCelebrating) {
                        synth.playBgMusic();
                    }
                }
                
                function onError() {
                    audio.removeEventListener('canplaythrough', onCanPlay);
                    audio.removeEventListener('error', onError);
                    // Try the next path in the array
                    tryLoadPath(index + 1);
                }
                
                audio.addEventListener('canplaythrough', onCanPlay);
                audio.addEventListener('error', onError);
            }
            
            tryLoadPath(0);
        });
        
        // Run sequencer clock
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.schedulerTimerId = setInterval(() => this.schedulerLoop(), this.lookahead);
    }
    
    schedulerLoop() {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.advanceStep();
        }
    }
    
    advanceStep() {
        this.nextNoteTime += this.secondsPerStep;
        this.currentStep = (this.currentStep + 1) % 16;
        if (this.currentStep === 0) {
            this.currentBar = (this.currentBar + 1) % 4;
        }
    }
    
    scheduleStep(step, time) {
        // If local custom background music is active, don't schedule procedural sequencer layers
        if (this.localSounds.bgMusic.loaded && !this.isCelebrating) {
            return;
        }
        // Similarly during celebration, if custom celebration music is active, skip procedural chimes
        if (this.isCelebrating && this.localSounds.celebrationMusic.loaded) {
            return;
        }
        
        const chord = this.chords[this.currentBar];
        
        // 1. Music Box (Base layer, plays on beats/eighths: step % 2 === 0)
        if (step % 2 === 0) {
            const idx = (step / 2) % chord.length;
            this.playMusicBoxNote(chord[idx], time);
        }
        
        // 2. Bells (Fades in at >= 30% happiness or in celebration mode)
        // Accent bell ring on beats 1 and 3 (step % 4 === 0)
        if (this.isCelebrating || this.happinessRatio >= 0.3) {
            if (step % 4 === 0) {
                const idx = (step / 4) % chord.length;
                this.playBellNote(chord[idx] * 2.0, time); // 1 Octave higher
            }
        }
        
        // 3. Marimba (Fades in at >= 60% happiness or in celebration mode)
        // Rhythm syncopated notes on step 2, 6, 10, 14
        if (this.isCelebrating || this.happinessRatio >= 0.6) {
            if (step === 2 || step === 6 || step === 10 || step === 14) {
                const idx = (this.currentBar + step) % chord.length;
                this.playMarimbaNote(chord[idx] * 1.5, time);
            }
        }
        
        // 4. Joyful Melody (Fades in at >= 90% happiness or in celebration mode)
        // Cozy floating melodies playing on steps 0, 3, 6, 8, 11, 14
        if (this.isCelebrating || this.happinessRatio >= 0.9) {
            const melodySteps = [0, 3, 6, 8, 11, 14];
            if (melodySteps.includes(step)) {
                const idx = Math.floor(Math.random() * this.pentatonicHigh.length);
                this.playMelodyNote(this.pentatonicHigh[idx], time);
            }
        }
    }
    
    // --- LAYER SYNTH PLUCK GENERATORS ---
    
    playMusicBoxNote(freq, time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.gains.musicBox);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        
        osc.start(time);
        osc.stop(time + 0.4);
    }
    
    playBellNote(freq, time) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.gains.bells);
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, time);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 3.0, time); // High chime resonance
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.07, time + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.85);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.9);
        osc2.stop(time + 0.9);
    }
    
    playMarimbaNote(freq, time) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.gains.marimba);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(120, time + 0.11);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        
        osc.start(time);
        osc.stop(time + 0.18);
    }
    
    playMelodyNote(freq, time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.gains.melody);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.04); // Soft attack to avoid clicks
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.48);
        
        osc.start(time);
        osc.stop(time + 0.52);
    }
    
    // --- ADAPTIVE MUSIC TRANSITIONS ---
    
    updateHappinessRatio(ratio) {
        this.happinessRatio = ratio;
        if (!this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        // Calculate target volumes based on meter levels
        const targetBells = (this.isCelebrating || ratio >= 0.3) ? 0.14 : 0.0;
        const targetMarimba = (this.isCelebrating || ratio >= 0.6) ? 0.11 : 0.0;
        const targetMelody = (this.isCelebrating || ratio >= 0.9) ? 0.11 : 0.0;
        
        // Smoothly fade tracks in/out over 2 seconds
        this.gains.bells.gain.linearRampToValueAtTime(targetBells, now + 2.0);
        this.gains.marimba.gain.linearRampToValueAtTime(targetMarimba, now + 2.0);
        this.gains.melody.gain.linearRampToValueAtTime(targetMelody, now + 2.0);
    }
    
    setCelebrating(val) {
        this.isCelebrating = val;
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        if (val) {
            this.playCelebrationMusic();
            
            // Speed up tempo during celebration
            this.bpm = 82;
            this.secondsPerStep = 60.0 / this.bpm / 4.0;
            
            // Build rich full orchestration
            this.gains.musicBox.gain.linearRampToValueAtTime(0.16, now + 1.2);
            this.gains.bells.gain.linearRampToValueAtTime(0.18, now + 1.5);
            this.gains.marimba.gain.linearRampToValueAtTime(0.15, now + 1.5);
            this.gains.melody.gain.linearRampToValueAtTime(0.20, now + 2.0);
        } else {
            this.playBgMusic();
            
            // Restore normal tempo
            this.bpm = 70;
            this.secondsPerStep = 60.0 / this.bpm / 4.0;
            
            // Revert volumes to match meter progress
            this.updateHappinessRatio(this.happinessRatio);
        }
    }
    
    // --- PROCEDURAL UNIQUE POP SOUND EFFECTS ---
    
    playNormalPop() {
        const item = this.localSounds.pop;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // 1. Soft ploop sweep
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.gains.sfx);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(70, now + 0.07);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc1.start(now);
        osc1.stop(now + 0.08);
        
        // 2. High bell chime
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.gains.sfx);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now); // E5 note
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.05, now + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.start(now);
        osc2.stop(now + 0.26);
    }
    
    playRainbowPop() {
        const item = this.localSounds.rainbow;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Sweeping C Major pentatonic arpeggio (Harp sound)
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
            const delay = idx * 0.025;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
            osc.start(now + delay);
            osc.stop(now + delay + 0.45);
        });
    }
    
    playStarPop() {
        const item = this.localSounds.star;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Crystal twinkles: 5 staggered high chimes
        for (let i = 0; i < 5; i++) {
            const delay = i * 0.04;
            const freq = 1300 + Math.random() * 900;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.05, now + delay + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
            osc.start(now + delay);
            osc.stop(now + delay + 0.16);
        }
    }
    
    playMusicPop() {
        const item = this.localSounds.music;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Playful 3-note xylophone tune
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
        for (let i = 0; i < 3; i++) {
            const delay = i * 0.09;
            const freq = notes[Math.floor(Math.random() * notes.length)] * (i === 2 ? 2.0 : 1.0);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
            osc.start(now + delay);
            osc.stop(now + delay + 0.35);
        }
    }
    
    playHeartPop() {
        const item = this.localSounds.heart;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Deep warm major chord (C4, E4, G4)
        [261.63, 329.63, 392.00].forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.09, now + 0.06); // Soft swell
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            osc.start(now);
            osc.stop(now + 0.6);
        });
    }
    
    playFlowerPop() {
        const item = this.localSounds.flower;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Wind chime: detuned dual oscillators fading slowly
        const freqs = [880.00, 884.00];
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
            osc.start(now);
            osc.stop(now + 0.75);
        });
    }
    
    playCandyPop() {
        const item = this.localSounds.candy;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // 3 crispy quick clicks
        for (let i = 0; i < 3; i++) {
            const delay = i * 0.025;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(700 + Math.random() * 800, now + delay);
            osc.frequency.exponentialRampToValueAtTime(120, now + delay + 0.03);
            gain.gain.setValueAtTime(0.12, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.03);
            osc.start(now + delay);
            osc.stop(now + delay + 0.04);
        }
    }
    
    playGoldenPop() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Epic rising chord sweep arpeggio
        const chord = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        chord.forEach((freq, idx) => {
            const delay = idx * 0.03;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.16, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.75);
            osc.start(now + delay);
            osc.stop(now + delay + 0.8);
        });
    }
    
    // --- PROCEDURAL CUTE ANIMAL SOUND SYNTHESIZERS ---
    
    playPuppySound() {
        const item = this.localSounds.puppy;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.4;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.gains.sfx);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.04);
        osc.frequency.linearRampToValueAtTime(160, now + 0.12);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        osc.start(now);
        osc.stop(now + 0.13);
    }
    
    playCatSound() {
        const item = this.localSounds.cat;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.gains.sfx);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(580, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.35);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.36);
    }
    
    playCowSound() {
        const item = this.localSounds.cow;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.45;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.gains.sfx);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        
        osc.start(now);
        osc.stop(now + 0.6);
    }
    
    playGoatSound() {
        const item = this.localSounds.goat;
        if (item && item.loaded) {
            const clone = item.audio.cloneNode();
            clone.volume = this.sfxVolume * 0.4;
            clone.play().catch(e => console.log(e));
            return;
        }
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Tremolo bleat: 5 rapid pulses
        for (let i = 0; i < 5; i++) {
            const delay = i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320 + Math.sin(i) * 15, now + delay);
            
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.08);
        }
    }
    
    playPluck(noteIndex) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
        const freq = scale[noteIndex % scale.length];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.gains.sfx);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.45);
    }
    
    playChimeChord() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = [261.63, 329.63, 392.00, 493.88, 523.25];
        chord.forEach((freq, idx) => {
            const delay = idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.gains.sfx);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.10, now + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.65);
        });
    }
    
    setMusicVolume(vol) {
        this.musicVolume = vol;
        if (this.masterMusicGain && this.ctx) {
            const t = this.ctx.currentTime;
            this.masterMusicGain.gain.setValueAtTime(this.musicEnabled ? vol : 0, t);
        }
        const bg = this.localSounds.bgMusic;
        const cel = this.localSounds.celebrationMusic;
        if (bg && bg.audio) {
            bg.audio.volume = (this.musicEnabled ? vol : 0) * 0.45;
        }
        if (cel && cel.audio) {
            cel.audio.volume = (this.musicEnabled ? vol : 0) * 0.5;
        }
    }
    
    setSfxVolume(vol) {
        this.sfxVolume = vol;
        if (this.masterSfxGain && this.ctx) {
            const t = this.ctx.currentTime;
            this.masterSfxGain.gain.setValueAtTime(this.sfxEnabled ? vol : 0, t);
        }
    }
    
    toggleMusic(enabled) {
        this.musicEnabled = enabled;
        this.setMusicVolume(this.musicVolume);
        
        const bg = this.localSounds.bgMusic;
        const cel = this.localSounds.celebrationMusic;
        
        if (enabled) {
            if (this.isCelebrating) {
                if (cel && cel.loaded) cel.audio.play().catch(e => console.log(e));
            } else {
                if (bg && bg.loaded) bg.audio.play().catch(e => console.log(e));
            }
        } else {
            if (bg && bg.audio) bg.audio.pause();
            if (cel && cel.audio) cel.audio.pause();
        }
    }
    
    toggleSfx(enabled) {
        this.sfxEnabled = enabled;
        this.setSfxVolume(this.sfxVolume);
    }
    
    playBgMusic() {
        const bg = this.localSounds.bgMusic;
        const cel = this.localSounds.celebrationMusic;
        
        if (cel && cel.audio) {
            cel.audio.pause();
            cel.audio.currentTime = 0;
        }
        
        if (bg && bg.loaded) {
            bg.audio.volume = (this.musicEnabled ? this.musicVolume : 0) * 0.45;
            if (this.musicEnabled) {
                bg.audio.play().catch(e => console.log("BG music autoplay blocked", e));
            }
        }
    }
    
    playCelebrationMusic() {
        const bg = this.localSounds.bgMusic;
        const cel = this.localSounds.celebrationMusic;
        
        if (bg && bg.audio) {
            bg.audio.pause();
        }
        
        if (cel && cel.loaded) {
            cel.audio.volume = (this.musicEnabled ? this.musicVolume : 0) * 0.5;
            if (this.musicEnabled) {
                cel.audio.play().catch(e => console.log("Celebration music play blocked", e));
            }
        }
    }
}


// --- STAR SPARKLE CLASS ---

class Sparkle {
    constructor(canvasWidth, canvasHeight, isCelebration = false) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.isCelebration = isCelebration;
        this.reset();
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * (isCelebration ? canvasHeight : canvasHeight * 0.5);
    }
    
    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = Math.random() * (this.isCelebration ? this.canvasHeight : this.canvasHeight * 0.5);
        this.size = Math.random() * 2.5 + 2.0;
        this.alpha = Math.random();
        this.speed = Math.random() * 0.7 + 0.3;
    }
    
    update(dt) {
        this.alpha += this.speed * dt;
        if (this.alpha > 1 || this.alpha < 0) {
            this.speed = -this.speed;
            this.alpha = Math.max(0, Math.min(1, this.alpha));
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.45;
        ctx.fillStyle = '#fff5ba';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- SMILING CLOUD CLASS ---

class SmilingCloud {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.x = Math.random() * (canvasWidth + 200) - 100;
    }
    
    reset() {
        this.x = this.canvasWidth + 200;
        this.y = Math.random() * this.canvasHeight * 0.40 + 35; // upper sky
        this.speed = Math.random() * 5 + 4; // slow drift (4-9 px/sec)
        this.scale = Math.random() * 0.35 + 0.65;
        this.opacity = Math.random() * 0.15 + 0.38;
    }
    
    update(dt) {
        this.x -= this.speed * dt;
        if (this.x < -250 * this.scale) {
            this.reset();
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.arc(45, -15, 60, 0, Math.PI * 2);
        ctx.arc(95, 0, 50, 0, Math.PI * 2);
        ctx.arc(45, 20, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw cute cloud face
        ctx.strokeStyle = `rgba(109, 89, 122, ${this.opacity * 0.9})`;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        
        // Sleeping arched eyes
        ctx.beginPath();
        ctx.arc(32, 0, 6, Math.PI, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(58, 0, 6, Math.PI, 0);
        ctx.stroke();
        
        // Rosy cheeks
        ctx.fillStyle = `rgba(255, 183, 178, ${this.opacity * 0.75})`;
        ctx.beginPath();
        ctx.arc(23, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(67, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Smiling mouth
        ctx.beginPath();
        ctx.arc(45, 6, 6, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }
}


// --- DECORATIVE NATURE BACKGROUND ELEMENTS ---

class Butterfly {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight * 0.65 + 60;
    }
    
    reset() {
        this.x = -60;
        this.y = Math.random() * this.canvasHeight * 0.6 + 50;
        this.speedX = Math.random() * 25 + 35; // slow drift
        this.size = Math.random() * 6 + 9;
        const colors = ['#ffb7b2', '#ffdac1', '#fff5ba', '#b5e2fa', '#e2cee2'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(dt, time) {
        this.x += this.speedX * dt;
        this.y += Math.sin(time * 2.5 + this.x * 0.01) * 35 * dt;
        
        if (this.x > this.canvasWidth + 60) {
            this.reset();
        }
    }
    
    draw(ctx, time) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        
        const flap = Math.abs(Math.sin(time * 10));
        
        ctx.beginPath();
        ctx.ellipse(-this.size / 2, 0, this.size * 0.75 * flap, this.size, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.size / 2, 0, this.size * 0.75 * flap, this.size, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#6d597a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.5, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class SlowBird {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.x = Math.random() * canvasWidth;
    }
    
    reset() {
        this.x = -50;
        this.y = Math.random() * this.canvasHeight * 0.35 + 40;
        this.speedX = Math.random() * 20 + 20; // very slow: 20-40 px/sec
        this.size = Math.random() * 4 + 7;
        this.flapSpeed = Math.random() * 2 + 2;
        this.color = '#a2cffe';
        this.isRainbow = Math.random() < 0.15; // occasional rainbow birds
    }
    
    update(dt) {
        this.x += this.speedX * dt;
        if (this.x > this.canvasWidth + 50) {
            this.reset();
        }
    }
    
    draw(ctx, time) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.isRainbow ? '#ffb7b2' : this.color;
        
        const flap = Math.sin(time * this.flapSpeed);
        
        ctx.beginPath();
        // Left wing
        ctx.moveTo(-this.size, flap * this.size * 0.4);
        ctx.quadraticCurveTo(-this.size * 0.5, -this.size * 0.5, 0, 0);
        // Right wing
        ctx.quadraticCurveTo(this.size * 0.5, -this.size * 0.5, this.size, flap * this.size * 0.4);
        ctx.stroke();
        
        ctx.restore();
    }
}

class Firefly {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight * 0.5 + canvasHeight * 0.4;
        this.vx = Math.random() * 20 - 10;
        this.vy = Math.random() * 20 - 10;
        this.size = Math.random() * 2.5 + 2.5;
        this.alpha = Math.random();
        this.glowSpeed = Math.random() * 2 + 1;
    }
    
    update(dt, time) {
        // Brownian motion drift
        this.vx += (Math.random() - 0.5) * 15 * dt;
        this.vy += (Math.random() - 0.5) * 15 * dt;
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 25) {
            this.vx = (this.vx / speed) * 25;
            this.vy = (this.vy / speed) * 25;
        }
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Wrap screen
        if (this.x < -10) this.x = this.canvasWidth + 10;
        if (this.x > this.canvasWidth + 10) this.x = -10;
        if (this.y < this.canvasHeight * 0.3) this.y = this.canvasHeight + 10;
        if (this.y > this.canvasHeight + 10) this.y = this.canvasHeight * 0.3;
        
        this.alpha = 0.3 + Math.abs(Math.sin(time * this.glowSpeed)) * 0.7;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Draw outer soft glow ring (simulating shadow blur but with raw canvas arc: 10x faster!)
        ctx.fillStyle = 'rgba(226, 240, 203, 0.35)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner core
        ctx.fillStyle = '#e2f0cb';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Leaf {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.y = Math.random() * canvasHeight;
    }
    
    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = -20;
        this.speedY = Math.random() * 15 + 15; // slow falling leaf
        this.speedX = Math.random() * 10 - 5;
        this.size = Math.random() * 5 + 7;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.6 - 0.3;
        this.color = Math.random() < 0.5 ? '#ffdac1' : '#e2f0cb';
    }
    
    update(dt) {
        this.y += this.speedY * dt;
        this.x += this.speedX * dt;
        this.rotation += this.rotationSpeed * dt;
        
        if (this.y > this.canvasHeight + 20) {
            this.reset();
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        
        // Simple procedural leaf shape
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size * 0.5, 0, 0, this.size);
        ctx.quadraticCurveTo(-this.size * 0.5, 0, 0, -this.size);
        ctx.fill();
        ctx.restore();
    }
}

class BottomFlower {
    constructor(x) {
        this.x = x;
        this.y = 720;
        this.stemHeight = Math.random() * 25 + 32;
        this.size = Math.random() * 7 + 10;
        const colors = ['#ffb7b2', '#ffdac1', '#fff5ba', '#e2cee2', '#b5e2fa'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.waveOffset = Math.random() * Math.PI * 2;
        this.scale = 1.0;
    }
    
    update(dt, time) {
        this.waveAngle = Math.sin(this.waveOffset + time * 1.4) * 0.12;
        
        // Return back to normal scale if event pulsed it
        if (this.scale > 1.0) {
            this.scale -= 1.2 * dt;
            if (this.scale < 1.0) this.scale = 1.0;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.waveAngle);
        ctx.scale(this.scale, this.scale);
        
        // Draw stem
        ctx.strokeStyle = '#c8e6c9';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.stemHeight);
        ctx.stroke();
        
        // Draw petals
        ctx.fillStyle = this.color;
        const petals = 5;
        const petalDist = this.size * 0.65;
        for (let i = 0; i < petals; i++) {
            const angle = (Math.PI * 2 * i) / petals;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * petalDist, -this.stemHeight + Math.sin(angle) * petalDist, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Center yellow core
        ctx.fillStyle = '#fff5ba';
        ctx.beginPath();
        ctx.arc(0, -this.stemHeight, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class PeekingAnimal {
    constructor(x, emoji) {
        this.x = x;
        this.y = 720;
        this.targetY = 720;
        this.emoji = emoji;
        this.peekTimer = 0;
        this.peekInterval = Math.random() * 20 + 15; // Peek every 15-35s
        this.state = 'hidden'; // 'hidden', 'peeking', 'showing', 'hiding'
        this.showDuration = 3.5;
        this.showTimer = 0;
        this.tilt = 0;
    }
    
    trigger() {
        this.state = 'peeking';
        this.targetY = 655;
        this.showTimer = 0;
    }
    
    update(dt, time) {
        if (this.state === 'hidden') {
            this.peekTimer += dt;
            if (this.peekTimer >= this.peekInterval) {
                this.trigger();
                this.peekTimer = 0;
            }
        } else {
            // Slide lerp
            this.y += (this.targetY - this.y) * 4 * dt;
            
            if (this.state === 'peeking' && Math.abs(this.y - this.targetY) < 1) {
                this.state = 'showing';
            } else if (this.state === 'showing') {
                this.showTimer += dt;
                // Wave tilt side to side
                this.tilt = Math.sin(time * 5) * 0.15;
                
                if (this.showTimer >= this.showDuration) {
                    this.state = 'hiding';
                    this.targetY = 720;
                    this.tilt = 0;
                }
            } else if (this.state === 'hiding' && Math.abs(this.y - this.targetY) < 1) {
                this.state = 'hidden';
                this.peekInterval = Math.random() * 25 + 15;
            }
        }
    }
    
    draw(ctx) {
        if (this.state === 'hidden' && this.y >= 719) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);
        ctx.font = '65px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}


// --- CELEBRATION ELEMENTS ---

class DancingAnimal {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.bounceSpeed = Math.random() * 1.5 + 2.8;
        this.bounceHeight = Math.random() * 15 + 28;
    }
    
    draw(ctx, time) {
        const bounce = Math.abs(Math.sin(time * this.bounceSpeed)) * -this.bounceHeight;
        const rotate = Math.sin(time * this.bounceSpeed * 0.5) * 0.14;
        
        ctx.save();
        ctx.translate(this.x, this.y + bounce);
        ctx.rotate(rotate);
        ctx.font = '85px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

class Confetti {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.y = Math.random() * -canvasHeight;
    }
    
    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = -20;
        this.size = Math.random() * 5 + 8;
        this.speedY = Math.random() * 50 + 55;
        this.speedX = Math.random() * 20 - 10;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 4 - 2;
        
        const colors = ['#ffb7b2', '#ffdac1', '#fff5ba', '#e2f0cb', '#b5e2fa', '#e2cee2'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(dt) {
        this.y += this.speedY * dt;
        this.x += this.speedX * dt;
        this.rotation += this.rotationSpeed * dt;
        
        if (this.y > this.canvasHeight + 20) {
            this.reset();
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.4);
        ctx.restore();
    }
}

class Balloon {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
        this.y = Math.random() * canvasHeight + canvasHeight;
    }
    
    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = this.canvasHeight + 100;
        this.speedY = Math.random() * 25 + 30; // Float slow
        this.radius = Math.random() * 15 + 22;
        const colors = ['#ffb7b2', '#ffdac1', '#fff5ba', '#e2f0cb', '#b5e2fa', '#e2cee2'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.wobbleSpeed = Math.random() * 1.5 + 1.5;
        this.wobbleWidth = Math.random() * 12 + 8;
        this.time = 0;
    }
    
    update(dt) {
        this.time += dt;
        this.y -= this.speedY * dt;
        this.xOffset = Math.sin(this.time * this.wobbleSpeed) * this.wobbleWidth;
        
        if (this.y < -100) {
            this.reset();
        }
    }
    
    draw(ctx) {
        const cx = this.x + this.xOffset;
        ctx.save();
        ctx.translate(cx, this.y);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.35, -this.radius * 0.35, this.radius * 0.18, this.radius * 0.3, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Bottom knot
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-4, this.radius);
        ctx.lineTo(4, this.radius);
        ctx.lineTo(0, this.radius + 6);
        ctx.closePath();
        ctx.fill();
        
        // String
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, this.radius + 6);
        ctx.quadraticCurveTo(-5, this.radius + 20, 0, this.radius + 40);
        ctx.stroke();
        
        ctx.restore();
    }
}


// --- POPPED CUSTOM FX CLASSES ---

class FadingRainbow {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 1.0;
        this.scale = 0.4;
        this.maxLife = 3.0;
        this.life = 0;
    }
    
    update(dt) {
        this.life += dt;
        this.alpha = Math.max(0, 1 - this.life / this.maxLife);
        this.scale = 0.4 + 0.45 * (this.life / this.maxLife);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        const colors = ['#ffb7b2', '#ffdac1', '#fff5ba', '#e2f0cb', '#b5e2fa', '#e2cee2'];
        const width = 8;
        const outerRad = 85;
        
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < colors.length; i++) {
            ctx.strokeStyle = colors[i];
            ctx.beginPath();
            ctx.arc(0, 30, outerRad - i * width, Math.PI, 0);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class AnimalPopup {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.life = 3.0;
        this.time = 0;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    draw(ctx) {
        if (this.time >= this.life) return;
        
        const bounce = Math.abs(Math.sin(this.time * 4)) * -22;
        
        let alpha = 1.0;
        if (this.time < 0.2) {
            alpha = this.time / 0.2;
        } else if (this.life - this.time < 0.5) {
            alpha = (this.life - this.time) / 0.5;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '55px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y + bounce);
        ctx.restore();
    }
}

class Ripple {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 10;
        this.maxRadius = 80;
        this.life = 0.4; // 400ms duration
        this.time = 0;
    }
    
    update(dt) {
        this.time += dt;
        const progress = this.time / this.life;
        this.radius = 10 + progress * (this.maxRadius - 10);
        this.alpha = Math.max(0, 1 - progress);
    }
    
    draw(ctx) {
        if (this.time >= this.life) return;
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.alpha * 0.55;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class FloatingEmoji {
    constructor(x, y, emoji) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.vy = -Math.random() * 30 - 30; // Float slow
        this.vx = Math.random() * 20 - 10;
        this.life = 1.5;
        this.time = 0;
        this.rotation = Math.random() * 0.4 - 0.2;
    }
    
    update(dt) {
        this.time += dt;
        this.y += this.vy * dt;
        this.x += Math.sin(this.time * 3.5) * 15 * dt; // Wave sway
        this.rotation += Math.sin(this.time) * 0.15 * dt;
    }
    
    draw(ctx) {
        if (this.time >= this.life) return;
        const alpha = Math.max(0, 1 - this.time / this.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}


// --- PARTICLE SENSORY BURST CLASS ---

class Particle {
    constructor(x, y, color, type, symbol = '') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.symbol = symbol;
        
        this.life = 0;
        this.maxLife = 0.5 + Math.random() * 0.4;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 70 + 40;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        if (type === 'note') {
            this.vx = Math.random() * 26 - 13;
            this.vy = -(Math.random() * 40 + 50);
            this.maxLife = 1.3 + Math.random() * 0.5;
        } else if (type === 'bubble') {
            this.size = Math.random() * 5 + 4;
        } else if (type === 'star') {
            this.size = Math.random() * 7 + 5;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 4 - 2;
        } else if (type === 'confetti') {
            this.size = Math.random() * 6 + 5;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 6 - 3;
            this.vy = -Math.abs(this.vy) * 0.4;
        }
    }
    
    update(dt) {
        this.life += dt;
        
        if (this.type === 'note') {
            this.x += Math.sin(this.life * 4) * 15 * dt;
            this.y += this.vy * dt;
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            if (this.type === 'confetti') {
                this.vy += 45 * dt;
            }
            if (this.rotation !== undefined) {
                this.rotation += this.rotationSpeed * dt;
            }
        }
    }
    
    draw(ctx) {
        const progress = this.life / this.maxLife;
        if (progress >= 1) return;
        
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (this.type === 'bubble') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (1 - progress * 0.5), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x - this.size * 0.25, this.y - this.size * 0.25, this.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            drawStarPath(ctx, 0, 0, 5, this.size, this.size * 0.4);
            ctx.fill();
        } else if (this.type === 'note') {
            ctx.fillStyle = this.color;
            ctx.font = `${Math.floor(22 + (1 - progress) * 8)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.symbol, this.x, this.y);
        } else if (this.type === 'confetti') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.3);
        }
        
        ctx.restore();
    }
}


// --- BUBBLE TARGETS CLASS ---

class Bubble {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Bubble radius: Small=40px (80px size), Medium=55px (110px), Large=70px (140px)
        const sizes = [40, 55, 70];
        this.radius = sizes[Math.floor(Math.random() * 3)];
        
        // Colors corresponding to types
        const colors = ['#ffb7b2', '#b5e2fa', '#fff4b8', '#e2cee2', '#e2f0cb'];
        this.color = colors[Math.floor(Math.random() * 5)];
        
        // Floating speed: 40-80 px/sec
        this.speedY = 40 + Math.random() * 40;
        
        // Swaying drift
        this.swaySpeed = 0.7 + Math.random() * 0.8;
        this.swayWidth = 15 + Math.random() * 20;
        this.swayOffset = Math.random() * Math.PI * 2;
        this.time = 0;
        this.xOffset = 0;
        
        // Tactile physics jiggle offsets
        this.jiggleX = 0;
        this.jiggleY = 0;
        
        // Pop transitions
        this.state = 'floating';
        this.popTimer = 0;
        this.popDuration = 0.12; // 120ms squish feedback
        
        this.scale = 1.0;
        this.squishX = 1.0;
        this.squishY = 1.0;
        
        // Type specifics
        if (type === 'animal') {
            const animals = ['🐶', '🐮', '🐐', '🐱'];
            this.animalEmoji = animals[Math.floor(Math.random() * animals.length)];
        } else if (type === 'heart') {
            this.color = '#ffccd5'; // rose pink
        } else if (type === 'flower') {
            this.color = '#e8dff5'; // light lavender
        } else if (type === 'candy') {
            this.color = '#ffd1eb'; // soft candy pink
        }
    }
    
    click() {
        this.state = 'clicked';
        this.popTimer = 0;
    }
    
    update(dt) {
        // Return jiggle force back to 0
        this.jiggleX += -this.jiggleX * 6 * dt;
        this.jiggleY += -this.jiggleY * 6 * dt;
        
        if (this.state === 'floating') {
            this.y -= this.speedY * dt;
            this.time += dt;
            this.xOffset = Math.sin(this.swayOffset + this.time * this.swaySpeed) * this.swayWidth;
        } else if (this.state === 'clicked') {
            this.popTimer += dt;
            const progress = this.popTimer / this.popDuration;
            
            // Squish feedback
            this.scale = 1.0 + progress * 0.16;
            this.squishX = 1.0 + progress * 0.28;
            this.squishY = 1.0 - progress * 0.28;
            
            if (this.popTimer >= this.popDuration) {
                this.state = 'popped';
            }
        }
    }
    
    draw(ctx) {
        if (this.state === 'popped') return;
        
        const cx = this.x + this.xOffset + this.jiggleX;
        const cy = this.y + this.jiggleY;
        const r = this.radius * this.scale;
        
        // Render bubble body
        if (this.type === 'rainbow') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.squishX, this.squishY);
            
            // Drop shadow
            ctx.fillStyle = 'rgba(109, 89, 122, 0.12)';
            ctx.beginPath();
            ctx.arc(3, 4, r, 0, Math.PI * 2);
            ctx.fill();
            
            const radGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
            radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            radGrad.addColorStop(0.3, 'rgba(255, 183, 178, 0.65)');
            radGrad.addColorStop(0.5, 'rgba(255, 245, 186, 0.65)');
            radGrad.addColorStop(0.7, 'rgba(181, 226, 250, 0.65)');
            radGrad.addColorStop(0.9, 'rgba(226, 206, 226, 0.65)');
            radGrad.addColorStop(1.0, 'rgba(255, 183, 178, 0.75)');
            
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.45, -r * 0.45, r * 0.18, r * 0.32, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        } else if (this.type === 'golden') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.squishX, this.squishY);
            
            // Drop shadow
            ctx.fillStyle = 'rgba(109, 89, 122, 0.15)';
            ctx.beginPath();
            ctx.arc(3, 4, r, 0, Math.PI * 2);
            ctx.fill();
            
            const radGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
            radGrad.addColorStop(0, '#fffde7');
            radGrad.addColorStop(0.3, '#ffe082');
            radGrad.addColorStop(0.8, '#ffb300');
            radGrad.addColorStop(1.0, '#ffa000');
            
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#e65100';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.45, -r * 0.45, r * 0.18, r * 0.32, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        } else {
            drawBubbleShape(ctx, cx, cy, r, this.color, this.squishX, this.squishY);
        }
        
        // Render inside items
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.squishX, this.squishY);
        
        if (this.type === 'animal') {
            ctx.font = `${r * 0.75}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.animalEmoji, 0, 2);
        } else if (this.type === 'star') {
            ctx.fillStyle = '#fff9c4';
            drawStarPath(ctx, 0, -2, 5, r * 0.38, r * 0.16);
            ctx.fill();
        } else if (this.type === 'music') {
            ctx.fillStyle = 'rgba(109, 89, 122, 0.65)';
            ctx.font = `bold ${r * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♫', 0, 0);
        } else if (this.type === 'heart') {
            ctx.fillStyle = '#e56b9c';
            ctx.font = `${r * 0.65}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤️', 0, 1);
        } else if (this.type === 'flower') {
            ctx.fillStyle = '#ffb7b2';
            ctx.font = `${r * 0.65}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌸', 0, 1);
        } else if (this.type === 'candy') {
            ctx.font = `${r * 0.65}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍬', 0, 1);
        } else if (this.type === 'golden') {
            ctx.font = `${r * 0.65}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', 0, 1);
        }
        
        ctx.restore();
    }
}


// --- HAPPINESS MANAGER (SUN & PROGRESS RING) ---

class HappinessManager {
    constructor() {
        this.actualPops = 0;
        this.displayedPops = 0;
        this.sunX = 1150;
        this.sunY = 120;
        this.sunRadius = 45;
        this.rayRotation = 0;
        
        this.state = 'sleeping'; // 'sleeping', 'waking', 'awake'
        this.sleepZTimer = 0.0;
        this.sleepZs = [];
    }
    
    addPop(value) {
        this.actualPops = Math.min(100, this.actualPops + value);
    }
    
    reset() {
        this.actualPops = 0;
        this.displayedPops = 0;
    }
    
    update(dt) {
        // Smooth responsive exponential lerp to eliminate feeling of lag
        const diff = this.actualPops - this.displayedPops;
        if (Math.abs(diff) > 0.05) {
            this.displayedPops += diff * 12 * dt;
        } else {
            this.displayedPops = this.actualPops;
        }
        
        // Z particles for sleeping sun
        if (this.state === 'sleeping') {
            this.sleepZTimer += dt;
            if (this.sleepZTimer >= 0.9) {
                this.sleepZs.push({
                    x: this.sunX - 18,
                    y: this.sunY - 18,
                    size: Math.random() * 8 + 12,
                    alpha: 1.0,
                    vx: Math.random() * -12 - 12,
                    vy: Math.random() * -18 - 18
                });
                this.sleepZTimer = 0;
            }
        } else {
            this.sleepZs = [];
        }
        
        // Update sleep Z particles
        for (let i = this.sleepZs.length - 1; i >= 0; i--) {
            const z = this.sleepZs[i];
            z.x += z.vx * dt;
            z.y += z.vy * dt;
            z.alpha -= 0.35 * dt;
            if (z.alpha <= 0) {
                this.sleepZs.splice(i, 1);
            }
        }
        
        if (this.state !== 'sleeping') {
            this.rayRotation += 0.2 * dt;
        }
    }
    
    draw(ctx) {
        const ratio = this.displayedPops / 100;
        
        ctx.save();
        
        // 1. Draw sleeping Zs
        ctx.fillStyle = '#6d597a';
        this.sleepZs.forEach(z => {
            ctx.save();
            ctx.globalAlpha = z.alpha;
            ctx.font = `${z.size}px sans-serif`;
            ctx.fillText('Z', z.x, z.y);
            ctx.restore();
        });
        
        // 2. Progress Ring Backdrop
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(this.sunX, this.sunY, this.sunRadius + 18, 0, Math.PI * 2);
        ctx.stroke();
        
        // 3. Happiness Progress Ring Fill
        if (this.state === 'awake' && ratio > 0) {
            ctx.strokeStyle = '#ffa8b6';
            ctx.beginPath();
            ctx.arc(this.sunX, this.sunY, this.sunRadius + 18, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * ratio));
            ctx.stroke();
        }
        
        // 4. Rotating Rays
        ctx.save();
        ctx.translate(this.sunX, this.sunY);
        ctx.rotate(this.rayRotation);
        
        ctx.fillStyle = '#ffca28';
        const numRays = 8;
        let pulse = 1.0 + ratio * 0.18;
        if (this.state === 'sleeping') pulse = 0.82;
        else if (this.state === 'waking') pulse = 0.92;
        
        for (let i = 0; i < numRays; i++) {
            ctx.rotate((Math.PI * 2) / numRays);
            ctx.beginPath();
            ctx.moveTo(-10, -this.sunRadius - 2);
            ctx.lineTo(0, (-this.sunRadius - 16) * pulse);
            ctx.lineTo(10, -this.sunRadius - 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        
        // 5. Sun Body
        const sunGrad = ctx.createRadialGradient(this.sunX - 10, this.sunY - 10, 5, this.sunX, this.sunY, this.sunRadius);
        sunGrad.addColorStop(0, '#fffde7');
        sunGrad.addColorStop(0.8, '#ffee58');
        sunGrad.addColorStop(1, '#fdd835');
        
        ctx.fillStyle = sunGrad;
        ctx.shadowColor = 'rgba(253, 216, 53, 0.35)';
        ctx.shadowBlur = 12;
        
        ctx.beginPath();
        ctx.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0; // reset
        
        // 6. Cute facial details based on state
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        
        if (this.state === 'sleeping') {
            // Downward arches (sleeping eyes)
            ctx.beginPath();
            ctx.arc(this.sunX - 15, this.sunY - 10, 6, 0, Math.PI);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(this.sunX + 15, this.sunY - 10, 6, 0, Math.PI);
            ctx.stroke();
            
            // Sleeping mouth
            ctx.beginPath();
            ctx.moveTo(this.sunX - 5, this.sunY + 12);
            ctx.lineTo(this.sunX + 5, this.sunY + 12);
            ctx.stroke();
        } else if (this.state === 'waking') {
            // Squint lines
            ctx.beginPath();
            ctx.moveTo(this.sunX - 22, this.sunY - 8);
            ctx.lineTo(this.sunX - 8, this.sunY - 8);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.sunX + 8, this.sunY - 8);
            ctx.lineTo(this.sunX + 22, this.sunY - 8);
            ctx.stroke();
            
            // Small circle mouth (yawing)
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.arc(this.sunX, this.sunY + 12, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Awake (smiling eyes)
            ctx.beginPath();
            ctx.arc(this.sunX - 15, this.sunY - 4, 7, Math.PI, 0);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(this.sunX + 15, this.sunY - 4, 7, Math.PI, 0);
            ctx.stroke();
            
            // Rosy cheeks
            ctx.fillStyle = 'rgba(240, 98, 146, 0.35)';
            ctx.beginPath();
            ctx.arc(this.sunX - 22, this.sunY + 10, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.sunX + 22, this.sunY + 10, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Smiling mouth
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            const mouthDepth = 7 + ratio * 8;
            ctx.moveTo(this.sunX - 9, this.sunY + 11);
            ctx.quadraticCurveTo(this.sunX, this.sunY + 11 + mouthDepth, this.sunX + 9, this.sunY + 11);
            ctx.quadraticCurveTo(this.sunX, this.sunY + 11 + (mouthDepth * 0.4), this.sunX - 9, this.sunY + 11);
            ctx.fill();
        }
        
        ctx.restore();
    }
}


// --- UPGRADED CELEBRATION MANAGER ---

class CelebrationManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.isActive = false;
        this.timer = 0.0;
        this.duration = 18.0; // 18 seconds (between 15-20s)
        this.lastTriggeredEvent = -1;
        
        // Allocations
        this.butterflies = [];
        for (let i = 0; i < 12; i++) {
            this.butterflies.push(new Butterfly(canvasWidth, canvasHeight));
        }
        
        this.confetti = [];
        for (let i = 0; i < 110; i++) {
            this.confetti.push(new Confetti(canvasWidth, canvasHeight));
        }
        
        this.balloons = [];
        for (let i = 0; i < 8; i++) {
            this.balloons.push(new Balloon(canvasWidth, canvasHeight));
        }
        
        const emojis = ['🐶', '🐮', '🐐', '🐱'];
        this.dancingAnimals = [];
        for (let i = 0; i < 4; i++) {
            const x = canvasWidth * (i + 1) / 5;
            this.dancingAnimals.push(new DancingAnimal(x, 625, emojis[i]));
        }
    }
    
    start() {
        this.isActive = true;
        this.timer = 0.0;
        this.lastTriggeredEvent = -1;
        
        // Display initial text
        const overlay = document.getElementById('celebration-overlay');
        if (overlay) {
            overlay.innerText = "🌈 YOU FILLED THE WORLD WITH HAPPINESS! 🌈";
            overlay.classList.add('active');
        }
        
        // Reset button
        const btn = document.getElementById('celebration-btn');
        if (btn) btn.classList.add('hidden');
    }
    
    stop() {
        this.isActive = false;
        this.timer = 0.0;
        
        const overlay = document.getElementById('celebration-overlay');
        if (overlay) overlay.classList.remove('active');
        
        const btn = document.getElementById('celebration-btn');
        if (btn) btn.classList.add('hidden');
    }
    
    update(dt, time, game) {
        if (!this.isActive) return;
        
        this.timer += dt;
        
        // Update components
        this.butterflies.forEach(b => b.update(dt, time));
        this.confetti.forEach(c => c.update(dt));
        this.balloons.forEach(bl => bl.update(dt));
        
        // Continuous flow of tiny heart particles floating up during celebration
        if (Math.random() < 0.25) {
            const px = Math.random() * this.canvasWidth;
            const py = this.canvasHeight + 20;
            const p = new FloatingEmoji(px, py, '❤️');
            game.floatingEmojis.push(p);
        }
        
        // SEQUENTIAL CELEBRATION CHRONOLOGICAL EVENTS
        
        // 1. Text change (at 5.5s)
        if (this.timer > 5.5 && this.lastTriggeredEvent < 1) {
            this.lastTriggeredEvent = 1;
            const overlay = document.getElementById('celebration-overlay');
            if (overlay) {
                overlay.innerText = "EVERYONE IS CELEBRATING!";
            }
        }
        
        // 2. Giant Heart Explosion (at 3.0s)
        if (this.timer > 3.0 && this.lastTriggeredEvent < 2) {
            this.lastTriggeredEvent = 2;
            this.triggerHeartBurst(game);
        }
        
        // 3. Giant Starburst (at 6.8s)
        if (this.timer > 6.8 && this.lastTriggeredEvent < 3) {
            this.lastTriggeredEvent = 3;
            this.triggerStarBurst(game);
        }
        
        // 4. Restart Button & Flower Bloom (at 10.0s)
        if (this.timer > 10.0 && this.lastTriggeredEvent < 4) {
            this.lastTriggeredEvent = 4;
            this.showRestartButton();
            this.triggerFlowerBloom(game);
        }
        
        // 5. Extra Butterfly Swarm (at 13.5s)
        if (this.timer > 13.5 && this.lastTriggeredEvent < 5) {
            this.lastTriggeredEvent = 5;
            this.triggerButterflyGather(game);
        }
        
        if (this.timer >= this.duration) {
            this.stop();
        }
    }
    
    draw(ctx, time) {
        if (!this.isActive) return;
        
        // Draw Double Rainbow Backdrop
        this.drawDoubleRainbow(ctx);
        
        // Draw dancing animals
        this.dancingAnimals.forEach(da => da.draw(ctx, time));
        
        // Draw butterflies
        this.butterflies.forEach(b => b.draw(ctx, time));
        
        // Draw balloons
        this.balloons.forEach(bl => bl.draw(ctx));
        
        // Draw confetti
        this.confetti.forEach(c => c.draw(ctx));
    }
    
    drawDoubleRainbow(ctx) {
        ctx.save();
        const colors = [
            'rgba(255, 183, 178, 0.42)',
            'rgba(255, 218, 193, 0.42)',
            'rgba(255, 245, 186, 0.42)',
            'rgba(226, 240, 203, 0.42)',
            'rgba(181, 226, 250, 0.42)',
            'rgba(226, 206, 226, 0.42)'
        ];
        const cx = 640;
        const cy = 720;
        
        // Primary inner rainbow arch
        const innerRad = 520;
        const width = 16;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        for (let i = 0; i < colors.length; i++) {
            ctx.strokeStyle = colors[i];
            ctx.beginPath();
            ctx.arc(cx, cy, innerRad - i * width, Math.PI, 0);
            ctx.stroke();
        }
        
        // Secondary outer rainbow arch (Double Rainbow!)
        const outerRad = 670;
        const widthSec = 10;
        ctx.lineWidth = widthSec;
        for (let i = 0; i < colors.length; i++) {
            ctx.strokeStyle = colors[i].replace('0.42', '0.22'); // softer opacity
            ctx.beginPath();
            ctx.arc(cx, cy, outerRad - i * widthSec, Math.PI, 0);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    triggerHeartBurst(game) {
        game.soundSynth.playHeartPop();
        // Spawn 22 heart emojis floating outwards from center
        for (let i = 0; i < 22; i++) {
            const angle = (Math.PI * 2 * i) / 22;
            const dist = 50 + Math.random() * 50;
            const px = 640 + Math.cos(angle) * dist;
            const py = 360 + Math.sin(angle) * dist;
            
            const fe = new FloatingEmoji(px, py, '❤️');
            fe.vx = Math.cos(angle) * (Math.random() * 50 + 50);
            fe.vy = Math.sin(angle) * (Math.random() * 50 + 50) - 20;
            fe.life = 2.0;
            game.floatingEmojis.push(fe);
        }
    }
    
    triggerStarBurst(game) {
        game.soundSynth.playStarPop();
        for (let i = 0; i < 30; i++) {
            const pColor = ['#ffb7b2', '#ffdac1', '#fff5ba', '#e2f0cb', '#b5e2fa'][Math.floor(Math.random() * 5)];
            const p = new Particle(640, 320, pColor, 'star');
            game.particles.push(p);
        }
    }
    
    triggerFlowerBloom(game) {
        game.soundSynth.playFlowerPop();
        // Scale bottom flowers up
        game.bottomFlowers.forEach(f => {
            f.scale = 1.7;
        });
        
        // Spawn floating flowers
        for (let i = 0; i < 15; i++) {
            const px = Math.random() * this.canvasWidth;
            const py = this.canvasHeight - 50;
            game.floatingEmojis.push(new FloatingEmoji(px, py, '🌸'));
        }
    }
    
    triggerButterflyGather(game) {
        game.soundSynth.playNormalPop();
        for (let i = 0; i < 8; i++) {
            const b = new Butterfly(this.canvasWidth, this.canvasHeight);
            b.x = 300 + Math.random() * 680;
            b.y = 200 + Math.random() * 300;
            b.speedX = 65;
            this.butterflies.push(b);
        }
    }
    
    showRestartButton() {
        const texts = [
            "🌸 ADD MORE COLORS TO THE WORLD 🌸",
            "MAKE EVERYONE HAPPY AGAIN!",
            "LET'S CREATE MORE MAGIC!",
            "MORE BUBBLES! MORE SMILES!",
            "BRING BACK THE RAINBOW!"
        ];
        const btn = document.getElementById('celebration-btn');
        if (btn) {
            btn.innerText = texts[Math.floor(Math.random() * texts.length)];
            btn.classList.remove('hidden');
        }
    }
}


// --- INTRO SEQUENCE MANAGER ---

class IntroManager {
    constructor() {
        this.isActive = false;
        this.timer = 0.0;
        this.screens = [
            { text: "🌈 Welcome to Bubble Paradise! 🌈", duration: 3.2 },
            { text: "POP BUBBLES TO FILL THE HAPPINESS SUN!", duration: 3.2 },
            { text: "FILL IT COMPLETELY TO SEE THE MAGIC!", duration: 3.2 }
        ];
        this.currentScreenIdx = 0;
        this.screenTimer = 0.0;
        this.hasShownInstructions = false;
    }
    
    start(game) {
        this.isActive = true;
        this.timer = 0.0;
        this.currentScreenIdx = 0;
        this.screenTimer = 0.0;
        
        // Set sun to sleep
        if (game.happinessManager) game.happinessManager.state = 'sleeping';
        
        const corner = document.getElementById('corner-instruction');
        if (corner) corner.classList.add('hidden');
        
        const overlay = document.getElementById('instruction-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.innerText = this.screens[0].text;
            overlay.style.opacity = '1';
        }
        
        // Play intro pluck
        game.soundSynth.playPluck(3);
    }
    
    update(dt, game) {
        if (!this.isActive) return;
        
        this.timer += dt;
        this.screenTimer += dt;
        
        const currentScreen = this.screens[this.currentScreenIdx];
        
        if (this.screenTimer >= currentScreen.duration) {
            this.currentScreenIdx++;
            this.screenTimer = 0.0;
            
            if (this.currentScreenIdx < this.screens.length) {
                game.soundSynth.playPluck(this.currentScreenIdx + 3);
                
                const overlay = document.getElementById('instruction-overlay');
                if (overlay) {
                    overlay.innerText = this.screens[this.currentScreenIdx].text;
                }
            } else {
                this.end(game);
            }
        }
        
        // Sun starts waking in screen 2
        if (this.currentScreenIdx === 1 && this.screenTimer > 1.0) {
            if (game.happinessManager) game.happinessManager.state = 'waking';
        }
        // Sun awake in screen 3
        if (this.currentScreenIdx === 2 && this.screenTimer > 0.5) {
            if (game.happinessManager) game.happinessManager.state = 'awake';
        }
    }
    
    end(game) {
        this.isActive = false;
        this.hasShownInstructions = true;
        
        const overlay = document.getElementById('instruction-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.innerText = "TAP THE BUBBLES!";
                overlay.style.opacity = '1';
            }, 800);
        }
        
        const corner = document.getElementById('corner-instruction');
        if (corner) {
            corner.classList.remove('hidden');
        }
        
        if (game.happinessManager) game.happinessManager.state = 'awake';
    }
}


// --- RANDOM HAPPY EVENTS MANAGER ---

class ShootingStar {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = -150;
        this.y = Math.random() * 250 + 60;
        this.vx = Math.random() * 180 + 240; // Streaks fast
        this.vy = Math.random() * 40 + 40;
        this.size = 18;
        this.active = false;
    }
    
    trigger() {
        this.reset();
        this.active = true;
    }
    
    update(dt, game) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Sparkle trail particles
        if (Math.random() < 0.4) {
            const p = new Particle(this.x, this.y, '#fff5ba', 'star');
            p.maxLife = 0.5;
            p.vx = -this.vx * 0.15 + (Math.random() * 30 - 15);
            p.vy = -this.vy * 0.15 + (Math.random() * 30 - 15);
            game.particles.push(p);
        }
        
        if (this.x > 1350 || this.y > 780) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#fffde7';
        ctx.shadowColor = '#fff5ba';
        ctx.shadowBlur = 12;
        drawStarPath(ctx, 0, 0, 5, this.size, this.size * 0.4);
        ctx.fill();
        ctx.restore();
    }
}

class RandomEventManager {
    constructor() {
        this.shootingStar = new ShootingStar();
        this.eventTimer = 0.0;
        this.nextEventInterval = Math.random() * 18 + 18; // Trigger every 18-36s
    }
    
    update(dt, game) {
        this.shootingStar.update(dt, game);
        
        if (game.introManager.isActive || game.celebrationManager.isActive) return;
        
        this.eventTimer += dt;
        if (this.eventTimer >= this.nextEventInterval) {
            this.triggerRandomEvent(game);
            this.eventTimer = 0.0;
            this.nextEventInterval = Math.random() * 18 + 18;
        }
    }
    
    triggerRandomEvent(game) {
        const events = ['star', 'wave', 'bloom', 'gathering', 'bird'];
        const chosen = events[Math.floor(Math.random() * events.length)];
        
        switch (chosen) {
            case 'star':
                this.shootingStar.trigger();
                game.soundSynth.playStarPop();
                break;
            case 'wave':
                const animal = game.peekingAnimals[Math.floor(Math.random() * game.peekingAnimals.length)];
                if (animal) animal.trigger();
                break;
            case 'bloom':
                game.bottomFlowers.forEach(f => {
                    f.scale = 1.65;
                });
                game.soundSynth.playFlowerPop();
                break;
            case 'gathering':
                // Spiral butterfly injection
                for (let i = 0; i < 4; i++) {
                    const b = new Butterfly(1280, 720);
                    b.x = 250 + Math.random() * 700;
                    b.y = 150 + Math.random() * 380;
                    b.speedX = 60;
                    game.celebrationManager.butterflies.push(b);
                }
                break;
            case 'bird':
                const bird = new SlowBird(1280, 720);
                bird.isRainbow = true;
                bird.speedX = 40;
                game.birds.push(bird);
                break;
        }
    }
    
    draw(ctx) {
        this.shootingStar.draw(ctx);
    }
}


// --- MAIN GAME CONTROLLER ---

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Managers
        this.soundSynth = new SoundSynth();
        this.happinessManager = new HappinessManager();
        this.celebrationManager = new CelebrationManager(1280, 720);
        this.introManager = new IntroManager();
        this.randomEventManager = new RandomEventManager();
        
        // Difficulty Level Adjustment (1.0 = normal, < 1.0 = slower/harder)
        this.difficultyRate = 1.0;
        
        // Background list allocations
        this.clouds = [];
        for (let i = 0; i < 4; i++) {
            this.clouds.push(new SmilingCloud(1280, 720));
        }
        
        this.sparkles = [];
        for (let i = 0; i < 15; i++) {
            this.sparkles.push(new Sparkle(1280, 720, false));
        }
        
        this.celebrationSparkles = [];
        for (let i = 0; i < 30; i++) {
            this.celebrationSparkles.push(new Sparkle(1280, 720, true));
        }
        
        this.birds = [];
        for (let i = 0; i < 2; i++) {
            this.birds.push(new SlowBird(1280, 720));
        }
        
        this.fireflies = [];
        for (let i = 0; i < 20; i++) {
            this.fireflies.push(new Firefly(1280, 720));
        }
        
        this.leaves = [];
        for (let i = 0; i < 10; i++) {
            this.leaves.push(new Leaf(1280, 720));
        }
        
        this.bottomFlowers = [];
        // Space flowers across the canvas width at bottom
        for (let i = 0; i < 26; i++) {
            this.bottomFlowers.push(new BottomFlower(50 * i + 15));
        }
        
        this.peekingAnimals = [
            new PeekingAnimal(100, '🐶'),
            new PeekingAnimal(280, '🐮'),
            new PeekingAnimal(1000, '🐐'),
            new PeekingAnimal(1180, '🐱')
        ];
        
        // Game interactive lists
        this.bubbles = [];
        this.particles = [];
        this.fadingRainbows = [];
        this.animalPopups = [];
        this.ripples = [];
        this.floatingEmojis = [];
        
        this.lastTime = 0;
        this.globalTime = 0;
        
        this.setupEvents();
    }
    
    initBubbles() {
        this.bubbles = [];
        // Spawn 22 bubbles initially spread out vertically
        const count = 22;
        for (let i = 0; i < count; i++) {
            const x = 120 + Math.random() * 1040;
            const y = 80 + Math.random() * 750;
            this.bubbles.push(new Bubble(x, y, this.getRandomType()));
        }
    }
    
    getRandomType() {
        const rand = Math.random();
        if (rand < 0.53) return 'normal';
        if (rand < 0.63) return 'rainbow';
        if (rand < 0.73) return 'animal';
        if (rand < 0.78) return 'star';
        if (rand < 0.83) return 'music';
        if (rand < 0.88) return 'heart';
        if (rand < 0.93) return 'flower';
        if (rand < 0.98) return 'candy';
        return 'golden';
    }
    
    spawnBubble() {
        const x = 120 + Math.random() * 1040;
        const y = 800; // Spawn offscreen below
        this.bubbles.push(new Bubble(x, y, this.getRandomType()));
    }
    
    setupEvents() {
        const audioOverlay = document.getElementById('audio-overlay');
        const startAction = () => {
            this.soundSynth.init();
            if (audioOverlay) {
                audioOverlay.style.opacity = '0';
                setTimeout(() => {
                    audioOverlay.style.visibility = 'hidden';
                    
                    // Initialize bubble pool
                    this.initBubbles();
                    // Begin intro sequence
                    this.introManager.start(this);
                    
                }, 800);
            }
        };
        
        if (audioOverlay) {
            audioOverlay.addEventListener('click', startAction);
            audioOverlay.addEventListener('mousedown', startAction);
            audioOverlay.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startAction();
            }, { passive: false });
        }
        
        // Game pointer clicks
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.soundSynth.init();
            const rect = this.canvas.getBoundingClientRect();
            
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const x = ((touch.clientX - rect.left) / rect.width) * 1280;
                const y = ((touch.clientY - rect.top) / rect.height) * 720;
                this.checkPop(x, y);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.soundSynth.init();
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 1280;
            const y = ((e.clientY - rect.top) / rect.height) * 720;
            this.checkPop(x, y);
        });
        
        // Post-celebration Restart Button binding
        const restartBtn = document.getElementById('celebration-btn');
        const restartAction = () => {
            this.resetCelebration();
        };
        if (restartBtn) {
            restartBtn.addEventListener('click', restartAction);
            restartBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                restartAction();
            }, { passive: false });
        }
        
        // Fullscreen Toggle Button binding
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            const toggleFullscreen = () => {
                this.soundSynth.init(); // Unlock audio context on click
                if (!document.fullscreenElement && 
                    !document.webkitFullscreenElement && 
                    !document.msFullscreenElement) {
                    
                    const el = document.documentElement;
                    if (el.requestFullscreen) {
                        el.requestFullscreen();
                    } else if (el.webkitRequestFullscreen) {
                        el.webkitRequestFullscreen();
                    } else if (el.msRequestFullscreen) {
                        el.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            };
            fullscreenBtn.addEventListener('click', toggleFullscreen);
            fullscreenBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                toggleFullscreen();
            }, { passive: false });
        }

        // Settings Button and Drawer Panel binding
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('active');
            });
            settingsBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                settingsModal.classList.add('active');
            }, { passive: false });
        }
        
        if (closeSettings && settingsModal) {
            closeSettings.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
            closeSettings.addEventListener('touchstart', (e) => {
                e.preventDefault();
                settingsModal.classList.remove('active');
            }, { passive: false });
        }
        
        // Volume and Mute Toggle settings
        const toggleMusicBtn = document.getElementById('toggle-music-btn');
        const musicVolume = document.getElementById('music-volume');
        const toggleSfxBtn = document.getElementById('toggle-sfx-btn');
        const sfxVolume = document.getElementById('sfx-volume');
        
        if (toggleMusicBtn) {
            toggleMusicBtn.addEventListener('click', () => {
                const enabled = !this.soundSynth.musicEnabled;
                this.soundSynth.toggleMusic(enabled);
                toggleMusicBtn.textContent = enabled ? 'ON' : 'OFF';
                toggleMusicBtn.classList.toggle('off', !enabled);
            });
        }
        
        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                this.soundSynth.setMusicVolume(parseFloat(e.target.value));
            });
        }
        
        // Difficulty rate slider binding
        const difficultyRate = document.getElementById('difficulty-rate');
        const difficultyLabel = document.getElementById('difficulty-label');
        if (difficultyRate && difficultyLabel) {
            difficultyRate.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.difficultyRate = val;
                
                // Dynamically display readable feedback labels
                if (val <= 0.3) {
                    difficultyLabel.textContent = 'Relaxed (Very Slow)';
                } else if (val <= 0.6) {
                    difficultyLabel.textContent = 'Slow';
                } else if (val <= 1.1) {
                    difficultyLabel.textContent = 'Normal';
                } else if (val <= 1.6) {
                    difficultyLabel.textContent = 'Fast';
                } else {
                    difficultyLabel.textContent = 'Instant (Super Fast)';
                }
            });
        }
        
        if (toggleSfxBtn) {
            toggleSfxBtn.addEventListener('click', () => {
                const enabled = !this.soundSynth.sfxEnabled;
                this.soundSynth.toggleSfx(enabled);
                toggleSfxBtn.textContent = enabled ? 'ON' : 'OFF';
                toggleSfxBtn.classList.toggle('off', !enabled);
            });
        }
        
        if (sfxVolume) {
            sfxVolume.addEventListener('input', (e) => {
                this.soundSynth.setSfxVolume(parseFloat(e.target.value));
            });
        }
        

        
        window.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    checkPop(x, y) {
        // Reverse iterate to pop bubbles drawn on top first
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            if (b.state === 'floating') {
                const cx = b.x + b.xOffset + b.jiggleX;
                const cy = b.y + b.jiggleY;
                const distSq = (x - cx) ** 2 + (y - cy) ** 2;
                
                // +30px extra hitbox limit for autistic children's accessibility
                const hitLimit = b.radius + 30;
                if (distSq <= hitLimit ** 2) {
                    b.click();
                    
                    // Jiggle nearby bubbles
                    this.jiggleNearbyBubbles(cx, cy, b.radius);
                    break;
                }
            }
        }
    }
    
    jiggleNearbyBubbles(px, py, popRadius) {
        this.bubbles.forEach(b => {
            if (b.state === 'floating') {
                const bx = b.x + b.xOffset + b.jiggleX;
                const by = b.y + b.jiggleY;
                const dx = bx - px;
                const dy = by - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Influence radius of 280px
                if (dist < 280 && dist > 1) {
                    const force = ((280 - dist) / 280) * 35; // Jiggle offset
                    b.jiggleX += (dx / dist) * force;
                    b.jiggleY += (dy / dist) * force;
                }
            }
        });
    }
    
    resetCelebration() {
        this.celebrationManager.stop();
        this.soundSynth.setCelebrating(false);
        this.soundSynth.playChimeChord();
        this.happinessManager.reset();
        
        const btn = document.getElementById('celebration-btn');
        if (btn) btn.classList.add('hidden');
    }
    
    handleBubbleBurst(b) {
        let popValue = 0;
        let popEmoji = '';
        
        switch (b.type) {
            case 'normal':
                this.soundSynth.playNormalPop();
                popValue = 1;
                popEmoji = '✨';
                break;
            case 'rainbow':
                this.soundSynth.playRainbowPop();
                popValue = 6;
                popEmoji = '🌈';
                break;
            case 'star':
                this.soundSynth.playStarPop();
                popValue = 7;
                popEmoji = '⭐';
                break;
            case 'music':
                this.soundSynth.playMusicPop();
                popValue = 8;
                popEmoji = '🎵';
                break;
            case 'heart':
                this.soundSynth.playHeartPop();
                popValue = 6;
                popEmoji = '❤️';
                break;
            case 'flower':
                this.soundSynth.playFlowerPop();
                popValue = 5;
                popEmoji = '🌸';
                break;
            case 'candy':
                this.soundSynth.playCandyPop();
                popValue = 4;
                popEmoji = '🍬';
                break;
            case 'golden':
                this.soundSynth.playGoldenPop();
                popValue = 15;
                popEmoji = '✨';
                break;
            case 'animal':
                // Synthesize animal sound
                if (b.animalEmoji === '🐶') this.soundSynth.playPuppySound();
                else if (b.animalEmoji === '🐱') this.soundSynth.playCatSound();
                else if (b.animalEmoji === '🐮') this.soundSynth.playCowSound();
                else if (b.animalEmoji === '🐐') this.soundSynth.playGoatSound();
                
                popValue = 5;
                popEmoji = b.animalEmoji;
                break;
        }
        
        // 2. Add pop to progress and update adaptive synth ratio
        this.happinessManager.addPop(popValue * this.difficultyRate);
        this.soundSynth.updateHappinessRatio(this.happinessManager.actualPops / 100);
        
        // Trigger celebration mode
        if (this.happinessManager.actualPops >= 100 && !this.celebrationManager.isActive) {
            this.celebrationManager.start();
            this.soundSynth.setCelebrating(true);
            this.soundSynth.playChimeChord();
        }
        
        // 3. Spawn pop ripple and glowing emojis
        const px = b.x + b.xOffset + b.jiggleX;
        const py = b.y + b.jiggleY;
        const color = b.color;
        
        this.ripples.push(new Ripple(px, py, color));
        this.floatingEmojis.push(new FloatingEmoji(px, py, popEmoji));
        
        // 4. Burst particles
        if (b.type === 'normal' || b.type === 'animal') {
            const count = 5 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(px, py, color, 'bubble'));
            }
        }
        if (b.type === 'animal') {
            this.animalPopups.push(new AnimalPopup(px, py, b.animalEmoji));
        } else if (b.type === 'rainbow') {
            this.fadingRainbows.push(new FadingRainbow(px, py));
            const count = 10;
            const rainbowColors = ['#ffb7b2', '#ffdac1', '#fff5ba', '#e2f0cb', '#b5e2fa', '#e2cee2'];
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(px, py, rainbowColors[i % rainbowColors.length], 'star'));
            }
        } else if (b.type === 'star' || b.type === 'golden') {
            const count = b.type === 'golden' ? 24 : 12;
            for (let i = 0; i < count; i++) {
                const type = Math.random() < 0.5 ? 'star' : 'confetti';
                const pColor = b.type === 'golden' ? '#fff5ba' : ['#ffb7b2', '#ffdac1', '#fff5ba', '#b5e2fa', '#e2cee2'][Math.floor(Math.random() * 5)];
                this.particles.push(new Particle(px, py, pColor, type));
            }
        } else if (b.type === 'music') {
            const count = 4;
            const syms = ['♩', '♪', '♫', '♬'];
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(px, py, color, 'note', syms[i % syms.length]));
            }
        } else if (b.type === 'heart') {
            // Heart particle clouds
            const count = 8;
            for (let i = 0; i < count; i++) {
                const fe = new FloatingEmoji(px, py, '❤️');
                fe.vx = Math.random() * 40 - 20;
                fe.vy = -Math.random() * 30 - 30;
                this.floatingEmojis.push(fe);
            }
        } else if (b.type === 'flower') {
            // Flower petal drops
            const count = 8;
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(px, py, '#ffccd5', 'bubble'));
            }
        } else if (b.type === 'candy') {
            // Candy flakes
            const count = 10;
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(px, py, color, 'confetti'));
            }
        }
    }
    
    update(dt) {
        this.globalTime += dt;
        
        // Update background clouds
        this.clouds.forEach(c => c.update(dt));
        
        // Update background sparks
        this.sparkles.forEach(s => s.update(dt));
        if (this.celebrationManager.isActive) {
            this.celebrationSparkles.forEach(cs => cs.update(dt));
        }
        
        // Birds, fireflies, leaves waving
        this.birds.forEach(b => b.update(dt));
        this.fireflies.forEach(f => f.update(dt, this.globalTime));
        this.leaves.forEach(l => l.update(dt));
        this.bottomFlowers.forEach(f => f.update(dt, this.globalTime));
        this.peekingAnimals.forEach(pa => pa.update(dt, this.globalTime));
        
        // Random events manager
        this.randomEventManager.update(dt, this);
        
        // Intro sequences
        if (this.introManager.isActive) {
            this.introManager.update(dt, this);
        }
        
        // Celebration updates
        if (this.celebrationManager.isActive) {
            this.celebrationManager.update(dt, this.globalTime, this);
        } else {
            // If celebration mode auto-finishes
            if (this.happinessManager.actualPops >= 100) {
                this.resetCelebration();
            }
        }
        
        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.update(dt);
            
            if (b.state === 'popped') {
                this.handleBubbleBurst(b);
                this.bubbles.splice(i, 1);
                this.spawnBubble();
            } else if (b.y < -b.radius) {
                this.bubbles.splice(i, 1);
                this.spawnBubble();
            }
        }
        
        // Maintain 22 bubbles on screen at all times
        while (this.bubbles.length < 22) {
            this.spawnBubble();
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update fading popped rainbows
        for (let i = this.fadingRainbows.length - 1; i >= 0; i--) {
            const fr = this.fadingRainbows[i];
            fr.update(dt);
            if (fr.alpha <= 0) {
                this.fadingRainbows.splice(i, 1);
            }
        }
        
        // Update fading animal popups
        for (let i = this.animalPopups.length - 1; i >= 0; i--) {
            const ap = this.animalPopups[i];
            ap.update(dt);
            if (ap.time >= ap.life) {
                this.animalPopups.splice(i, 1);
            }
        }
        
        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const rp = this.ripples[i];
            rp.update(dt);
            if (rp.time >= rp.life) {
                this.ripples.splice(i, 1);
            }
        }
        
        // Update floating emojis
        for (let i = this.floatingEmojis.length - 1; i >= 0; i--) {
            const fe = this.floatingEmojis[i];
            fe.update(dt);
            if (fe.time >= fe.life) {
                this.floatingEmojis.splice(i, 1);
            }
        }
        
        this.happinessManager.update(dt);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, 1280, 720);
        
        // Background sky
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        if (this.celebrationManager.isActive) {
            skyGrad.addColorStop(0, '#ccebff');
            skyGrad.addColorStop(0.55, '#ffe2eb');
            skyGrad.addColorStop(1, '#ffedd1');
        } else {
            skyGrad.addColorStop(0, '#dbf3fa');
            skyGrad.addColorStop(0.55, '#f4e6f8');
            skyGrad.addColorStop(1, '#fff5f9');
        }
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);
        
        // Render clouds
        this.clouds.forEach(c => c.draw(this.ctx));
        
        // Render sparkles
        this.sparkles.forEach(s => s.draw(this.ctx));
        if (this.celebrationManager.isActive) {
            this.celebrationSparkles.forEach(cs => cs.draw(this.ctx));
        }
        
        // Render slow birds
        this.birds.forEach(b => b.draw(this.ctx, this.globalTime));
        
        // Render fireflies
        this.fireflies.forEach(f => f.draw(this.ctx));
        
        // Render falling leaves
        this.leaves.forEach(l => l.draw(this.ctx));
        
        // Render flower garden along bottom
        this.bottomFlowers.forEach(f => f.draw(this.ctx));
        
        // Render peeking grass animals
        this.peekingAnimals.forEach(pa => pa.draw(this.ctx));
        
        // Render random events (shooting star)
        this.randomEventManager.draw(this.ctx);
        
        // Render fading custom popped rainbows
        this.fadingRainbows.forEach(fr => fr.draw(this.ctx));
        
        // Celebration items (rainbows + animals + balloons + confetti)
        this.celebrationManager.draw(this.ctx, this.globalTime);
        
        // Render animal popups
        this.animalPopups.forEach(ap => ap.draw(this.ctx));
        
        // Render pop ripples
        this.ripples.forEach(rp => rp.draw(this.ctx));
        
        // Render popped particles
        this.particles.forEach(p => p.draw(this.ctx));
        
        // Render floating bubbles
        this.bubbles.forEach(b => b.draw(this.ctx));
        
        // Render popped floating emojis in front
        this.floatingEmojis.forEach(fe => fe.draw(this.ctx));
        
        // Render sun
        this.happinessManager.draw(this.ctx);
    }
    
    tick(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        
        if (dt > 0.1) dt = 0.1;
        
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame((t) => this.tick(t));
    }
    
    start() {
        requestAnimationFrame((t) => this.tick(t));
    }
}

// Instantiate game context
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
    window.gameInstance.start();
});

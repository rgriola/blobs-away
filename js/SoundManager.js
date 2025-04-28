/*
Sound effects:
- xxx merge.mp3 - When balls merge
- xxx bounce.mp3 - When balls hit walls
- playerLost.mp3 - When player is absorbed
- xxxx gameOver.mp3 - When game ends
- xxx countdown.mp3 - For the countdown timer
- start.mp3 - Game start sound
- gamemusic - Background music
*/

class SoundManager {
    constructor() {
        // Store audio elements
        this.sounds = {};
        
        // Sound pools for overlapping sounds
        this.soundPools = {};
        
        // Track fade intervals
        this.fadeIntervals = {};
        
        // Global volume control
        this.masterVolume = 0.5;
        
        // Track if sound is enabled (for mute functionality)
        this.soundEnabled = true;
        
        // Preload common game sounds
        this.preloadSounds();
        
        // Initialize sound pools
        this.initSoundPools();

    }
    
    // Preload all game sounds
    preloadSounds() {
        // Define all the sounds used in the game
        const soundFiles = {
            merge: 'sounds/merge.mp3',
            bounce: 'sounds/bounce.mp3',
            gameOver: 'sounds/game_over.mp3',
            countdown: 'sounds/countdown.mp3',
            // Add other sounds as needed
            playerLost: 'sounds/playerlost.mp3',
            // start: 'sounds/start.mp3'
            music: 'sounds/game-music.mp3',
        };
        
        // Create and configure audio elements for each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio(path);
                audio.volume = this.masterVolume;
                
                // Store in the sounds dictionary
                this.sounds[name] = audio;
                
                // Preload by triggering load
                audio.load();
            } catch (error) {
                console.warn(`Failed to load sound: ${name} from ${path}`, error);
            }
        }
    }
    
    // Initialize sound pools for overlapping sounds
    initSoundPools() {

        // Create pools for sounds that might overlap
        this.createSoundPool('merge', 5);  // Allow 5 simultaneous merge sounds
        this.createSoundPool('bounce', 8); // Allow 8 simultaneous bounce sounds
   
   
    }
    
    // Create a pool of audio elements for sounds that might overlap
    createSoundPool(soundName, count = 3) {
        if (!this.hasSound(soundName)) {
            console.warn(`Cannot create pool for nonexistent sound: ${soundName}`);
            return false;
        }
        
        // Get the original sound
        const originalSound = this.sounds[soundName];
        
        // Create the pool array
        this.soundPools[soundName] = [];
        
        // Fill the pool
        for (let i = 0; i < count; i++) {
            const soundClone = new Audio(originalSound.src);
            soundClone.volume = originalSound.volume;
            soundClone.muted = !this.soundEnabled; // Match mute state
            this.soundPools[soundName].push(soundClone);
        }
        
        console.log(`Created pool for ${soundName} with ${count} instances`);
        return true;
    }
    
    // Play a sound by name, allowing overlapping for pooled sounds
    play(soundName, volume = null) {
        // Don't play if sound is disabled
        if (!this.soundEnabled) return;
        
        // Check if we have a pool for this sound
        if (this.soundPools && this.soundPools[soundName]) {
            // Find an available sound in the pool
            const availableSound = this.soundPools[soundName].find(
                sound => sound.paused || sound.ended
            );
            
            if (availableSound) {
                // Reset and play the available sound
                availableSound.currentTime = 0;
                availableSound.volume = volume !== null ? 
                    volume * this.masterVolume : this.masterVolume;
                
                try {
                    const playPromise = availableSound.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn(`Error playing pooled sound ${soundName}:`, error);
                        });
                    }
                    return;
                } catch (error) {
                    console.warn(`Error playing pooled sound ${soundName}:`, error);
                    return;
                }
            }
            
            // If no available sound in pool, find the oldest playing sound
            let oldestSound = this.soundPools[soundName][0];
            let oldestTime = Infinity;
            
            for (const sound of this.soundPools[soundName]) {
                if (sound.currentTime > 0 && sound.currentTime < oldestTime) {
                    oldestSound = sound;
                    oldestTime = sound.currentTime;
                }
            }
            
            // Reuse the oldest sound
            oldestSound.currentTime = 0;
            oldestSound.volume = volume !== null ? 
                volume * this.masterVolume : this.masterVolume;
            
            try {
                oldestSound.play();
            } catch (error) {
                console.warn(`Error playing oldest pooled sound ${soundName}:`, error);
            }
            return;
        }
        
        // For non-pooled sounds, use the standard play method
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        try {
            // Reset the sound if it's already playing
            sound.currentTime = 0;
            
            // Apply custom volume if specified
            if (volume !== null) {
                sound.volume = volume * this.masterVolume;
            }
            
            // Create a promise to handle play failures gracefully
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Error playing sound ${soundName}:`, error);
                });
            }
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }
    
    // Debug version of play method with extended logging
    playWithDebug(soundName, volume = null) {
        console.log(`Attempting to play sound: ${soundName}`);
        
        // Don't play if sound is disabled
        if (!this.soundEnabled) {
            console.log(`Sound is disabled, not playing ${soundName}`);
            return;
        }
        
        // Handle pooled sounds with debug output
        if (this.soundPools && this.soundPools[soundName]) {
            console.log(`Using sound pool for ${soundName}`);
            // Rest of pooled sound logic with logging...
            this.play(soundName, volume);
            return;
        }
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        try {
            // Reset the sound if it's already playing
            sound.currentTime = 0;
            
            // Apply custom volume if provided
            if (volume !== null) {
                sound.volume = volume * this.masterVolume;
                console.log(`Setting custom volume for ${soundName}: ${sound.volume}`);
            }
            
            // Log sound status
            console.log(`Playing sound: ${soundName}, volume: ${sound.volume}`);
            
            // Create a promise to handle play failures gracefully
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`${soundName} started playing successfully`);
                    })
                    .catch(error => {
                        console.error(`Error playing sound ${soundName}:`, error);
                    });
            }
        } catch (error) {
            console.error(`Exception playing sound ${soundName}:`, error);
        }
    }
    
    // Stop a specific sound
    stop(soundName) {
        // Stop the main sound instance
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
        
        // Stop all instances in the pool if it exists
        if (this.soundPools && this.soundPools[soundName]) {
            for (const pooledSound of this.soundPools[soundName]) {
                pooledSound.pause();
                pooledSound.currentTime = 0;
            }
        }
    }
    
    // Stop all sounds
    stopAllSounds() {
        console.log("Stopping all sounds");
        
        // Stop regular sounds
        for (const [name, sound] of Object.entries(this.sounds)) {
            try {
                sound.pause();
                sound.currentTime = 0;
            } catch (error) {
                console.warn(`Error stopping sound ${name}:`, error);
            }
        }
        
        // Stop all sounds in pools
        for (const [name, pool] of Object.entries(this.soundPools)) {
            for (const sound of pool) {
                try {
                    sound.pause();
                    sound.currentTime = 0;
                } catch (error) {
                    console.warn(`Error stopping pooled sound ${name}:`, error);
                }
            }
        }
        
        // Cancel any active fade effects
        for (const fadeId of Object.values(this.fadeIntervals)) {
            clearInterval(fadeId);
        }
        this.fadeIntervals = {};
    }
    
    // Set the master volume (0.0 to 1.0)
    setVolume(volume) {
        // Clamp volume between 0 and 1
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Apply to all regular sounds
        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.masterVolume;
        }
        
        // Apply to all pooled sounds
        for (const pool of Object.values(this.soundPools)) {
            for (const sound of pool) {
                sound.volume = this.masterVolume;
            }
        }
    }
    
    // Set volume for a specific sound
    setSoundVolume(soundName, volume) {
        // Clamp between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, volume)) * this.masterVolume;
        
        // Set volume for the main sound
        if (this.hasSound(soundName)) {
            this.sounds[soundName].volume = clampedVolume;
        }
        
        // Set volume for all instances in the pool
        if (this.soundPools && this.soundPools[soundName]) {
            for (const sound of this.soundPools[soundName]) {
                sound.volume = clampedVolume;
            }
        }
    }
    
    // Fade a specific sound from current volume to target volume
    fadeSound(soundName, targetVolume, duration) {
        if (!this.hasSound(soundName)) {
            console.warn(`Cannot fade nonexistent sound: ${soundName}`);
            return;
        }
        
        const sound = this.sounds[soundName];
        const startVolume = sound.volume;
        const volumeChange = targetVolume * this.masterVolume - startVolume;
        const startTime = performance.now();
        
        // Clear any existing fade for this sound
        if (this.fadeIntervals[soundName]) {
            clearInterval(this.fadeIntervals[soundName]);
        }
        
        // Create new fade interval
        this.fadeIntervals[soundName] = setInterval(() => {
            const elapsedTime = performance.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Apply easing for smoother transitions
            const easedProgress = this.easeInOutQuad(progress);
            
            // Calculate new volume
            const newVolume = startVolume + volumeChange * easedProgress;
            
            // Apply to main sound
            sound.volume = newVolume;
            
            // Apply to all sounds in the pool
            if (this.soundPools && this.soundPools[soundName]) {
                for (const pooledSound of this.soundPools[soundName]) {
                    pooledSound.volume = newVolume;
                }
            }
            
            // Stop when fade is complete
            if (progress >= 1) {
                clearInterval(this.fadeIntervals[soundName]);
                delete this.fadeIntervals[soundName];
            }
        }, 16); // ~60fps update
        
        return this.fadeIntervals[soundName];
    }
    
    // Fade all sounds at once
    fadeAllSounds(targetVolume, duration) {
        const adjustedVolume = targetVolume * this.masterVolume;
        
        Object.keys(this.sounds).forEach(soundName => {
            this.fadeSound(soundName, targetVolume, duration);
        });
    }
    
    // Easing function for smoother transitions
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    // Set volume for a specific category of sounds (all sounds with the same prefix)
    setCategoryVolume(category, volume) {
        const adjustedVolume = volume * this.masterVolume;
        
        // Apply to regular sounds
        for (const [name, sound] of Object.entries(this.sounds)) {
            if (name.startsWith(category)) {
                sound.volume = adjustedVolume;
            }
        }

        // Apply to sound pools
        for (const [name, pool] of Object.entries(this.soundPools)) {
            if (name.startsWith(category)) {
                for (const sound of pool) {
                    sound.volume = adjustedVolume;
                }
            }
        }
    }
    
    // Fade a category of sounds
    fadeCategory(category, targetVolume, duration) {
        const adjustedVolume = targetVolume * this.masterVolume;
        
        const soundsInCategory = Object.keys(this.sounds).filter(name => 
            name.startsWith(category)
        );
        
        soundsInCategory.forEach(soundName => {
            this.fadeSound(soundName, targetVolume, duration);
        });
    }
    
    // Toggle mute state for all sounds
    toggleMute() {
        // Toggle sound enabled state
        this.soundEnabled = !this.soundEnabled;
        
        console.log(`Sound is now ${this.soundEnabled ? 'enabled' : 'muted'}`);
        
        // Apply mute/unmute to all regular sounds
        for (const sound of Object.values(this.sounds)) {
            sound.muted = !this.soundEnabled;
        }
        
        // Apply mute/unmute to all pooled sounds
        for (const pool of Object.values(this.soundPools)) {
            for (const sound of pool) {
                sound.muted = !this.soundEnabled;
            }
        }
        
        return !this.soundEnabled; // Return true if muted, false if unmuted
    }
    
    // Check if a sound exists
    hasSound(soundName) {
        return soundName in this.sounds;
    }
    
    // Add a new sound at runtime
    addSound(name, path, createPool = false, poolSize = 3) {
        if (this.hasSound(name)) {
            console.warn(`Sound ${name} already exists. Use a different name.`);
            return false;
        }
        
        try {
            const audio = new Audio(path);
            audio.volume = this.masterVolume;
            audio.muted = !this.soundEnabled;
            this.sounds[name] = audio;
            audio.load();
            
            // Optionally create a pool for this sound
            if (createPool) {
                this.createSoundPool(name, poolSize);
            }
            
            return true;
        } catch (error) {
            console.error(`Failed to add sound ${name} from ${path}:`, error);
            return false;
        }
    }
    
    // Play looping background music
    playMusic(soundName, volume = 0.5) {
        if (!this.hasSound(soundName)) {
            console.warn(`Music not found: ${soundName}`);
            return false;
        }
        
        const music = this.sounds[soundName];

        // Set looping and volume
        music.loop = true;
        music.volume = volume * this.masterVolume;
        
        // Play the music
        try {
            const playPromise = music.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Error playing music ${soundName}:`, error);
                });
            }
            return true;
        } catch (error) {
            console.warn(`Error playing music ${soundName}:`, error);
            return false;
        }
    }

    // Cross-fade between two music tracks
    crossFade(fromSoundName, toSoundName, duration = 2000) {
        if (!this.hasSound(fromSoundName) || !this.hasSound(toSoundName)) {
            console.warn(`Cannot crossfade: sound not found`);
            return;
        }

        const fromSound = this.sounds[fromSoundName];
        const toSound = this.sounds[toSoundName];
        
        // Store original from volume
        const fromVolume = fromSound.volume;
        
        // Start the new track at 0 volume
        toSound.volume = 0;
        toSound.loop = true;
        toSound.play().catch(e => console.warn("Error starting crossfade:", e));
        
        // Fade out the current track
        this.fadeSound(fromSoundName, 0, duration);
        
        // Simultaneously fade in the new track
        this.fadeSound(toSoundName, fromVolume / this.masterVolume, duration);
        
        // Stop the old track when fade is complete
        setTimeout(() => {
            fromSound.pause();
            fromSound.currentTime = 0;
        }, duration + 50);
    }
}

export { SoundManager };
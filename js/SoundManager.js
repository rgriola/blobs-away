
/*
xxx merge.mp3 - When balls merge
bounce.mp3 - When balls hit walls
player_lost.mp3 - When player is absorbed
game_over.mp3 - When game ends
countdown.mp3 - For the countdown timer
start.mp3 - Game start sound

*/

class SoundManager {
    constructor() {
        // Store audio elements
        this.sounds = {};
        
        // Global volume control
        this.masterVolume = 0.5;
        
        // Track if sound is enabled (for mute functionality)
        this.soundEnabled = true;
        
        // Preload common game sounds
        this.preloadSounds();
    }
    
    // Preload all game sounds
    preloadSounds() {
        // Define all the sounds used in the game
        const soundFiles = {
            merge: 'sounds/merge.mp3',
           // bounce: 'sounds/bounce.mp3',
           // playerLost: 'sounds/player_lost.mp3',
           // gameOver: 'sounds/game_over.mp3',
            //countdown: 'sounds/countdown.mp3',
           // start: 'sounds/start.mp3'
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
    
    // Play a sound by name
    play(soundName) {
        // Don't play if sound is disabled
        if (!this.soundEnabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        try {
            // Reset the sound if it's already playing
            sound.currentTime = 0;
            
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
    
    // Stop a specific sound
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }
    
    // Set the master volume (0.0 to 1.0)
    setVolume(volume) {
        // Clamp volume between 0 and 1
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Apply to all sounds
        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.masterVolume;
        }
    }
    
    // Mute/unmute all sounds
    // Make sure your toggleMute method looks like this:

    toggleMute() {
        // Toggle sound enabled state
        this.soundEnabled = !this.soundEnabled;
        
        console.log(`Sound is now ${this.soundEnabled ? 'enabled' : 'muted'}`);
        
        // Apply mute/unmute to all sounds
        for (const sound of Object.values(this.sounds)) {
            // We don't modify the volume property directly, as we want to keep the master volume
            // Instead, we use the muted property of the Audio element
            sound.muted = !this.soundEnabled;
        }
        
        return !this.soundEnabled; // Return true if muted, false if unmuted
    }
    
    // Check if a sound exists
    hasSound(soundName) {
        return soundName in this.sounds;
    }
    
    // Add a new sound at runtime
    addSound(name, path) {
        if (this.hasSound(name)) {
            console.warn(`Sound ${name} already exists. Use a different name.`);
            return false;
        }
        
        try {
            const audio = new Audio(path);
            audio.volume = this.masterVolume;
            this.sounds[name] = audio;
            audio.load();
            return true;
        } catch (error) {
            console.error(`Failed to add sound ${name} from ${path}:`, error);
            return false;
        }
    }

// Add this debug method to the SoundManager class
playWithDebug(soundName) {
    console.log(`Attempting to play sound: ${soundName}`);
    
    // Don't play if sound is disabled
    if (!this.soundEnabled) {
        console.log(`Sound is disabled, not playing ${soundName}`);
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

}



export { SoundManager };
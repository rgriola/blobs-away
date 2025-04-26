class SoundManager {
    constructor() {
        this.sounds = {
            merge: new Audio('sounds/merge.mp3'),
            // You can add more sounds here later
        };
        
        // Preload all sounds
        for (const sound in this.sounds) {
            this.sounds[sound].load();
        }
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            // Clone the sound to allow overlapping playback
            const soundClone = this.sounds[soundName].cloneNode();
            soundClone.volume = 0.5; // Adjust volume as needed
            soundClone.play().catch(error => {
                console.log("Audio play error:", error);
            });
        }
    }
}

// Create a global sound manager instance
const soundManager = new SoundManager();
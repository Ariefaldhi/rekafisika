// Sound Effects Manager

class SoundEffects {
    enabled: boolean;
    volume: number;
    sounds: Record<string, HTMLAudioElement>;

    constructor() {
        this.enabled = true;
        this.volume = 0.5;

        this.sounds = {
            click: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
            success: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
            error: new Audio("https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3")
        };

        Object.values(this.sounds).forEach(audio => {
            audio.load();
            audio.volume = this.volume;
        });
    }

    play(name: string) {
        if (!this.enabled || !this.sounds[name]) return;
        const audio = this.sounds[name].cloneNode() as HTMLAudioElement;
        audio.volume = this.volume;
        audio.play().catch(e => console.log("Audio play failed", e));
    }
}

export const SFX = new SoundEffects();

// Global Click Listener for buttons and links
if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('button, a, .clickable, input[type="checkbox"], input[type="radio"]');
        if (target) {
            SFX.play('click');
        }
    });
}

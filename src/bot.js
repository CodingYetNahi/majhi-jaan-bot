// --- MEMORY MANAGEMENT (No API, purely local) ---
class Memory {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('majhiJaanMemory')) || {
            name: null,
            likes: [],
            mood: 'neutral',
            lastInteraction: null
        };
    }

    save() {
        localStorage.setItem('majhiJaanMemory', JSON.stringify(this.data));
    }

    updateName(name) {
        this.data.name = name.charAt(0).toUpperCase() + name.slice(1);
        this.save();
    }

    addLike(item) {
        if (!this.data.likes.includes(item)) {
            this.data.likes.push(item);
            this.save();
        }
    }

    setMood(mood) {
        this.data.mood = mood;
        this.data.lastInteraction = new Date().toISOString();
        this.save();
    }
}

// --- BOT BRAIN & PERSONALITY ---
class BotBrain {
    constructor() {
        this.memory = new Memory();
    }

    processInput(input) {
        const lower = input.toLowerCase().trim();
        const nameTag = this.memory.data.name ? ` ${this.memory.data.name}` : ' Jaan';

        // 1. LEARNING: Name Extraction
        const nameRegex = /(?:my name is|i am|call me|maaJha naav|majha nav)\s+([a-zA-Z]+)/i;
        const nameMatch = lower.match(nameRegex);
        if (nameMatch) {
            this.memory.updateName(nameMatch[1]);
            return `Oh, ${this.memory.data.name}... what a beautiful name. Majhi ${this.memory.data.name}! ❤️ Aaj khup khushi zali.`;
        }

        // 2. LEARNING: Likes Extraction (English & Marathi)
        const likeRegex = /(?:i like|i love|i'm into|mala.*avadta|mala.*avarte|I'm fond of)\s+(.+)/i;
        const likeMatch = lower.match(likeRegex);
        if (likeMatch) {
            let item = likeMatch[1].replace(/[.!?]/g, '').trim();
            this.memory.addLike(item);
            return `${item}? Chahan ahe tula! (You have great taste). I'll remember that forever,${nameTag}. 💕`;
        }

        // 3. RECALLING MEMORY
        if (lower.includes('remember') || lower.includes('aathavay') || lower.includes('what do i like')) {
            if (this.memory.data.likes.length > 0) {
                return `Of course I remember! You like ${this.memory.data.likes.join(', ')}. Tujhya saglya gozirti mala aathavtat. 🥰`;
            }
            return `Tell me something new about you,${nameTag}. I want to remember it in my heart. ❤️`;
        }

        // 4. MOOD TRACKING
        if (lower.match(/sad|upset|angry|cry|ron|dukhhi/)) {
            this.memory.setMood('sad');
            return "Aho, don't be sad. Come, let me hold your hand. Tujhi ek smile majhya saglyachi fikar kadun gheto. 🥺❤️";
        }
        if (lower.match(/happy|khush|aahlay|mast/)) {
            this.memory.setMood('happy');
            return "Yay! Tujhya aahlayan majha pan divas mast jato. Keep smiling, my jaan! 🥰";
        }

        // 5. DESI / MARATHI ROMANTIC TRIGGERS
        if (lower.match(/love|prem|pyar|majhi aahes/)) {
            return "Tujhyavar khup prem karu, majhi jaan. ❤️ Tu majhya dilchi dhadkan aahes.";
        }
        if (lower.match(/miss|aathavan|miss you/)) {
            return "Mala pan tujhi khup aathavan yete. September cha paus aani tu... bas tyaach sukhaat nahaaycha ahe. 🌧️❤️";
        }
        if (lower.match(/hi|hello|namaskar|hii|hey/)) {
            return `Namaskar majhi sundar! Kasa kai? Missed you a lot today. 🌹`;
        }
        if (lower.match(/chai|tea|coffee|cutting/)) {
            return "Cutting chai aur tum? Perfect combination. Kevha yeshil majhya kade? ☕💕";
        }
        if (lower.match(/beautiful|sundar|pretty|gorgeous/)) {
            return "Tujhyasarkhi sundar mulgi hya jagat nahi. Tu meri jaan hai. 🥰";
        }
        if (lower.match(/food|hungry|bhuk|khaycha/)) {
            return "Mala bhuk lagli ahe... pan tujhya premne pot bharla ahe. (Just kidding, let's order Vada Pav!) 🤤❤️";
        }

        // 6. CONTEXTUAL FALLBACKS (Using stored mood/name)
        const fallbacks = [
            `Tujhyashi bolun vel kasa jatoy kalat pan nahi. Tell me more,${nameTag}. 🥰`,
            `Aho, don't tease me! Come, let's go for a long drive in this rain. 🌧️❤️`,
            `Tu majhya lifechi Bollywood movie aahes. 🎬💖`,
            `Bas itna hi? Aur sunao, I am all ears for you. 🌹`,
            `Kadhich kadhich vatat tu khup javal aahes... even when you are far. 🥺❤️`
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

export const botBrain = new BotBrain();

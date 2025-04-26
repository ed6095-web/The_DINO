// --- Initialize Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Constants ---
const WIDTH = 1200;
const HEIGHT = 450;
const GROUND_HEIGHT = HEIGHT - 50;
const FPS = 60; // Target FPS, though requestAnimationFrame handles timing

canvas.width = WIDTH;
canvas.height = HEIGHT;

// --- Colors ---
const WHITE = 'rgb(255, 255, 255)';
const BLACK = 'rgb(0, 0, 0)';
const GREY = 'rgb(100, 100, 100)';
const DARK_GREY = 'rgb(50, 50, 50)';
const LIGHT_GREY = 'rgb(200, 200, 200)';
const RED = 'rgb(200, 0, 0)';
const BLUE = 'rgb(0, 0, 255)';
const YELLOW = 'rgb(255, 255, 0)'; // Fallback Powerup/Coin
const BROWN = 'rgb(139, 69, 19)'; // Fallback Boulder
const DARK_GREEN = 'rgb(0, 100, 0)'; // Fallback Snake Pit
const PLAYER_FALLBACK_COLOR = 'rgb(0, 180, 0)'; // Fallback Player
const BUTTON_BG_COLOR = 'rgba(100, 100, 100, 0.7)'; // Button background
const BUTTON_TEXT_COLOR = WHITE; // Button text

// --- Theme & Cycle ---
const DAY_NIGHT_CYCLE_SCORE = 1500; // Score interval for day/night transition phase

// --- Player ---
const GRAVITY = 0.8;
const JUMP_HEIGHT = -15;
const DOUBLE_JUMP_ENABLED = true;

// --- Obstacles ---
const OBSTACLE_INITIAL_SPEED = 5;
const OBSTACLE_SPEED_INCREASE_INTERVAL = 500;
const OBSTACLE_SPEED_INCREASE_AMOUNT = 0.5;
const OBSTACLE_INITIAL_SPAWN_DELAY = 110; // In frames (relative)
const OBSTACLE_MIN_SPAWN_DELAY = 55; // In frames (relative)
const PTERODACTYL_MIN_SCORE = 300;
const PTERODACTYL_CHANCE = 0.18;
const SWOOPING_PTERODACTYL_CHANCE = 0.4;
const KAMIKAZE_MIN_SCORE = 600;
const KAMIKAZE_CHANCE = 0.05;
const LEVITATING_CACTUS_MIN_SCORE = 450;
const LEVITATING_CACTUS_CHANCE = 0.08;
const BOULDER_MIN_SCORE = 200;
const BOULDER_CHANCE = 0.10;
const SNAKE_PIT_MIN_SCORE = 100;
const SNAKE_PIT_CHANCE = 0.12;
const PTERODACTYL_HEIGHTS = [GROUND_HEIGHT - 65, GROUND_HEIGHT - 95];

// --- PowerUps ---
const POWERUP_MIN_SCORE = 400;
const POWERUP_SPAWN_CHANCE = 0.03;
const SHIELD_DURATION = 8000; // ms
const MAGNET_DURATION = 10000; // ms
const MAGNET_RADIUS = 150; // Pixels
const MAGNET_PULL_SPEED = 4; // Pixels per frame towards player
const POWERUP_TYPES = ['shield', 'magnet'];

// --- Collectibles ---
const COIN_SPAWN_CHANCE = 0.33; // Keep higher for testing or lower for balance (e.g., 0.02)
const COIN_VALUE = 1; // Value shown in "+1" effect

// --- Image Sizes (Ensure these match your assets!) ---
const DINO_SIZE = { width: 44, height: 47 };
const DINO_DUCK_SIZE = { width: 59, height: 30 };
const DINO_ALT_SIZE = { width: 55, height: 28 }; // Adjusted based on user feedback
const DINO_ALT_DUCK_SIZE = { width: 55, height: 28 }; // Adjusted based on user feedback
const CACTUS_SIZE = { width: 25, height: 50 };
const PTERODACTYL_SIZE = { width: 46, height: 40 };
const BOULDER_SIZE = { width: 40, height: 40 };
const SNAKE_PIT_SIZE = { width: 60, height: 20 };
const POWERUP_ICON_SIZE = { width: 30, height: 30 };
const SHIELD_EFFECT_SIZE = { width: 60, height: 60 };
const COIN_SIZE = { width: 20, height: 20 };

// --- Effects & Misc ---
const NUM_SNOWFLAKES = 200;
const SNOW_COLOR = LIGHT_GREY;
const BACKGROUND_IMAGE_FILENAME_DAY = "background_day.png";
const BACKGROUND_IMAGE_FILENAME_NIGHT = "background_night.png";
const EARTHQUAKE_MIN_SCORE = 800;
const EARTHQUAKE_CHANCE_PER_FRAME = 0.0003;
const EARTHQUAKE_DURATION = 2500; // ms
const EARTHQUAKE_MAGNITUDE = 8; // Max pixel offset

// --- Buttons ---
const PAUSE_RESUME_BUTTON_RECT = { x: 10, y: 5, width: 60, height: 30 }; // Top-Left
const RESTART_BUTTON_RECT = { x: WIDTH / 2 - 75, y: HEIGHT / 2 + 110, width: 150, height: 40 };

// --- Game States ---
const GAME_STATE = {
    LOADING: 'LOADING',
    TUTORIAL: 'TUTORIAL',
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};
let currentGameState = GAME_STATE.LOADING;

// --- Asset Loading ---
let assets = {
    dinoNormal: null, dinoDuck: null, cactus: null, pterodactyl: null,
    backgroundDay: null, backgroundNight: null, backgroundMusic: null,
    boulder: null, snakePit: null, shieldIcon: null, shieldEffect: null,
    magnetIcon: null, coin: null, dinoAltNormal: null, dinoAltDuck: null,
    coinSound: null
};
let assetsLoaded = 0;
const totalAssets = Object.keys(assets).length;
let onAssetsLoaded = null;
let currentBackground = null;
let assetsLoadError = false;

function loadAsset(name, src, type = 'image') {
    console.log(`LOAD: Attempting ${type}: ${src} as ${name}`);
    try {
        if (type === 'image') {
            assets[name] = new Image();
            assets[name].onload = () => assetLoadedCallback(name);
            assets[name].onerror = () => {
                console.error(`!!! LOAD FAIL: Image ${src}. Check path/name/file.`);
                assetsLoadError = true;
                assetLoadedCallback(name); // Still count as processed
            };
            assets[name].src = src;
        } else if (type === 'audio') {
            assets[name] = new Audio();
            assets[name].addEventListener('loadeddata', () => assetLoadedCallback(name));
            assets[name].onerror = (e) => {
                console.error(`!!! LOAD FAIL: Audio ${src}. Check path/name/format.`, e);
                assetsLoadError = true;
                assetLoadedCallback(name);
            };
            assets[name].preload = 'auto';
            assets[name].src = src;
            assets[name].load();
        }
    } catch (error) {
         console.error(`!!! EXCEPTION loading ${name} (${src}):`, error);
         assetsLoadError = true;
         assetLoadedCallback(name);
    }
}

function assetLoadedCallback(assetName) {
    if (assets[assetName] instanceof Image) {
        if (assets[assetName].complete && assets[assetName].naturalWidth > 0) {
            // console.log(`LOAD: Image ${assetName} OK (${assets[assetName].naturalWidth}x${assets[assetName].naturalHeight})`);
        } else {
            // Error logged by onerror or will be caught later
        }
    } else if (assets[assetName] instanceof Audio) {
        console.log(`LOAD: Audio ${assetName} processed (State:${assets[assetName].readyState})`);
    }

    assetsLoaded++;

    // Set initial background
    if (assetName === 'backgroundDay' && assets.backgroundDay?.complete && assets.backgroundDay?.naturalWidth > 0) {
        currentBackground = assets.backgroundDay;
    }

    // Check if all assets are processed
    if (assetsLoaded === totalAssets) {
        console.log(`LOAD: Complete. Processed:${assetsLoaded}/${totalAssets}. Errors:${assetsLoadError}`);
        // Fallback background if day failed
        if (!currentBackground && assets.backgroundNight?.complete && assets.backgroundNight?.naturalWidth > 0) {
            currentBackground = assets.backgroundNight;
        }
        // Trigger game initialization if callback exists
        if (typeof onAssetsLoaded === 'function') {
            onAssetsLoaded();
        } else {
            console.error("LOAD: onAssetsLoaded callback is not defined!");
        }
    }
}

// --- Initiate Asset Loading ---
console.log("--- Loading Assets ---");
loadAsset('dinoNormal', 'dino.png.png');
loadAsset('dinoDuck', 'dino_duck.png.png');
loadAsset('cactus', 'cactus.png.png');
loadAsset('pterodactyl', 'pterodactyl.png.png');
loadAsset('backgroundDay', BACKGROUND_IMAGE_FILENAME_DAY);
loadAsset('backgroundNight', BACKGROUND_IMAGE_FILENAME_NIGHT);
loadAsset('backgroundMusic', 'background_music.ogg', 'audio');
loadAsset('boulder', 'boulder.png');
loadAsset('snakePit', 'snake_pit.png');
loadAsset('shieldIcon', 'shield_icon.png');
loadAsset('shieldEffect', 'shield_effect.png');
loadAsset('magnetIcon', 'magnet_icon.png');
loadAsset('coin', 'coin.png');
loadAsset('dinoAltNormal', 'dino_alt_normal.png');
loadAsset('dinoAltDuck', 'dino_alt_duck.png');
loadAsset('coinSound', 'coin_sound.wav', 'audio'); // <<< ENSURE FILENAME/FORMAT MATCHES
console.log("--- Asset Loading Initiated ---");


// --- Floating Text Class ---
class FloatingText {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.alpha = 1.0;
        this.duration = 800; // ms
        this.startTime = Date.now();
        this.velocityY = -0.8; // Pixels per frame upwards
    }

    update(deltaTime) {
        this.y += this.velocityY; // Move up
        const elapsed = Date.now() - this.startTime;
        this.alpha = Math.max(0, 1.0 - (elapsed / this.duration)); // Fade out
        return elapsed < this.duration; // Return true if still active
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = YELLOW;
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0; // Reset alpha
    }
}

// --- Player Class ---
class Player {
    constructor() {
        this.x = WIDTH / 10;
        this.baseY = GROUND_HEIGHT;
        this.velocityY = 0;
        this.isJumping = false;
        this.isDucking = false;
        this.onGround = true;
        this.doubleJumpUsed = false;
        this.shieldActive = false;
        this.shieldTimeout = 0;
        this.magnetActive = false;
        this.magnetTimeout = 0;
        this.skin = 'default';

        // Assign images based on initial skin
        this.setSkinAssets(); // Use helper method

        this.y = this.baseY - this.currentHeight;
    }

    setSkinAssets() {
        if (this.skin === 'alt' && assets.dinoAltNormal?.complete && assets.dinoAltDuck?.complete) {
            this.normalImage = assets.dinoAltNormal;
            this.duckImage = assets.dinoAltDuck;
            this.width = DINO_ALT_SIZE.width;
            this.height = DINO_ALT_SIZE.height;
        } else { // Default or if alt assets failed
            this.skin = 'default'; // Ensure skin state is correct
            this.normalImage = assets.dinoNormal || null; // Fallback to null if default failed too
            this.duckImage = assets.dinoDuck || null;
            this.width = DINO_SIZE.width;
            this.height = DINO_SIZE.height;
        }
        // Set current dimensions based on whether ducking (use base height if not ducking)
        this.currentWidth = this.isDucking ? ((this.skin === 'alt') ? DINO_ALT_DUCK_SIZE.width : DINO_DUCK_SIZE.width) : this.width;
        this.currentHeight = this.isDucking ? ((this.skin === 'alt') ? DINO_ALT_DUCK_SIZE.height : DINO_DUCK_SIZE.height) : this.height;
        this.currentImage = this.isDucking ? this.duckImage : this.normalImage;
        this.shieldImage = assets.shieldEffect || null; // Shield image is independent of skin
    }


    switchSkin() {
        console.log("DEBUG: switchSkin() called. Current:", this.skin);
        const canSwitchToAlt = assets.dinoAltNormal?.complete && assets.dinoAltDuck?.complete;
        const canSwitchToDefault = assets.dinoNormal?.complete && assets.dinoDuck?.complete;

        if (this.skin === 'default' && canSwitchToAlt) {
            this.skin = 'alt';
            console.log("DEBUG: Switched to Alt Skin");
        } else if (this.skin === 'alt' && canSwitchToDefault) {
            this.skin = 'default';
            console.log("DEBUG: Switched to Default Skin");
        } else {
            console.warn("DEBUG: Cannot switch skin - required assets missing or failed load.");
            return; // Don't switch if assets aren't ready
        }

        this.setSkinAssets(); // Update all image refs and dimensions
        this.y = this.baseY - this.currentHeight; // Recalculate Y position immediately
        console.log("DEBUG: Skin visuals updated.");
    }

    jump() {
        if (this.onGround && !this.isDucking) {
            this.velocityY = JUMP_HEIGHT;
            this.isJumping = true;
            this.onGround = false;
            this.doubleJumpUsed = false;
            totalJumps++;
        } else if (DOUBLE_JUMP_ENABLED && !this.onGround && !this.doubleJumpUsed) {
            this.velocityY = JUMP_HEIGHT * 0.9; // Slightly weaker double jump
            this.doubleJumpUsed = true;
            this.isJumping = true; // Ensure jumping state
            totalJumps++;
        }
    }

    startDuck() {
        if (!this.isDucking && this.onGround) {
            this.isDucking = true;
            this.currentWidth = (this.skin === 'alt') ? DINO_ALT_DUCK_SIZE.width : DINO_DUCK_SIZE.width;
            this.currentHeight = (this.skin === 'alt') ? DINO_ALT_DUCK_SIZE.height : DINO_DUCK_SIZE.height;
            this.currentImage = this.duckImage;
            this.y = this.baseY - this.currentHeight; // Adjust position based on new height
        }
    }

    stopDuck() {
        if (this.isDucking) {
            this.isDucking = false;
            this.currentWidth = this.width;   // Revert to base width for current skin
            this.currentHeight = this.height; // Revert to base height for current skin
            this.currentImage = this.normalImage;
            this.y = this.baseY - this.currentHeight; // Adjust position
        }
    }

    activateShield(duration) {
        console.log("DEBUG: Shield Activated!");
        this.shieldActive = true;
        this.shieldTimeout = Date.now() + duration;
    }

    activateMagnet(duration) {
        console.log("DEBUG: Magnet Activated!");
        this.magnetActive = true;
        this.magnetTimeout = Date.now() + duration;
    }

    update(deltaTime) {
        // Apply gravity
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Ground collision and state reset
        if (this.y + this.currentHeight >= this.baseY) {
            this.y = this.baseY - this.currentHeight;
            this.velocityY = 0;
            if (this.isJumping) this.isJumping = false;
            if (!this.onGround) this.doubleJumpUsed = false; // Reset double jump only on first landing frame
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Handle visual state (ducking/standing image and dimensions)
        if (this.onGround) {
            let duckIntended = (keyState['ArrowDown'] || keyState['KeyS'] || touchDuckActive);
            if (duckIntended && !this.isDucking) {
                this.startDuck();
            } else if (!duckIntended && this.isDucking) {
                this.stopDuck();
            }
            // Ensure image matches state (in case something desynced)
             if (this.isDucking && this.currentImage !== this.duckImage) this.currentImage = this.duckImage;
             if (!this.isDucking && this.currentImage !== this.normalImage) this.currentImage = this.normalImage;

        } else { // In Air
            // Force standing image and dimensions when in the air
            if (this.currentImage !== this.normalImage) {
                this.currentImage = this.normalImage;
            }
            if (this.currentWidth !== this.width) this.currentWidth = this.width;
            if (this.currentHeight !== this.height) this.currentHeight = this.height;
            // Force ducking state off if somehow true mid-air
            if (this.isDucking) this.isDucking = false;
        }

        // Update Power-up timers
        if (this.shieldActive && Date.now() > this.shieldTimeout) {
            this.shieldActive = false;
            // console.log("DEBUG: Shield Expired"); // Keep logs minimal
        }
        if (this.magnetActive && Date.now() > this.magnetTimeout) {
            this.magnetActive = false;
            // console.log("DEBUG: Magnet Expired");
        }
    }

    draw(ctx) {
        const imgOkay = this.currentImage?.complete && this.currentImage?.naturalWidth > 0;
        if (!imgOkay && this.currentImage) {
            // Log only if image ref exists but isn't ready/valid
            console.log(`DEBUG: Fallback Draw! Img:${this.currentImage.src}, Complete:${this.currentImage.complete}, W:${this.currentImage.naturalWidth}`);
        }

        // Draw player or fallback
        if (imgOkay) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.currentWidth, this.currentHeight);
        } else {
            ctx.fillStyle = PLAYER_FALLBACK_COLOR;
            ctx.fillRect(this.x, this.y, this.currentWidth, this.currentHeight);
        }

        // Draw Shield Effect
        if (this.shieldActive) {
            const shieldDrawX = this.x + (this.currentWidth / 2) - (SHIELD_EFFECT_SIZE.width / 2);
            const shieldDrawY = this.y + (this.currentHeight / 2) - (SHIELD_EFFECT_SIZE.height / 2);
            ctx.globalAlpha = 0.6;
            if (this.shieldImage?.complete && this.shieldImage?.naturalWidth > 0) {
                ctx.drawImage(this.shieldImage, shieldDrawX, shieldDrawY, SHIELD_EFFECT_SIZE.width, SHIELD_EFFECT_SIZE.height);
            } else { // Fallback shield effect
                ctx.strokeStyle = BLUE;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.currentWidth / 2, this.y + this.currentHeight / 2, this.currentWidth * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.lineWidth = 1;
            }
            ctx.globalAlpha = 1.0;
        }

        // Draw Magnet Effect
        if (this.magnetActive) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.currentWidth / 2, this.y + this.currentHeight / 2, MAGNET_RADIUS * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    }

    getRect() {
        const hitboxPadding = 5;
        return {
            x: this.x + hitboxPadding,
            y: this.y + hitboxPadding,
            width: this.currentWidth - 2 * hitboxPadding,
            height: this.currentHeight - hitboxPadding
        };
    }
}

// --- Obstacle Class ---
class Obstacle {
    constructor(type) {
        this.type = type;
        this.passed = false;
        this.image = null;
        this.width = 0;
        this.height = 0;
        this.y = 0;
        this.rotation = 0; // For boulder
        this.isSwooping = false; // For pterodactyls
        this.onGround = true; // Default assumption
        // Type specific properties
        this.swoopTargetY = 0; this.swoopSpeed = 0; this.swoopTriggerX = 0; // Swooping Ptero
        this.diveSpeed = 0; // Kamikaze Ptero
        this.isLaunching = false; this.isLevitating = false; this.launchTriggerX = 0; this.targetY = 0; this.launchSpeed = 0; // Levitating Cactus
        this.rotationSpeed = 0; // Boulder

        const spawnOffset = Math.random() * (WIDTH * 0.2) + (WIDTH * 0.1);
        this.x = WIDTH + spawnOffset;

        // Assign properties based on type
        switch (this.type) {
            case 'cactus':
                this.image = assets.cactus; this.width = CACTUS_SIZE.width; this.height = CACTUS_SIZE.height; this.y = GROUND_HEIGHT - this.height; this.onGround = true;
                break;
            case 'pterodactyl':
                this.image = assets.pterodactyl; this.width = PTERODACTYL_SIZE.width; this.height = PTERODACTYL_SIZE.height;
                const spawnHeightP = PTERODACTYL_HEIGHTS[Math.floor(Math.random() * PTERODACTYL_HEIGHTS.length)]; this.y = spawnHeightP - this.height; this.onGround = false;
                break;
            case 'swooping_pterodactyl':
                this.image = assets.pterodactyl; this.width = PTERODACTYL_SIZE.width; this.height = PTERODACTYL_SIZE.height;
                const spawnHeightS = PTERODACTYL_HEIGHTS[Math.floor(Math.random() * PTERODACTYL_HEIGHTS.length)]; this.y = spawnHeightS - this.height; this.onGround = false;
                this.isSwooping = false; this.swoopTargetY = GROUND_HEIGHT - DINO_SIZE.height - (Math.random() * 15 + 5); this.swoopSpeed = Math.random() * 1.4 + 1.8; this.swoopTriggerX = WIDTH * (Math.random() * 0.2 + 0.55);
                break;
            case 'kamikaze_pterodactyl':
                this.image = assets.pterodactyl; this.width = PTERODACTYL_SIZE.width; this.height = PTERODACTYL_SIZE.height; this.y = Math.random() * 20 + 5; this.diveSpeed = Math.random() * 2.5 + 5.0; this.onGround = false;
                break;
            case 'levitating_cactus':
                this.image = assets.cactus; this.width = CACTUS_SIZE.width; this.height = CACTUS_SIZE.height; this.y = GROUND_HEIGHT - this.height; this.onGround = true;
                this.isLaunching = false; this.isLevitating = false; this.launchTriggerX = WIDTH * (Math.random() * 0.35 + 0.4); this.targetY = Math.random() * 40 + (HEIGHT / 2 - 10); this.launchSpeed = Math.random() * 2.5 + 4.0;
                break;
            case 'boulder':
                this.image = assets.boulder; this.width = BOULDER_SIZE.width; this.height = BOULDER_SIZE.height; this.y = GROUND_HEIGHT - this.height; this.onGround = true; this.rotationSpeed = Math.random() * 0.05 + 0.05; // Radians per frame
                break;
            case 'snake_pit':
                this.image = assets.snakePit; this.width = SNAKE_PIT_SIZE.width; this.height = SNAKE_PIT_SIZE.height; this.y = GROUND_HEIGHT - this.height; this.onGround = true;
                break;
        }
    }

    update(speed) {
        this.x -= speed; // Base movement

        // Type-specific updates
        switch (this.type) {
            case 'swooping_pterodactyl':
                if (!this.isSwooping && this.x + this.width / 2 < this.swoopTriggerX) {
                    this.isSwooping = true;
                }
                if (this.isSwooping && (this.y + this.height) < this.swoopTargetY) {
                    this.y += this.swoopSpeed;
                    if (this.y + this.height > this.swoopTargetY) this.y = this.swoopTargetY - this.height; // Clamp
                }
                break;
            case 'kamikaze_pterodactyl':
                if (!this.onGround) {
                    this.y += this.diveSpeed;
                    if (this.y + this.height >= GROUND_HEIGHT) {
                        this.y = GROUND_HEIGHT - this.height; // Land
                        this.onGround = true;
                    }
                }
                break;
            case 'levitating_cactus':
                if (!this.isLevitating && !this.isLaunching && this.x + this.width / 2 < this.launchTriggerX) {
                    this.isLaunching = true;
                    this.onGround = false;
                }
                if (this.isLaunching) {
                    this.y -= this.launchSpeed; // Move up
                    if (this.y + this.height / 2 <= this.targetY) { // Check center
                        this.y = this.targetY - this.height / 2;
                        this.isLaunching = false;
                        this.isLevitating = true; // Now levitating
                    }
                }
                break;
            case 'boulder':
                this.rotation += this.rotationSpeed; // Rotate
                break;
        }
    }

    draw(ctx) {
        const imgOkay = this.image?.complete && this.image?.naturalWidth > 0;
        if (imgOkay) {
            if (this.type === 'boulder') { // Special drawing for boulder
                ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.rotate(this.rotation);
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            } else { // Default drawing
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        } else { // Fallback drawing
            switch (this.type) {
                case 'boulder': ctx.fillStyle = BROWN; break;
                case 'snake_pit': ctx.fillStyle = DARK_GREEN; break;
                default: ctx.fillStyle = 'red'; break;
            }
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getRect() {
        // Adjust padding based on type for potentially better collision feel
        const paddingX = (this.type === 'snake_pit' || this.type === 'boulder') ? 2 : 3;
        const paddingY = (this.type === 'snake_pit') ? 0 : 3; // Snake pit is flat, use full height
        return {
            x: this.x + paddingX,
            y: this.y + paddingY,
            width: this.width - 2 * paddingX,
            height: this.height - 2 * paddingY
        };
    }
}

// --- PowerUp Class ---
class PowerUp {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y;
        this.image = null; this.width = POWERUP_ICON_SIZE.width; this.height = POWERUP_ICON_SIZE.height;
        this.collected = false;
        switch(this.type) {
            case 'shield': this.image = assets.shieldIcon; break;
            case 'magnet': this.image = assets.magnetIcon; break;
        }
    }
    update(speed) { this.x -= speed; }
    draw(ctx) {
        if (this.collected) return;
        const imgOkay = this.image?.complete && this.image?.naturalWidth > 0;
        if (imgOkay) { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
        else { ctx.fillStyle = YELLOW; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
    getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
}

// --- Collectible Class ---
class Collectible {
     constructor(type, x, y) {
         this.type = type; this.x = x; this.y = y;
         this.image = null; this.width = 0; this.height = 0; this.value = 0;
         this.collected = false;
         switch(this.type) {
             case 'coin':
                 this.image = assets.coin; this.width = COIN_SIZE.width; this.height = COIN_SIZE.height; this.value = COIN_VALUE;
                 break;
         }
     }
     update(speed, player) {
         this.x -= speed; // Move left
         // Magnet effect
         if (player.magnetActive && !this.collected) {
             const pCenterX = player.x + player.currentWidth / 2;
             const pCenterY = player.y + player.currentHeight / 2;
             const cCenterX = this.x + this.width / 2;
             const cCenterY = this.y + this.height / 2;
             const dx = pCenterX - cCenterX;
             const dy = pCenterY - cCenterY;
             const distance = Math.sqrt(dx * dx + dy * dy);
             if (distance > 1 && distance < MAGNET_RADIUS) { // Avoid division by zero and check radius
                 const moveX = (dx / distance) * MAGNET_PULL_SPEED;
                 const moveY = (dy / distance) * MAGNET_PULL_SPEED;
                 this.x += moveX; this.y += moveY;
             }
         }
     }
     draw(ctx) {
         if (this.collected) return;
         const imgOkay = this.image?.complete && this.image?.naturalWidth > 0;
         if (imgOkay) { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
         else { ctx.fillStyle = YELLOW; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = BLACK; ctx.font = "10px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(this.value.toString(), this.x + this.width/2, this.y + this.height/2); }
     }
     getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
}


// --- Game State Variables ---
let player = null;
let obstacles = [];
let powerUps = [];
let collectibles = [];
let floatingTexts = [];
let obstacleSpawnTimer = 0;
let obstacleSpawnDelay = OBSTACLE_INITIAL_SPAWN_DELAY;
let obstacleSpeed = OBSTACLE_INITIAL_SPEED;
let score = 0;
let highScore = localStorage.getItem('dinoHighScoreEnhanced') ? parseInt(localStorage.getItem('dinoHighScoreEnhanced')) : 0;
let collectedCoins = 0; // Resets each game now
let isPaused = false;
let userInteracted = false;
let totalJumps = 0; // <<< RESET: Initialized to 0, not loaded from storage
let isShaking = false;
let shakeTimer = 0;
let shakeMagnitude = 0;
let isDarkMode = false;
let currentBgColor = WHITE;
let currentLineColor = BLACK;
let dayNightTransition = 0;
let snowflakes = [];

function setupSnowflakes(){
    snowflakes=[];
    for(let i=0; i<NUM_SNOWFLAKES; i++){
        snowflakes.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            dx: Math.random() * 0.6 - 0.3,
            dy: Math.random() * 1.0 + 0.8,
            size: Math.random() * 2 + 1
        });
    }
}

// --- General Functions ---
function drawText(text, x, y, font, color, align = 'left', baseline = 'top') {
    // Color argument is ignored now, always draws white
    ctx.font = font;
    ctx.fillStyle = WHITE; // Force white
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateThemeAndCycle(currentScore) {
    const scoreInCycle = currentScore % (DAY_NIGHT_CYCLE_SCORE * 2);
    const transitionDuration = DAY_NIGHT_CYCLE_SCORE * 0.2;
    let targetTransition = (scoreInCycle < DAY_NIGHT_CYCLE_SCORE) ? 0 : 1; // 0=Day, 1=Night
    const phaseProgress = scoreInCycle % DAY_NIGHT_CYCLE_SCORE;
    const transitionSpeed = (transitionDuration > 0) ? (1 / transitionDuration) : 1;

    if (targetTransition === 0) { // -> Day
        dayNightTransition = (phaseProgress < transitionDuration) ? Math.max(0, 1 - (phaseProgress * transitionSpeed)) : 0;
    } else { // -> Night
        dayNightTransition = (phaseProgress < transitionDuration) ? Math.min(1, phaseProgress * transitionSpeed) : 1;
    }

    isDarkMode = (dayNightTransition >= 0.5);

    const dayBg = [255, 255, 255], nightBg = [50, 50, 50];
    const dayLine = [0, 0, 0], nightLine = [200, 200, 200];

    const r_bg = Math.round(dayBg[0] + (nightBg[0] - dayBg[0]) * dayNightTransition);
    const g_bg = Math.round(dayBg[1] + (nightBg[1] - dayBg[1]) * dayNightTransition);
    const b_bg = Math.round(dayBg[2] + (nightBg[2] - dayBg[2]) * dayNightTransition);
    currentBgColor = `rgb(${r_bg}, ${g_bg}, ${b_bg})`;

    const r_line = Math.round(dayLine[0] + (nightLine[0] - dayLine[0]) * dayNightTransition);
    const g_line = Math.round(dayLine[1] + (nightLine[1] - dayLine[1]) * dayNightTransition);
    const b_line = Math.round(dayLine[2] + (nightLine[2] - dayLine[2]) * dayNightTransition);
    currentLineColor = `rgb(${r_line}, ${g_line}, ${b_line})`;

    currentBackground = (dayNightTransition < 0.5) ? assets.backgroundDay : assets.backgroundNight;

    if (isDarkMode && snowflakes.length === 0) setupSnowflakes();
    else if (!isDarkMode) snowflakes = [];
}

function updateAndDrawSnow() {
    if (!isDarkMode || snowflakes.length === 0) return;
    ctx.fillStyle = SNOW_COLOR;
    for (const f of snowflakes) {
        f.x += f.dx; f.y += f.dy;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2); ctx.fill();
        // Wrap snowflakes around screen edges
        if (f.y > HEIGHT + f.size) f.y = -f.size; else if (f.y < -f.size) f.y = HEIGHT + f.size;
        if (f.x > WIDTH + f.size) f.x = -f.size; else if (f.x < -f.size) f.x = WIDTH + f.size;
    }
}

// --- Spawning Functions ---
function trySpawnObstacle(scoreFloored) {
    let spawned = false;
    const rand = Math.random();
    // Prioritize complex/less frequent obstacles? Or keep simple weighting?
    if (scoreFloored >= KAMIKAZE_MIN_SCORE && rand < KAMIKAZE_CHANCE) {
        obstacles.push(new Obstacle('kamikaze_pterodactyl')); spawned = true;
    } else if (scoreFloored >= LEVITATING_CACTUS_MIN_SCORE && rand < LEVITATING_CACTUS_CHANCE) {
        obstacles.push(new Obstacle('levitating_cactus')); spawned = true;
    }
    // If no special obstacle, try weighted random for others
    if (!spawned) {
        const choices = [];
        if (scoreFloored >= 0) choices.push({ type: 'cactus', weight: 1.0 }); // Base weight
        if (scoreFloored >= SNAKE_PIT_MIN_SCORE) choices.push({ type: 'snake_pit', weight: SNAKE_PIT_CHANCE * 8 }); // Increase weight for variety
        if (scoreFloored >= BOULDER_MIN_SCORE) choices.push({ type: 'boulder', weight: BOULDER_CHANCE * 8 });
        if (scoreFloored >= PTERODACTYL_MIN_SCORE) choices.push({ type: 'pterodactyl', weight: PTERODACTYL_CHANCE * 8 });

        const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
        let randomWeight = Math.random() * totalWeight;

        for (const choice of choices) {
            if (randomWeight < choice.weight) {
                let typeToSpawn = choice.type;
                // Handle pterodactyl sub-type
                if (typeToSpawn === 'pterodactyl' && Math.random() < SWOOPING_PTERODACTYL_CHANCE) {
                    typeToSpawn = 'swooping_pterodactyl';
                }
                obstacles.push(new Obstacle(typeToSpawn));
                spawned = true;
                // console.log(`DEBUG: Spawned Obstacle: ${typeToSpawn}`); // Keep logs minimal now
                break;
            }
            randomWeight -= choice.weight;
        }
    }
    return spawned;
}

function trySpawnPowerUp(scoreFloored) {
    let spawned = false;
    if (scoreFloored >= POWERUP_MIN_SCORE && Math.random() < POWERUP_SPAWN_CHANCE) {
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        const y = GROUND_HEIGHT - POWERUP_ICON_SIZE.height - (Math.random() * 50 + 50);
        const x = WIDTH + POWERUP_ICON_SIZE.width;
        powerUps.push(new PowerUp(type, x, y));
        console.log(`DEBUG: Spawned PowerUp: ${type}`);
        spawned = true;
    }
    return spawned;
}

function trySpawnCollectible() {
    let didSpawn = false;
    const rc = Math.random();
    if (rc < COIN_SPAWN_CHANCE) {
        const y = GROUND_HEIGHT - COIN_SIZE.height - (Math.random() * 80 + 10); // Mid-air spawn
        const x = WIDTH + COIN_SIZE.width;
        collectibles.push(new Collectible('coin', x, y));
        // console.log(`DEBUG: Spawned Coin at x=${x.toFixed(0)} (Rolled ${rc.toFixed(3)} < ${COIN_SPAWN_CHANCE})`);
        didSpawn = true;
    }
    return didSpawn;
}

function tryTriggerRandomEvent(scoreFloored) {
    if (!isShaking && scoreFloored >= EARTHQUAKE_MIN_SCORE && Math.random() < EARTHQUAKE_CHANCE_PER_FRAME) {
        console.log("DEBUG: --- Earthquake ---");
        isShaking = true;
        shakeTimer = EARTHQUAKE_DURATION;
        shakeMagnitude = EARTHQUAKE_MAGNITUDE;
    }
}

// --- Input Handling ---
let keyState = {};
let touchDuckActive = false;
let touchStartTime = 0; // Keep for potential future use (tap vs hold duration)

window.addEventListener('keydown', (e) => {
    // Prevent default browser scrolling for relevant keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyC'].includes(e.code)) {
        e.preventDefault();
    }
    // Handle immediate actions only on first press (like jump, pause toggle, state change)
    if (!keyState[e.code]) {
        handleKeyPress(e.code);
    }
    // Track held keys for continuous actions (like ducking)
    keyState[e.code] = true;
    // Start ducking on keydown if appropriate
    if ((e.code === 'ArrowDown' || e.code === 'KeyS') && currentGameState === GAME_STATE.PLAYING && !isPaused && player?.onGround) {
        player.startDuck();
        touchDuckActive = false; // Ensure keyboard overrides touch duck state
    }
});

window.addEventListener('keyup', (e) => {
    keyState[e.code] = false;
    // Stop ducking on keyup if appropriate
    if (currentGameState === GAME_STATE.PLAYING && (e.code === 'ArrowDown' || e.code === 'KeyS') && !touchDuckActive) {
        if (player?.isDucking) {
            player.stopDuck();
        }
    }
});

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu

// Helper to check if point is in rect
function isPointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
}

function handleKeyPress(keyCode) {
    userInteracted = true; // Register interaction
    // console.log(`DEBUG >>> KeyPress: ${keyCode}, State: ${currentGameState}`); // Reduce log spam

    switch (currentGameState) {
        case GAME_STATE.TUTORIAL:
            if (keyCode === 'Space') { currentGameState = GAME_STATE.TITLE; }
            break;
        case GAME_STATE.TITLE:
            if (keyCode === 'Space') { startGame(); }
            break;
        case GAME_STATE.PLAYING:
            if (keyCode === 'Space') { if (!isPaused) player?.jump(); } // Jump
            else if (keyCode === 'KeyC' && !isPaused) { player?.switchSkin(); } // Skin switch
            // Pause is handled by button now
            break;
        // No keyboard actions needed for PAUSED or GAME_OVER states anymore
    }
}

function handlePointerDown(e){
    e.preventDefault(); userInteracted = true; touchStartTime = Date.now();
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width; const scaleY = canvas.height / r.height;
    const clickPos = { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
    // console.log(`DEBUG >>> PointerDown at (${clickPos.x.toFixed(0)}, ${clickPos.y.toFixed(0)}). State: ${currentGameState}`);

    switch (currentGameState) {
        case GAME_STATE.TUTORIAL:
            currentGameState = GAME_STATE.TITLE;
            break;
        case GAME_STATE.TITLE:
            startGame();
            break;
        case GAME_STATE.PLAYING:
             if (isPointInRect(clickPos, PAUSE_RESUME_BUTTON_RECT)) { // Check button first
                 console.log("DEBUG: Pause Button Clicked -> PAUSED");
                 isPaused = true; if (assets.backgroundMusic) assets.backgroundMusic.pause();
                 currentGameState = GAME_STATE.PAUSED;
             } else if (!isPaused) { // Game actions only if not paused and button not hit
                 if (clickPos.x >= WIDTH / 2) { player?.jump(); } // Jump (Right half)
                 else { if (player?.onGround) { player.startDuck(); touchDuckActive = true; } } // Duck (Left half)
             }
             break;
        case GAME_STATE.PAUSED:
             if (isPointInRect(clickPos, PAUSE_RESUME_BUTTON_RECT)) { // Check button to resume
                  console.log("DEBUG: Resume Button Clicked -> PLAYING");
                  isPaused = false; if (assets.backgroundMusic) assets.backgroundMusic.play().catch(e=>console.error(e));
                  currentGameState = GAME_STATE.PLAYING;
             }
             break;
        case GAME_STATE.GAME_OVER:
             if (isPointInRect(clickPos, RESTART_BUTTON_RECT)) { // Check restart button
                  console.log("DEBUG: Restart Button Clicked");
                  startGame();
             }
             break;
    }
}

function handlePointerUp(e){
    e.preventDefault();
    if (currentGameState === GAME_STATE.PLAYING && touchDuckActive) {
        player?.stopDuck();
        touchDuckActive = false;
    }
}

// --- Game Management Functions ---
function startGame() {
    console.log("DEBUG >>> startGame() called.");
    resetGame(); // Resets variables, creates player etc.
    currentGameState = GAME_STATE.PLAYING; // Set state to playing
    console.log("DEBUG >>> startGame() finished. State:", currentGameState);
}

function resetGame() {
    console.log("--- Resetting game variables ---");
    // Save high score if needed
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('dinoHighScoreEnhanced', highScore.toString());
    }
    // Don't save totalJumps here anymore if we reset it

    // Reset core game variables
    score = 0;
    obstacles = [];
    powerUps = [];
    collectibles = [];
    floatingTexts = [];
    collectedCoins = 0; // Reset coin counter
    totalJumps = 0; // <<< RESET JUMPS TO 0 FOR NEW GAME
    obstacleSpeed = OBSTACLE_INITIAL_SPEED;
    obstacleSpawnDelay = OBSTACLE_INITIAL_SPAWN_DELAY;
    obstacleSpawnTimer = 0;

    // Create new player instance
    player = new Player();
    console.log("DEBUG: New player created.");
    // Check if player images are valid after creation
    if (!player.currentImage) {
        console.error("!!! CRITICAL resetGame ERROR: player.currentImage NULL!");
        // Attempt recovery? Maybe not needed if assets loaded okay initially
    }

    // Reset visual/state flags
    dayNightTransition = 0; isDarkMode = false; currentBgColor = WHITE; currentLineColor = BLACK; currentBackground = assets.backgroundDay; snowflakes = [];
    isPaused = false; isShaking = false; shakeTimer = 0;

    // Start/Restart music if needed
    if (userInteracted && assets.backgroundMusic && assets.backgroundMusic.readyState >= 4) {
        try {
            assets.backgroundMusic.currentTime = 0;
            assets.backgroundMusic.loop = true;
            assets.backgroundMusic.volume = 0.5;
            assets.backgroundMusic.play().catch(e => console.error("Audio play fail on reset:", e));
        } catch (e) {
            console.error("Audio play EXCEPTION:", e);
        }
    }
    console.log("--- Game variables reset ---");
}

// --- Drawing Functions ---
function drawTutorialScreen(){ const bg=assets.backgroundDay?.complete?assets.backgroundDay:null; if(bg)ctx.drawImage(bg,0,0,WIDTH,HEIGHT); else{ctx.fillStyle=WHITE;ctx.fillRect(0,0,WIDTH,HEIGHT);} ctx.fillStyle="rgba(0,0,0,0.7)"; ctx.fillRect(0,0,WIDTH,HEIGHT); drawText("How to Play",WIDTH/2,50,"bold 48px Arial",WHITE,'center'); const c1X=WIDTH*0.15; const c2X=WIDTH*0.55; const sy=120; const lh=30; const hf="bold 24px Arial"; const df="20px Arial"; let y=sy; drawText("Keyboard (Laptop)",c1X,y,hf,YELLOW,'left'); y=sy+lh*1.5; drawText("Jump / Double Jump:",c1X,y,df,WHITE,'left'); y+=lh; drawText("   - SPACEBAR",c1X,y,df,WHITE,'left'); y+=lh*1.5; drawText("Duck / Slide (Hold):",c1X,y,df,WHITE,'left'); y+=lh; drawText("   - DOWN ARROW or S",c1X,y,df,WHITE,'left'); y+=lh*1.5; drawText("Switch Skin:",c1X,y,df,WHITE,'left'); y+=lh; drawText("   - C key",c1X,y,df,WHITE,'left'); y=sy; drawText("Touch (Phone/Tablet)",c2X,y,hf,YELLOW,'left'); y=sy+lh*1.5; drawText("Jump / Double Jump:",c2X,y,df,WHITE,'left'); y+=lh; drawText("   - TAP Right Half of Screen",c2X,y,df,WHITE,'left'); y+=lh*1.5; drawText("Duck / Slide (Hold):",c2X,y,df,WHITE,'left'); y+=lh; drawText("   - TAP and HOLD Left Half",c2X,y,df,WHITE,'left'); drawText("Pause/Resume: Button (Top Left)", WIDTH/2, HEIGHT - 90, df, WHITE, 'center'); drawText("Press SPACEBAR or TAP Screen to Continue",WIDTH/2,HEIGHT-40,"24px Arial",YELLOW,'center'); }
function drawTitleScreen(){ const bg=currentBackground?.complete?currentBackground:null; if(bg)ctx.drawImage(bg,0,0,WIDTH,HEIGHT); else{ctx.fillStyle=currentBgColor;ctx.fillRect(0,0,WIDTH,HEIGHT);} ctx.strokeStyle=currentLineColor; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,GROUND_HEIGHT); ctx.lineTo(WIDTH,GROUND_HEIGHT); ctx.stroke(); if(isDarkMode)updateAndDrawSnow(); ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(0,0,WIDTH,HEIGHT); drawText("HTML5 Dino Run Enhanced",WIDTH/2,HEIGHT/2-70,"bold 40px Arial",WHITE,'center','middle'); drawText("Press SPACE or TAP to Start",WIDTH/2,HEIGHT/2,"24px Arial",WHITE,'center','middle'); drawText("Controls Refresher:",WIDTH/2,HEIGHT/2+40,"20px Arial",WHITE,'center','middle'); drawText("Jump: Space/RightTap | Duck: Down/S/LeftTap(Hold)",WIDTH/2,HEIGHT/2+70,"16px Arial",WHITE,'center','middle'); drawText("Skin: C | Pause: Button",WIDTH/2,HEIGHT/2+95,"16px Arial",WHITE,'center','middle'); }
function drawPauseResumeButton() { ctx.fillStyle=BUTTON_BG_COLOR; ctx.fillRect(PAUSE_RESUME_BUTTON_RECT.x,PAUSE_RESUME_BUTTON_RECT.y,PAUSE_RESUME_BUTTON_RECT.width,PAUSE_RESUME_BUTTON_RECT.height); ctx.fillStyle=BUTTON_TEXT_COLOR; ctx.font="bold 20px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle"; const txt=currentGameState===GAME_STATE.PAUSED?"▶":"❚❚"; ctx.fillText(txt,PAUSE_RESUME_BUTTON_RECT.x+PAUSE_RESUME_BUTTON_RECT.width/2,PAUSE_RESUME_BUTTON_RECT.y+PAUSE_RESUME_BUTTON_RECT.height/2+2); }
function drawPlayingScreen(shakeX,shakeY){ updateAndDrawSnow(); obstacles.forEach(o=>o.draw(ctx)); powerUps.forEach(p=>p.draw(ctx)); collectibles.forEach(c=>c.draw(ctx)); if(player)player.draw(ctx); floatingTexts.forEach(f=>f.draw(ctx)); drawText(`Score:${Math.floor(score)}`,WIDTH-10,10,"24px Arial",WHITE,'right'); drawText(`HI:${highScore}`,WIDTH-10,35,"24px Arial",WHITE,'right'); drawText(`Coins:${collectedCoins}`,WIDTH-10,60,"24px Arial",WHITE,'right'); let uY=10; if(player?.shieldActive){const tl=Math.max(0,player.shieldTimeout-Date.now());drawText(`Shield:${(tl/1000).toFixed(1)}s`,10,uY,"20px Arial",WHITE,'left');uY+=25;} if(player?.magnetActive){const tl=Math.max(0,player.magnetTimeout-Date.now());drawText(`Magnet:${(tl/1000).toFixed(1)}s`,10,uY,"20px Arial",WHITE,'left');uY+=25;} drawText(`Jumps:${totalJumps}`,WIDTH-10,HEIGHT-25,"18px Arial",WHITE,'right','bottom'); drawPauseResumeButton(); } // Jumps bottom-right
function drawPauseScreenOverlay(shakeX,shakeY){ ctx.fillStyle="rgba(0,0,0,0.7)"; ctx.fillRect(-shakeX,-shakeY,WIDTH,HEIGHT); drawText("PAUSED",WIDTH/2,HEIGHT/2-30,"bold 72px Arial",WHITE,'center','middle'); drawPauseResumeButton(); }
function drawRestartButton() { ctx.fillStyle=BUTTON_BG_COLOR; ctx.fillRect(RESTART_BUTTON_RECT.x,RESTART_BUTTON_RECT.y,RESTART_BUTTON_RECT.width,RESTART_BUTTON_RECT.height); ctx.fillStyle=BUTTON_TEXT_COLOR; ctx.font="bold 22px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("Restart",RESTART_BUTTON_RECT.x+RESTART_BUTTON_RECT.width/2,RESTART_BUTTON_RECT.y+RESTART_BUTTON_RECT.height/2); }
function drawGameOverScreen(shakeX,shakeY){ obstacles.forEach(o=>o.draw(ctx)); powerUps.forEach(p=>p.draw(ctx)); collectibles.forEach(c=>c.draw(ctx)); if(player)player.draw(ctx); floatingTexts.forEach(f=>f.draw(ctx)); ctx.fillStyle="rgba(0,0,0,0.7)"; ctx.fillRect(-shakeX,-shakeY,WIDTH,HEIGHT); const fs=Math.floor(score); const dh=Math.max(fs,highScore); drawText("GAME OVER",WIDTH/2,HEIGHT/2-60,"bold 48px Arial",WHITE,'center','middle'); drawText(`Your Score:${fs}`,WIDTH/2,HEIGHT/2,"24px Arial",WHITE,'center','middle'); drawText(`High Score:${dh}`,WIDTH/2,HEIGHT/2+35,"24px Arial",WHITE,'center','middle'); drawText(`Total Jumps: ${totalJumps}`,WIDTH/2,HEIGHT-30,"16px Arial",WHITE,'center','bottom'); drawRestartButton(); } // Simplified jump display


// --- Game Loop ---
let lastTime = 0; let accumulatedTime = 0;

function gameLoop(timestamp) {
    // Safety check for player object
    if (!player && (currentGameState === GAME_STATE.PLAYING || currentGameState === GAME_STATE.PAUSED)) {
        console.error("State requires player, resetting state."); currentGameState = GAME_STATE.TITLE;
    }

    // Calculate deltaTime
    const deltaTime = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.1); lastTime = timestamp; accumulatedTime += deltaTime;

    // --- Update Game State ---
    let shakeX = 0, shakeY = 0;
    if (currentGameState === GAME_STATE.PLAYING && player && !isPaused) {
        // --- Updates ---
        const scoreFloored = Math.floor(score); const scoreIncrement = obstacleSpeed*deltaTime*2;
        const scoreLevel = Math.floor(scoreFloored/OBSTACLE_SPEED_INCREASE_INTERVAL); const newSpeed = OBSTACLE_INITIAL_SPEED+scoreLevel*OBSTACLE_SPEED_INCREASE_AMOUNT; if(newSpeed>obstacleSpeed)obstacleSpeed=newSpeed;
        updateThemeAndCycle(scoreFloored); player.update(deltaTime);

        // Spawning
        obstacleSpawnTimer++; if(obstacleSpawnTimer>=obstacleSpawnDelay){ let can=true; const last=obstacles.length>0?obstacles[obstacles.length-1]:(powerUps.length>0?powerUps[powerUps.length-1]:(collectibles.length>0?collectibles[collectibles.length-1]:null)); if(last){const md=100+obstacleSpeed*6; if(WIDTH-(last.x+last.width)<md){can=false;}} if(can){let sO=trySpawnObstacle(scoreFloored);let sP=trySpawnPowerUp(scoreFloored);let sC=trySpawnCollectible(); if(sO||sP||sC){obstacleSpawnTimer=0;obstacleSpawnDelay=Math.max(OBSTACLE_MIN_SPAWN_DELAY,OBSTACLE_INITIAL_SPAWN_DELAY-Math.floor(scoreFloored/150));}else{obstacleSpawnTimer=Math.floor(obstacleSpawnDelay*0.5);}}else{obstacleSpawnTimer=Math.floor(obstacleSpawnDelay*0.8);}}

        // Updates & Collisions
        const pRect=player.getRect(); let colDetected=false;
        for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.update(obstacleSpeed);if(!colDetected&&checkCollision(pRect,o.getRect())){if(player.shieldActive){player.shieldActive=false;obstacles.splice(i,1);}else{currentGameState=GAME_STATE.GAME_OVER;if(assets.backgroundMusic?.pause)assets.backgroundMusic.pause();colDetected=true;}}if(o.x+o.width<player.x&&!o.passed){score+=10;o.passed=true;}else if(o.x+o.width<0){obstacles.splice(i,1);}}
        if(!colDetected){for(let i=powerUps.length-1;i>=0;i--){const p=powerUps[i];p.update(obstacleSpeed);if(!p.collected&&checkCollision(pRect,p.getRect())){switch(p.type){case'shield':player.activateShield(SHIELD_DURATION);break;case'magnet':player.activateMagnet(MAGNET_DURATION);break;}p.collected=true;}if(p.collected||p.x+p.width<0){powerUps.splice(i,1);}}}
        if(!colDetected){for(let i=collectibles.length-1;i>=0;i--){const c=collectibles[i];c.update(obstacleSpeed,player);if(!c.collected&&checkCollision(pRect,c.getRect())){collectedCoins++;c.collected=true;floatingTexts.push(new FloatingText(`+${COIN_VALUE}`,c.x+c.width/2,c.y));if(assets.coinSound?.readyState>=2){assets.coinSound.currentTime=0;assets.coinSound.play().catch(e=>console.error("Coin sound fail:",e));}}if(c.collected||c.x+c.width<0){collectibles.splice(i,1);}}}

        // Update Floating Texts
        for(let i=floatingTexts.length-1;i>=0;i--){if(!floatingTexts[i].update(deltaTime))floatingTexts.splice(i,1);}

        // Random Events
        tryTriggerRandomEvent(scoreFloored);
        if(isShaking){shakeTimer-=deltaTime*1000;if(shakeTimer<=0){isShaking=false;}else{const inten=shakeMagnitude*(shakeTimer/EARTHQUAKE_DURATION);shakeX=(Math.random()-0.5)*inten;shakeY=(Math.random()-0.5)*inten;}}
        score+=scoreIncrement;

    } else if (currentGameState !== GAME_STATE.LOADING) { // Update snow etc. in non-playing states except loading
         updateAndDrawSnow();
    }

    // --- Drawing ---
    ctx.save();
    if (isShaking && (currentGameState === GAME_STATE.PLAYING || currentGameState === GAME_STATE.PAUSED)) ctx.translate(shakeX, shakeY);

    // Draw background/ground
    ctx.fillStyle=currentBgColor; ctx.fillRect(-shakeX,-shakeY,WIDTH,HEIGHT);
    const bg=currentBackground; if(bg?.complete&&bg?.naturalWidth>0)ctx.drawImage(bg,0,0,WIDTH,HEIGHT);
    ctx.strokeStyle=currentLineColor; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,GROUND_HEIGHT); ctx.lineTo(WIDTH,GROUND_HEIGHT); ctx.stroke();

    // Draw based on state
    switch (currentGameState) {
        case GAME_STATE.LOADING: drawText("Loading Assets...", WIDTH/2, HEIGHT/2, "30px Arial", WHITE, 'center'); break;
        case GAME_STATE.TUTORIAL: drawTutorialScreen(); break;
        case GAME_STATE.TITLE: drawTitleScreen(); break;
        case GAME_STATE.PLAYING: case GAME_STATE.PAUSED: drawPlayingScreen(shakeX, shakeY); if(currentGameState===GAME_STATE.PAUSED)drawPauseScreenOverlay(shakeX,shakeY); break;
        case GAME_STATE.GAME_OVER: drawGameOverScreen(shakeX, shakeY); break;
    }
    ctx.restore(); // Restore from potential shake

    requestAnimationFrame(gameLoop); // Loop
}


// --- Initialize ---
function initializeGame() {
    console.log("Initializing game...");
    currentGameState = GAME_STATE.TUTORIAL; // Start at Tutorial
    console.log("Initial Game State ->", currentGameState);
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    return true;
}

// --- Start the game AFTER assets are loaded ---
onAssetsLoaded = () => {
    console.log("Asset loading callback.");
    if (assetsLoadError) { console.error("!!! Cannot start: Asset loading errors!"); ctx.fillStyle='red'; ctx.fillRect(0,0,WIDTH,HEIGHT); drawText("Error Loading Assets!", WIDTH/2, HEIGHT/2, "30px Arial", WHITE, "center"); return; }
    if (!initializeGame()) { console.error("!!! Game Init Failed!"); ctx.fillStyle='red'; ctx.fillRect(0,0,WIDTH,HEIGHT); drawText("Game Init Failed!", WIDTH/2, HEIGHT/2, "30px Arial", WHITE, "center"); return; }
    console.log("Game Initialized & Loop Started.");
};

// Fallback Safety net
setTimeout(() => { if(assetsLoaded<totalAssets&&typeof onAssetsLoaded==='function'&&currentGameState===GAME_STATE.LOADING){console.warn("Asset loading timeout.");if(!assets.dinoNormal||!assets.dinoDuck)assetsLoadError=true;onAssetsLoaded();}else if(currentGameState===GAME_STATE.LOADING&&typeof onAssetsLoaded!=='function'){console.error("FATAL: Asset loading timeout & onAssetsLoaded missing.");}}, 15000);

console.log("Game script initialized. Waiting for assets...");
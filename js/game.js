const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: 1200,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 710 },
      debug: true,
    },
  },
  scene: { preload, create, update },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// Global Variables
let isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
let player, cursors, questionCards, skillCards, instructions;
let revealedCards = 0;
let totalCards = 5;
let cardYOffset = isMobile ? 300 : 350;
let groundYOffset = 450;
let worldWidth;
let lastDirection = "right";
let playerState = "idle";
let justJumped = false;
let spaceKey;
let cloudGroup;


let cardTexts = [
  " Web Developer",
  " Python Enthusiast",
  " Machine Learning",
  " Game Developer",
  " Problem Solver",
];

let dialogueIndex = 0;
let dialogueText, nameText, portrait, dialogueBg, pressSpaceText;
let isTyping = false;
let fullText = '';
let currentChar = 0;
let dialogueActive = true;


let leftPressed = false, rightPressed = false, jumpPressed = false;

const dialogueLines = [
  "Hey there! I’m Rotimi Awomolo — a Computer Science graduate with a passion for turning ideas into code.",
  "I'm a Python enthusiast who loves clean logic, automation, and building smart tools..",
  "I dive into machine learning to build models that actually make sense from data-driven predictions to intelligent systems that learn over time.",
  "As a web developer, I create fast, responsive, and user-friendly experiences that work beautifully across devices.",
  "Most of all, I’m a problem solver. Whether it’s debugging tricky code or designing clever gameplay mechanics — I love the challenge.",
  "This portfolio isn’t just a website... it’s a journey through what I can do. So grab your arrows and let’s explore!",
];

function preload() {
  for (let i = 1; i <= 8; i++) this.load.image(`walk${i}`, `assets/walk${i}.png`);
  this.load.image("cloud1", "assets/cloud1.png");
  this.load.image("cloud2", "assets/cloud2.png");
  this.load.image("idle1", "assets/idle1.png");
  this.load.image("idle2", "assets/idle2.png");
  this.load.image("jump1", "assets/jump1.png");
  this.load.image("jump2", "assets/jump2.png");
  this.load.image("jump3", "assets/jump3.png");
  this.load.image("background", "assets/frontground.png");
  this.load.image("question-card", "assets/question-card.png");
  this.load.image("card", "assets/card.png");
  this.load.image("ground", "assets/ground.png");
  this.load.image("rotimiPortrait", "assets/rotimi.png");

  this.load.image("drag1", "assets/drag1.png");
  this.load.image("drag2", "assets/drag2.png");
  this.load.image("drag3", "assets/drag3.png");

  for (let i = 1; i <= 5; i++) this.load.image(`hover-${i}`, `assets/card-hover-${i}.png`);

  this.load.audio("jump", "assets/jump.wav");
  this.load.audio("reveal", "assets/reveal.wav");
  this.load.script("webfont", "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js");
}

function create() {
  this.physics.world.setBounds(0, 0, worldWidth, this.scale.height);

// Background
const bg = this.add.image(0, 0, "background").setOrigin(0, 0);
const scale = this.scale.height / bg.height;
bg.setScale(scale);
worldWidth = bg.width * scale;

// Set physics and camera bounds
this.physics.world.setBounds(0, 0, worldWidth, this.scale.height);
this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);

// Ground (aligned with background)
const platforms = this.physics.add.staticGroup();
const groundY = bg.y + (bg.height * bg.scaleY) - 20;
platforms.create(worldWidth / 2, groundY, "ground")
  .setDisplaySize(worldWidth, 125)
  .setVisible(false)
  .refreshBody();

  // Player
  player = this.physics.add.sprite(100, 100, "jump1")
    .setBounce(0)
    .setCollideWorldBounds(true)
    .setScale(2);

  this.anims.create({
    key: "walk",
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `walk${i + 1}` })),
    frameRate: 16,
    repeat: -1,
  });
  this.anims.create({ key: "idle", frames: [{ key: "idle1" }, { key: "idle2" }], frameRate: 2, repeat: -1 });
  this.anims.create({ key: "jump", frames: [{ key: "jump1" }, { key: "jump2" }, { key: "jump3" }], frameRate: 8 });

  this.anims.create({
    key: "fly",
    frames: [
      { key: "drag1" },
      { key: "drag2" },
      { key: "drag3" },
    ],
    frameRate: 6,
    repeat: -1,
  });

  const dragon = this.add.sprite(worldWidth - 200, 200, "drag1").setScale(0.5);
  dragon.play("fly");

  this.tweens.add({
    targets: dragon,
    x: -200,
    duration: 15000,
    repeat: -1,
    yoyo: false,
  });

  cursors = this.input.keyboard.createCursorKeys();
  this.physics.add.collider(player, platforms);

  questionCards = this.physics.add.staticGroup();
  skillCards = this.add.group();

  // Cards
  for (let i = 0; i < cardTexts.length; i++) {
    let x = 600 + i * 800;
    let y = this.scale.height - cardYOffset;

    let skillCard = this.add.image(x, y, "card").setScale(0.8).setVisible(false).setDepth(1);
    let text = this.add.text(x, y, cardTexts[i], {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5).setVisible(false).setDepth(2);

    let questionCard = questionCards.create(x, y, "question-card").setScale(0.24).refreshBody();
    questionCard.skillCard = skillCard;
    questionCard.skillText = text;

    let hoverImage = this.add.image(x, y - 80, `hover-${i + 1}`).setScale(0.56).setAlpha(0).setDepth(3);
    skillCard.hoverImage = hoverImage;
  }
// Clouds
cloudGroup = this.add.group();

const cloudTypes = ["cloud1", "cloud2"];

for (let i = 0; i < 10; i++) {
  const x = Phaser.Math.Between(0, worldWidth);
  const y = Phaser.Math.Between(50, 400);
  const type = Phaser.Math.RND.pick(cloudTypes); // Randomly pick a cloud type

  const cloud = this.add.image(x, y, type)
    .setScale(0.35)
    .setAlpha(0.8)
    .setDepth(0);

  cloud.speed = Phaser.Math.FloatBetween(0.09, 0.1);
  cloudGroup.add(cloud);
}


  this.physics.add.collider(player, questionCards, hitQuestionCard, null, this);

  // Instructions (Desktop only)
  if (!isMobile) {
    instructions = this.add.text(this.scale.width / 2, 50, "Use arrow keys to move and jump", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0);
  }

  this.cameras.main.startFollow(player);
  this.cameras.main.setLerp(0.1, 0.1);
  this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);

  WebFont.load({
    google: { families: ["Press Start 2P"] },
    active: () => { showDialogue.call(this); }
  });

  if (isMobile) createMobileControls.call(this);
}

function update() {
  if (dialogueActive) return;

  const grounded = player.body.blocked.down;

  if ((cursors.up.isDown || jumpPressed) && grounded && !justJumped) {
    justJumped = true;
    player.setTexture("jump1");
    player.anims.play("jump", true);
    playerState = "jump";
    player.setVelocityY(-400);
    this.sound.play("jump");
  }

  if (!cursors.up.isDown && !jumpPressed) justJumped = false;

  if (cursors.left.isDown || leftPressed) {
    player.setVelocityX(-160);
    if (playerState !== "jump") {
      playerState = "walk";
      player.anims.play("walk", true);
    }
    player.setFlipX(true);
    lastDirection = "left";
  } else if (cursors.right.isDown || rightPressed) {
    player.setVelocityX(160);
    if (playerState !== "jump") {
      playerState = "walk";
      player.anims.play("walk", true);
    }
    player.setFlipX(false);
    lastDirection = "right";
  } else {
    player.setVelocityX(0);
    if (playerState !== "jump") {
      playerState = "idle";
      player.anims.play("idle", true);
      player.setFlipX(lastDirection === "left");
    }
  }

  if (playerState === "jump" && grounded && !player.anims.isPlaying) {
    playerState = "idle";
    player.anims.play("idle", true);
    player.setFlipX(lastDirection === "left");
  }
  cloudGroup.getChildren().forEach(cloud => {
  cloud.x += cloud.speed;
  if (cloud.x > worldWidth + 100) {
    cloud.x = -100;
    cloud.y = Phaser.Math.Between(50, 400);
  }
});

}

function hitQuestionCard(player, questionCard) {
  if (player.body.blocked.up) {
    const card = questionCard.skillCard;
    const text = questionCard.skillText;
    const hoverImage = card.hoverImage;

    card.setVisible(true);
    text.setVisible(true);
    questionCard.disableBody(true, true);
    this.sound.play("reveal");


    this.tweens.add({ targets: [card, text], y: "-=10", duration: 100, ease: "Power1", yoyo: true });

    card.setInteractive({ useHandCursor: true });
    card.on("pointerover", () => this.tweens.add({ targets: hoverImage, alpha: 1, duration: 200 }));
    card.on("pointerout", () => this.tweens.add({ targets: hoverImage, alpha: 0, duration: 200 }));

    revealedCards++;
    if (revealedCards >= totalCards) showContactButton();
  }
}

function showContactButton() {
  const contactButton = document.getElementById('contact-button');
  if (contactButton) {
    contactButton.style.display = 'block';
  }
}

function showDialogue() {
  const boxY = this.scale.height - 260;
  const boxHeight = 200;
  const boxX = 20;
  const boxWidth = this.scale.width - 40;

  dialogueBg = this.add.graphics().setScrollFactor(0).setDepth(10);
  dialogueBg.fillStyle(0x000000, 1);
  dialogueBg.fillRect(boxX, boxY, boxWidth, boxHeight);
  dialogueBg.lineStyle(4, 0xffffff);
  dialogueBg.strokeRect(boxX, boxY, boxWidth, boxHeight);

  portrait = this.add.image(100, boxY + 20, "rotimiPortrait").setOrigin(0, 0).setScale(2).setScrollFactor(0).setDepth(11);
  nameText = this.add.text(240, boxY + 10, "Rotimi Awomolo", {
    fontFamily: "Press Start 2P",
    fontSize: "25px",
    color: "#ffffff",
  }).setScrollFactor(0).setDepth(11);

  dialogueText = this.add.text(240, boxY + 60, "", {
    fontFamily: "Press Start 2P",
    fontSize: "25px",
    color: "#ffffff",
    wordWrap: { width: this.scale.width - 300 },
  }).setScrollFactor(0).setDepth(11);

  pressSpaceText = this.add.text(this.scale.width - 260, boxY + boxHeight - 40, ">> PRESS SPACE", {
    fontFamily: "Press Start 2P",
    fontSize: "20px",
    color: "#ffffff",
  }).setScrollFactor(0).setDepth(11).setAlpha(0);

  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  this.input.keyboard.on("keydown-SPACE", () => {
    if (!dialogueActive) return;
    if (isTyping) {
      isTyping = false;
      dialogueText.setText(fullText);
      pressSpaceText.setAlpha(1);
    } else {
      showNextLine.call(this);
    }
  });

  if (isMobile) {
    this.input.on("pointerdown", () => {
      if (!dialogueActive) return;
      if (isTyping) {
        isTyping = false;
        dialogueText.setText(fullText);
        pressSpaceText.setAlpha(1);
      } else {
        showNextLine.call(this);
      }
    });
  }

  showNextLine.call(this);
}

function showNextLine() {
  if (dialogueIndex >= dialogueLines.length) return endDialogue.call(this);
  fullText = dialogueLines[dialogueIndex];
  dialogueText.setText("");
  currentChar = 0;
  isTyping = true;
  dialogueIndex++;
  pressSpaceText.setAlpha(0);
  typeLine.call(this);
}

function typeLine() {
  if (!isTyping) return;
  dialogueText.setText(fullText.substr(0, currentChar + 1));
  currentChar++;
  if (currentChar < fullText.length) {
    setTimeout(() => typeLine.call(this), 20);
  } else {
    isTyping = false;
    pressSpaceText.setAlpha(1);
    this.tweens.add({ targets: pressSpaceText, alpha: { from: 1, to: 0 }, duration: 500, repeat: -1, yoyo: true });
  }
}

function endDialogue() {
  dialogueBg.destroy();
  portrait.destroy();
  dialogueText.destroy();
  nameText.destroy();
  pressSpaceText.destroy();
  dialogueActive = false;
}

function createMobileControls() {
  const buttonSize = 100 * 0.3;
  const padding = 20;
  const y = this.scale.height - buttonSize - padding;

  // Left Button
  const leftBtn = this.add.rectangle(padding, y, buttonSize, buttonSize, 0x6666ff)
    .setOrigin(0).setScrollFactor(0).setInteractive().setDepth(20);
  this.add.text(padding + buttonSize * 0.25, y + buttonSize * 0.25, "<", {
    fontSize: `${buttonSize * 0.5}px`,
    color: "#fff",
  }).setScrollFactor(0).setDepth(21);
  leftBtn.on("pointerdown", () => leftPressed = true);
  leftBtn.on("pointerup", () => leftPressed = false);
  leftBtn.on("pointerout", () => leftPressed = false);

  // Right Button
  const rightBtn = this.add.rectangle(padding + buttonSize + 20, y, buttonSize, buttonSize, 0x6666ff)
    .setOrigin(0).setScrollFactor(0).setInteractive().setDepth(20);
  this.add.text(padding + buttonSize + 20 + buttonSize * 0.25, y + buttonSize * 0.25, ">", {
    fontSize: `${buttonSize * 0.5}px`,
    color: "#fff",
  }).setScrollFactor(0).setDepth(21);
  rightBtn.on("pointerdown", () => rightPressed = true);
  rightBtn.on("pointerup", () => rightPressed = false);
  rightBtn.on("pointerout", () => rightPressed = false);

  // Jump Button
  const jumpBtn = this.add.rectangle(this.scale.width - buttonSize - padding, y, buttonSize, buttonSize, 0xff6666)
    .setOrigin(0).setScrollFactor(0).setInteractive().setDepth(20);
  this.add.text(this.scale.width - buttonSize - padding + buttonSize * 0.25, y + buttonSize * 0.25, "↑", {
    fontSize: `${buttonSize * 0.5}px`,
    color: "#fff",
  }).setScrollFactor(0).setDepth(21);
  jumpBtn.on("pointerdown", () => jumpPressed = true);
  jumpBtn.on("pointerup", () => jumpPressed = false);
  jumpBtn.on("pointerout", () => jumpPressed = false);
}

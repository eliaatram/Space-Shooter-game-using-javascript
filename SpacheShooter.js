/**
 * Space Shooter Game
 * 
 * The following is a space shooter game holding 1 user ship and many moving enemy ships
 * where the user completes one stage and moves to an even harder stage of the game
 */

//creating the canvas
var canvas = document.createElement("canvas"); // getting the canvas
var ctx = canvas.getContext("2d"); // getting the context
canvas.width = 800; // setting the width
canvas.height = 600; // setting the height
document.body.appendChild(canvas); // adding the canvas to the document

//creating background
var background = new Image(); // creating the background image object
var backready = false; // initial background state is false

// loading the background image
background.onload = function () {
  backready = true;
};
background.src = "space.png"; // setting the background image

// changing the background based on the users choice
// this imgae object will be constintly changing when the user presses different options of the game like play or end
var mainMenu = new Image();
mainMenu.src = "main.png";

// array of sprites containing objects of classes and array delete is to delete unecessary objects
var sprites = [];
var deletearray = [];

var score = 0; // initial score of the game
var userShoot = false; // user shooting state
var enemyShoot = false; // enemy shooting state
var enemyReady = false; // initial state for enemy object is false
var bossReady = false; // initial state for the boss object is false
var choice = false; // user choice
var monsterShooting = 0;
var level = 1; // levels of the game
var endGame = false; // end game is set to false by default

// taking input from the user
var keysdown = [];

// the menu function that will handle the change of the background
function menu() {
  ctx.drawImage(mainMenu, 0, 0, 800, 600);
}

// assigning options of the user
function options(event) {
  var x = event.clientX;
  var y = event.clientY;

  // starting the game
  if (x >= 261 && x < 584 && y >= 185 && y < 217) {
    choice = true;
    theme.play();
  }

  // displaying a message for the end of the game
  else if (x >= 255 && x < 565 && y >= 390 && y < 424) {
    ctx.fillStyle = "rgb(129, 53, 53)";
    ctx.font = "90px Helvetica";
    ctx.textAlign = "center";
    ctx.textBaseline = "center";
    ctx.fillText("Thanks for Playing", 400, 150);
    endGame = true;
    return false;
  }
}

// add an eventListener to browser window
addEventListener("keydown", (e) => {
  keysdown[e.keyCode] = true;
}, false);

// add an eventListener to browser window
addEventListener("keyup", (e) => {
  delete keysdown[e.keyCode];
}, false);

// creating the sound function
function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function () {
    this.sound.play();
  };
  this.stop = function () {
    this.sound.pause();
  };
}

// sound effects used in the game
var theme = new sound("SkyFire.ogg"); // game theme music
var lost = new sound("sfx_lose.ogg"); // sound effect used when the player looses the stage
var victory = new sound("victory.mp3"); // sound effect used when the player wins the stage
var collisionSound = new sound("sfx_laser2.ogg"); // user damaged sound
var explode = new sound("explodemini.wav"); // enemy explosion sound

// global collision criteria
function collision(firstObjectX, firstObjectY, firstObjectHeight, firstObjectWidth,
  secondObjectX, secondObjectY, secondObjectHeight, seconObjectWidth) {
  if (firstObjectX < secondObjectX + seconObjectWidth
    && firstObjectX + firstObjectWidth > secondObjectX
    && firstObjectY < secondObjectY + secondObjectHeight
    && firstObjectY + firstObjectHeight > secondObjectY) {
    return true;
  }
}

// creating the class of the bullet
class Bullet {
  /**
   * 
   * @param {*} x x position of the bullet object
   * @param {*} y y position of the bullet object
   * @param {*} name name of the bullet either from the user or from the enemmy
   */
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.userBulletImage = new Image(); // creating user bullet image
    this.enemyBulletImage = new Image(); // creating enemy bullet image
  }

  // drawing the bullet
  draw(ctx) {

    // drawing user bullet
    if (this.name === "user") {
      this.userBulletImage.src = "userbullet.png";
      ctx.drawImage(this.userBulletImage, this.x, this.y, 5, 25);
    }

    // drawing enemy bullet
    if (this.name === "enemy") {
      this.enemyBulletImage.src = "enemybullet.png";
      ctx.drawImage(this.enemyBulletImage, this.x, this.y, 10, 10);
    }
  }

  // updating the bullet
  update() {

    // moving user bullet
    if (this.name === "user") {
      if (level === 2) {
        this.y -= 6;
      } else {
        this.y -= 3;
      }
    }

    // moving enemy bullet
    if (this.name === "enemy") {
      if (level === 2) {
        this.y += 2;
      } else {
        this.y += 1;
      }
    }

    // deleting user bullet when it reaches the top of the canvas 
    if (this.y < 0) {
      deletearray.push(this);
    }
    // deleting the enemy bullet when it reaches the bottom of the canvas
    if (this.y > 800) {
      deletearray.push(this);
    }
  }
}

// Creating the enemy ship class
class EnemyShip {
  /**
   * 
   * @param {*} x x position of the enemy ship object
   * @param {*} y y position of the enemy ship object
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.leftMovement = 0; // left movement of the enemy ship
    this.rigthMovement = -1; // right movement of the enemy ship
    this.collide = false; // collision state of the enemy ship
    this.enemyImage = new Image(); // creating enemy image object
    this.enemyDead = false; // enemy dead initial state
    this.enemyDeadTime = 0; // enemy dead time default value
  }

  // draw function of the EnemyShip object
  draw(ctx) {
    // loading the enemy image
    this.enemyImage.onload = function () {
      enemyReady = true;
    };
    if (!this.enemyDead) {
      this.enemyImage.src = "enemyship.png";
    }
    if (enemyReady) {
      ctx.drawImage(this.enemyImage, this.x, this.y, 40, 40);
    }
  }

  // updating EnemyShip object
  update() {
    // enemies will first move to the left in a synchronized manner until they hit the required value
    if (this.leftMovement <= 60) {
      if (level === 2) {
        this.x -= 3;
        this.leftMovement += 3;
      } else {
        this.x--;
        this.leftMovement++;
      }
      // when enemies hit the required value they will start to move to the right
      if (this.leftMovement === 60) {
        this.rigthMovement = 0;
      }
    }
    // enemies will now move to the right in a synchronized manner until they hit the required value
    if (this.rigthMovement >= 0 && this.rigthMovement <= 60) {
      if (level === 2) {
        this.x += 3;
        this.rigthMovement += 3;
      } else {
        this.x++;
        this.rigthMovement++;
      }
      // when enemies hit the required value their movement will be switched to the left
      if (this.rigthMovement === 60) {
        this.leftMovement = 0;
      }
    }

    // detecting enemy collision
    if (userShoot === true) {
      var bulletIndex = 0;
      for (var i = 0; i < sprites.length; i++) {
        if (sprites[i].name === "user") {
          bulletIndex = i;
          this.collided = collision(this.x, this.y, 40, 40, sprites[bulletIndex].x, sprites[bulletIndex].y, 5, 25);
          if (this.collided === true) {
            explode.play();
            deletearray.push(sprites[i]);
            deletearray.push(this);
            Stages.enemyCount--;
            score++;
          }
        }
      }
    }
  }

  // enemy attacking
  shoot() {
    let bullet = new Bullet(this.x + 20, this.y + 25, "enemy");
    sprites.push(bullet);
  }
}

class Boss {

  /**
   * 
   * @param {*} x x position of the boss ship object
   * @param {*} y y position of the boss ship object
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.leftMovement = 0; // left movement of the enemy ship
    this.rigthMovement = -1; // right movement of the enemy ship
    this.collide = false; // collision state of the enemy ship
    this.bossImage = new Image(); // creating enemy image object
    this.bossDead = false; // enemy dead initial state
    this.name = "Boss";
  }

  // draw function of the boss object
  draw(ctx) {
    // loading the boss image
    this.bossImage.onload = function () {
      bossReady = true;
    };
    if (!this.enemyDead) {
      this.bossImage.src = "boss.png";
    }
    if (bossReady) {
      ctx.drawImage(this.bossImage, this.x, this.y, 150, 150);
    }
  }

  // updating boss ship object
  update() {
    // boss will first move to the left until it hits the required value
    if (this.leftMovement <= 80) {
      if (level === 2) {
        this.x -= 8;
        this.leftMovement += 2;
      } else {
        this.x -= 5;
        this.leftMovement++;
      }
      // when boss hits the required value it will start to move to the right
      if (this.leftMovement === 80) {
        this.rigthMovement = 0;
      }
    }
    // boss will now move to the right until it hits the required value
    if (this.rigthMovement >= 0 && this.rigthMovement <= 80) {
      if (level === 2) {
        this.x += 8;
        this.rigthMovement += 2;
      } else {
        this.x += 5;
        this.rigthMovement++;
      }
      // when boss hits the required value its movement will be switched to the left
      if (this.rigthMovement === 80) {
        this.leftMovement = 0;
      }
    }

    monsterShooting++;
    if (monsterShooting > 60) {
      this.shoot();
      monsterShooting = 0;
    }

    // detecting enemy collision
    if (userShoot === true) {
      var bulletIndex = 0;
      for (var i = 0; i < sprites.length; i++) {
        if (sprites[i].name === "user") {
          bulletIndex = i;
          this.collided = collision(this.x, this.y, 150, 150, sprites[bulletIndex].x, sprites[bulletIndex].y, 5, 25);
          if (this.collided === true) {
            explode.play();
            deletearray.push(sprites[i]);
            score += 5;
          }
        }
      }
    }
  }

  // enemy attacking
  shoot() {
    let bullet1 = new Bullet(this.x + 10, this.y + 150, "enemy");
    let bullet2 = new Bullet(this.x + 30, this.y + 150, "enemy");
    let bullet3 = new Bullet(this.x + 50, this.y + 150, "enemy");
    let bullet4 = new Bullet(this.x + 70, this.y + 150, "enemy");
    sprites.push(bullet1);
    sprites.push(bullet2);
    sprites.push(bullet3);
    sprites.push(bullet4);
  }
}

// Creating the user ship class
class Usership {

  /**
   * 
   * @param {*} x s position of the usership object
   * @param {*} y y position of the usership object
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 3; // life of the usership
    this.dead = false; // dead state of the usership
    this.deadtime = 0; // dead time of the usership
    this.userImage = new Image(); // creating the user ship image object
    this.life = 3; // default life of the usership
    this.laserTimer = 12; // timer used to seperate bullets shot by the user
  }

  // draw function of the UserShip class
  draw(ctx) {
    if (!this.dead) {
      this.userImage.src = "usership.png";
    }
    if (this.dead) {
      this.userImage.src = "usershipdamaged.png";
      this.deadtime++;
      if (this.deadtime === 40) {
        this.dead = false;
        this.deadtime = 0;
      }
    }

    // drawing the background
    if (backready) {
      ctx.drawImage(background, 0, 0, 800, 600);
    }

    this.userImage.onload = () => {
      this.userReady = true;
    }
    // drawing the user ship
    if (this.userReady) {
      ctx.drawImage(this.userImage, this.x, this.y, 40, 40);
    }

    // displaying the score and life
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("score: " + score, 750, 32);
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("life: ", 32, 32);
    ctx.fillText("Level " + level, 150, 32);

    // updating the user ship life
    if (this.life === 3) {
      ctx.drawImage(this.userImage, 72, 32, 20, 20);
      ctx.drawImage(this.userImage, 92, 32, 20, 20);
      ctx.drawImage(this.userImage, 112, 32, 20, 20);
    }
    else if (this.life === 2) {
      ctx.drawImage(this.userImage, 72, 32, 20, 20);
      ctx.drawImage(this.userImage, 92, 32, 20, 20);
    }
    else if (this.life === 1) {
      ctx.drawImage(this.userImage, 72, 32, 20, 20);
    }
  }

  // resetting the criterias of the usership
  reset(x, y) {
    this.dead = false;
    this.deadtime = 0;
    this.x = x;
    this.y = y;
    this.life = 3;
  }

  // update function of the usership object
  update() {

    // checking the user input and updating the user ship position
    if (37 in keysdown) {
      this.x = this.x - 5;
    }
    if (39 in keysdown) {
      this.x = this.x + 5;
    }
    if (32 in keysdown) {
      userShoot = true;
      let laser = new Bullet(this.x + 17, this.y - 15, "user");
      if (this.laserTimer === 12) {
        sprites.push(laser);
        delete keysdown[32];
        this.laserTimer = 0;
      }
      else {
        this.laserTimer++;
      }
    }

    // Keep the user inside the canvas
    if (this.x === 0) {
      this.x = 400;
    }
    if (this.x === 800) {
      this.x = 400;
    }
    if (this.x === 0) {
      this.x = 400;
    }

    // checking for collision
    if (enemyShoot === true) {
      var laserIndex = 0;
      for (var i = 0; i < sprites.length; i++) {
        if (sprites[i].name === "enemy") {
          laserIndex = i;
          this.collided = collision(this.x, this.y, 40, 40, sprites[laserIndex].x, sprites[laserIndex].y, 10, 10);
          if (this.collided === true) {
            collisionSound.play();
            this.dead = true;
            deletearray.push(sprites[i]);
            this.life--;
          }
        }
      }
    }
  }
}

// initializing stages 
var Stages = {
  initialState: false,
  enemyCount: 16,
  timeToShoot: 0,

  // Adding the enemies to the sprite array
  creatingEnemies: function () {
    if (this.initialState === false) {
      sprites.push(new EnemyShip(750, 70));
      sprites.push(new EnemyShip(650, 70));
      sprites.push(new EnemyShip(550, 70));
      sprites.push(new EnemyShip(450, 70));
      sprites.push(new EnemyShip(350, 70));
      sprites.push(new EnemyShip(350, 70));
      sprites.push(new EnemyShip(250, 70));
      sprites.push(new EnemyShip(150, 70));
      sprites.push(new EnemyShip(50, 70));
      sprites.push(new EnemyShip(700, 130));
      sprites.push(new EnemyShip(600, 130));
      sprites.push(new EnemyShip(500, 130));
      sprites.push(new EnemyShip(400, 130));
      sprites.push(new EnemyShip(300, 130));
      sprites.push(new EnemyShip(200, 130));
      sprites.push(new EnemyShip(100, 130));
      sprites.push(new Boss(500, 70));
      this.initialState = true;
    }
  },

  // updating the enemies
  update: function () {
    if (this.enemyCount > 0 && this.timeToShoot === 30) {
      enemyShoot = true;
      var shootingEnemy = Math.floor(Math.random() * this.enemyCount);
      sprites[shootingEnemy].shoot();
      this.timeToShoot = 0;
    }
    this.timeToShoot++;
  }
};

// resetting the game criterias
function gameReset() {
  sprites = [];
  deletearray = [];
  userShoot = false;
  enemyShoot = false;
  Stages.timeToShoot = 0;
  monsterShooting = 0;
  score = 0;
  Stages.initialState = false;
  user.reset(400, 550);
  Stages.creatingEnemies();
  Stages.enemyCount = 16;
  choice = false;
}

// creating usership object
let user = new Usership(400, 550);

// creating stages
Stages.creatingEnemies();

// main function of the game
var main = function () {

  // displaying menu
  menu();

  // checking if player chose his option
  if (choice === false) {

    // taking input from the mouse
    addEventListener("click", options, false);
  }

  // launching game
  if (choice === true) {

    // updating and drawing hero
    user.update();
    user.draw(ctx);

    if (user.life === 0) {
      lost.play();
      mainMenu.src = "lost.png";
      gameReset();
    }
    else if (score > 100 && level !== 2) {
      level++;
      victory.play();
      mainMenu.src = "won.png";
      gameReset();
    }
    else if (score > 100 && level === 2) {
      victory.play();
      mainMenu.src = "end.png";
      gameReset();
      menu();
      level = 1;
    }

    Stages.update(); // updating the stages of the game

    // updating and drawing sprites members
    for (var i = 0; i < sprites.length; i++) {
      if (sprites[i].name === "Boss" && Stages.enemyCount !== 0) {
        continue;
      }
      sprites[i].update();
      sprites[i].draw(ctx);
    }

    // removing unused sprites members
    for (var j = 0; j < deletearray.length; j++) {
      var indexof = sprites.indexOf(deletearray[j]);
      sprites.splice(indexof, 1);
    }

    // clearing the delete array
    deletearray = [];
  }

  // Game loop keeps repeating until the user chooses to end the game
  if (endGame != true) {
    requestAnimationFrame(main);
  }
};
requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
  || window.msRequestAnimationFrame || window.mozRequestAnimationFrame;
main();

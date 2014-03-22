/*  Space Amebas
 *
 *  The MIT License (MIT)
 *
 *  Copyright (c) 2009, 2014 Mika Rantanen
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

var SCREEN_WIDTH = 600;
var SCREEN_HEIGHT = 400;

var SHIP_SIZE;
var SHIP_ROTS = 16;
var SHIP_FRICTION = 0.99;
var SHIP_MAX_THRUST = 10;
var SHIP_THRUST = 0.4;
var SHIP_ROTATION_THRUST = 6;

var AMMO_SIZE;
var AMMO_TIME = 50;
var AMMO_THRUST = 14;
var AMMO_DELAY = 5;

var AMEBA1_SIZE;
var AMEBA2_SIZE;
var AMEBA3_SIZE;
var AMEBA_MAX_LEVEL = 3;
var AMEBA_SPLIT_COUNT = 4;
var AMEBA_ADDITIONAL_SPEED = 0.6
var AMEBA_MIN_SPEED = 1.6

var ship = null;
var ammoList = null;
var amebaList = null;

var spaceDown = false;
var ammoTimer = 0;


//////////////////////////////////////////////////////////////////////////////
// Ameba
//////////////////////////////////////////////////////////////////////////////
function Ameba(x, y, level) {
    this.next = null;

    this.level = level;
    if (level === 1) this.size = AMEBA1_SIZE;
    if (level === 2) this.size = AMEBA2_SIZE;
    if (level === 3) this.size = AMEBA3_SIZE;

    var additionalSpeed =
        -(level - AMEBA_MAX_LEVEL - 1) * AMEBA_ADDITIONAL_SPEED;
    this.velX = (Math.random() * additionalSpeed + AMEBA_MIN_SPEED) *
        (Math.random() < 0.5 ? -1 : 1);
    this.velY = (Math.random() * additionalSpeed + AMEBA_MIN_SPEED) *
        (Math.random() < 0.5 ? -1 : 1);

    this.x = x - this.size + Math.random() * this.size;
    this.y = y - this.size + Math.random() * this.size;

    this.frame = Math.ceil(Math.random() * 10);

    this.img = document.createElement("img");
    this.img.style.position = "absolute";
    this.img.style.left = Math.round(this.x) + "px";
    this.img.style.top = Math.round(this.y) + "px";
    this.img.src = "ameba" + this.level + "_" + this.level + ".png";
    document.getElementById("game").appendChild(this.img);
}

Ameba.prototype.move = function() {
    this.frame += 0.5;
    if (this.frame >= 19) this.frame = 1;

    this.x += this.velX;
    this.y += this.velY;

    if (this.x > SCREEN_WIDTH) this.x = -AMEBA3_SIZE;
    if (this.x < -AMEBA3_SIZE) this.x = SCREEN_WIDTH;
    if (this.y > SCREEN_HEIGHT) this.y = -AMEBA3_SIZE;
    if (this.y < -AMEBA3_SIZE) this.y = SCREEN_HEIGHT;

    if (this.img !== null) {
        this.img.style.left = Math.round(this.x) + "px";
        this.img.style.top = Math.round(this.y) + "px";
        this.img.src = "ameba" + this.level + "_" +
            (1 + Math.abs(10 - Math.floor(this.frame))) + ".png";
    }
}

Ameba.prototype.split = function() {
    --this.level;
}

Ameba.prototype.remove = function() {
    if (this.img !== null) {
        document.getElementById("game").removeChild(this.img);
        this.img = null;
    }
}


//////////////////////////////////////////////////////////////////////////////
// Ammo
//////////////////////////////////////////////////////////////////////////////
function Ammo(x, y, dirX, dirY) {
    this.next = null;

    this.x = x;
    this.y = y;
    this.velX = dirX * AMMO_THRUST;
    this.velY = dirY * AMMO_THRUST;
    this.time = AMMO_TIME;

    this.img = document.createElement("img");
    this.img.style.position = "absolute";
    this.img.style.left = Math.round(this.x) + "px";
    this.img.style.top = Math.round(this.y) + "px";
    this.img.src = "ammo.png";
    document.getElementById("game").appendChild(this.img);
}

Ammo.prototype.move = function() {
    this.x += this.velX;
    this.y += this.velY;

    if (this.x > SCREEN_WIDTH) this.x = -AMEBA3_SIZE;
    if (this.x < -AMEBA3_SIZE) this.x = SCREEN_WIDTH;
    if (this.y > SCREEN_HEIGHT) this.y = -AMEBA3_SIZE;
    if (this.y < -AMEBA3_SIZE) this.y = SCREEN_HEIGHT;

    --this.time;

    if (this.img !== null) {
        this.img.style.left = Math.round(this.x) + "px";
        this.img.style.top = Math.round(this.y) + "px";
    }
}

Ammo.prototype.remove = function() {
    if (this.img !== null) {
        document.getElementById("game").removeChild(this.img);
        this.img = null;
    }
}


//////////////////////////////////////////////////////////////////////////////
// Ship
//////////////////////////////////////////////////////////////////////////////
function Ship() {
    this.rotation = 90;
    this.x = SCREEN_WIDTH / 2 - SHIP_SIZE / 2;
    this.y = SCREEN_HEIGHT / 2 - SHIP_SIZE / 2;
    this.velX = 0;
    this.velY = 0;
    this.thrust = 0;
    this.rotationThrust = 0;

    this.img = document.createElement("img");
    this.img.src = "ship5.png";
    this.img.style.position = "absolute";
    this.img.style.left = Math.round(this.x) + "px";
    this.img.style.top = Math.round(this.y) + "px";
    document.getElementById("game").appendChild(this.img);
}

Ship.prototype.move = function() {
    this.rotation += this.rotationThrust;
    if (this.rotation < 0) this.rotation = 359 + this.rotation;
    if (this.rotation > 359) this.rotation = this.rotation - 359;

    var currentShip = Math.floor(this.rotation / (360 / SHIP_ROTS));
    var dx = Math.cos(currentShip * (Math.PI * 2 / SHIP_ROTS));
    var dy = -Math.sin(currentShip * (Math.PI * 2 / SHIP_ROTS));

    this.velX += dx * this.thrust;
    this.velY += dy * this.thrust;

    var d = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
    if (d > SHIP_MAX_THRUST) {
        this.velX /= d;
        this.velY /= d;
        this.velX *= SHIP_MAX_THRUST;
        this.velY *= SHIP_MAX_THRUST;
    }

    this.x += this.velX;
    this.y += this.velY;

    this.velX *= SHIP_FRICTION;
    this.velY *= SHIP_FRICTION;

    if (this.x > SCREEN_WIDTH) this.x = -AMEBA3_SIZE;
    if (this.x < -AMEBA3_SIZE) this.x = SCREEN_WIDTH;
    if (this.y > SCREEN_HEIGHT) this.y = -AMEBA3_SIZE;
    if (this.y < -AMEBA3_SIZE) this.y = SCREEN_HEIGHT;

    this.img.src = "ship" + (currentShip + 1) + ".png";
    this.img.style.left = Math.round(this.x) + "px";
    this.img.style.top = Math.round(this.y) + "px";
}


//////////////////////////////////////////////////////////////////////////////
function update() {
    // Move the ship
    ship.move();

    // Move the amebas
    var currentAmeba = amebaList;
    while (currentAmeba !== null) {
        currentAmeba.move();
        currentAmeba = currentAmeba.next;
    }

    // Move the ammunitions
    ++ammoTimer;
    var previousAmmo = null;
    var currentAmmo = ammoList;
    while (currentAmmo !== null) {
        currentAmmo.move();

        // Go through all amebas and check for collisions
        var newAmebaList = null;
        var previousAmeba = null;
        currentAmeba = amebaList;
        while (currentAmeba !== null) {
            var amebaCenterX = currentAmeba.x + currentAmeba.size / 2;
            var amebaCenterY = currentAmeba.y + currentAmeba.size / 2;
            var ammoCenterX = currentAmmo.x + AMMO_SIZE / 2;
            var ammoCenterY = currentAmmo.y + AMMO_SIZE / 2;
            var dx = amebaCenterX - ammoCenterX;
            var dy = amebaCenterY - ammoCenterY;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= currentAmeba.size / 2) { // Collision
                currentAmmo.time = -1;

                if (currentAmeba.level > 1) {
                    // Split the ameba into smaller amebas
                    for (var i = 0; i < AMEBA_SPLIT_COUNT; ++i) {
                        var tempList = newAmebaList;
                        newAmebaList = new Ameba(amebaCenterX, amebaCenterY,
                                                 currentAmeba.level - 1);
                        newAmebaList.next = tempList;
                    }
                }

                // Remove the current ameba
                if (previousAmeba === null) {
                    amebaList = currentAmeba.next;
                }
                else {
                    previousAmeba.next = currentAmeba.next;
                }
                currentAmeba.remove();
                currentAmeba = currentAmeba.next;
            }
            else { // No collision
                previousAmeba = currentAmeba;
                currentAmeba = currentAmeba.next;
            }
        }

        if (newAmebaList !== null) {
            if (previousAmeba === null) {
                amebaList = newAmebaList;
            }
            else {
                previousAmeba.next = newAmebaList;
            }
        }

        if (currentAmmo.time < 0) {
            if (previousAmmo === null) {
                ammoList = currentAmmo.next;
            }
            else {
                previousAmmo.next = currentAmmo.next;
            }
            currentAmmo.remove();
        }
        previousAmmo = currentAmmo;
        currentAmmo = currentAmmo.next;
    }
}

function keydown(e) {
    var evt = e || window.event;
    var k = evt.keyCode;

    if (k === 38 || k === 87 || k === 73) { // Up, w, i
        ship.thrust = SHIP_THRUST;
    }
    else if (k === 37 || k === 65 || k === 74) { // Left, a, j
        ship.rotationThrust = SHIP_ROTATION_THRUST;
    }
    else if (k === 39 || k === 68 || k === 76) { // Right, d, l
        ship.rotationThrust = -SHIP_ROTATION_THRUST;
    }
    else if (k === 32 || k === 90 || k === 77) { // Space, z, m
        if (!spaceDown && ammoTimer > AMMO_DELAY) {
            var currentShip = Math.floor(ship.rotation / (360 / SHIP_ROTS));
            var dirX = Math.cos(currentShip * (Math.PI * 2 / SHIP_ROTS));
            var dirY = -Math.sin(currentShip * (Math.PI * 2 / SHIP_ROTS));

            var ammoX =
                ship.x + SHIP_SIZE / 2 - AMMO_SIZE / 2 + dirX * SHIP_SIZE / 2;
            var ammoY =
                ship.y + SHIP_SIZE / 2 - AMMO_SIZE / 2 + dirY * SHIP_SIZE / 2;

            if (ammoList === null) {
                ammoList = new Ammo(ammoX, ammoY, dirX, dirY);
            }
            else {
                var currentFirstAmmo = ammoList;
                ammoList = new Ammo(ammoX, ammoY, dirX, dirY);
                ammoList.next = currentFirstAmmo;
            }
            ammoTimer = 0;
        }

        spaceDown = true;
    }

    var arrowKeyOrSpace =
        k === 32 || k === 37 || k === 38 || k === 39 || k === 40;
    return !arrowKeyOrSpace;
}

function keyup(e) {
    var evt = e || window.event;
    var k = evt.keyCode;

    if (k === 38 || k === 87 || k === 73) { // Up, w, i
        ship.thrust = 0;
    }
    else if (k === 37 || k === 65 || k === 74) { // Left, a, j
        ship.rotationThrust = 0;
    }
    else if (k === 39 || k === 68 || k === 76) { // Right, d, l
        ship.rotationThrust = 0;
    }
    else if (k === 32 || k === 90 || k === 77) { // Space, z, m
        spaceDown = false;
    }

    var arrowKeyOrSpace =
        k === 32 || k === 37 || k === 38 || k === 39 || k === 40;
    return !arrowKeyOrSpace;
}



var preload = [];
for (var i = 0; i < 16 + 10 + 10 + 10 + 2; ++i) preload.push(new Image());
for (var i = 1; i <= 16; ++i) preload[i - 1].src = "ship" + i + ".png";
for (var i = 1; i <= 10; ++i) preload[16 + i - 1].src = "ameba1_" + i + ".png";
for (var i = 1; i <= 10; ++i) preload[26 + i - 1].src = "ameba2_" + i + ".png";
for (var i = 1; i <= 10; ++i) preload[36 + i - 1].src = "ameba3_" + i + ".png";
preload[46].src = "ammo.png";
preload[47].src = "background.jpg";

function init() {
    ship = new Ship();

    var w = SCREEN_WIDTH / 6;
    var h = SCREEN_HEIGHT / 5;
    amebaList =
        new Ameba(w, h, AMEBA_MAX_LEVEL);
    amebaList.next =
        new Ameba(w * 3, h, AMEBA_MAX_LEVEL);
    amebaList.next.next =
        new Ameba(w * 5, h, AMEBA_MAX_LEVEL);
    amebaList.next.next.next =
        new Ameba(w, h * 4, AMEBA_MAX_LEVEL);
    amebaList.next.next.next.next =
        new Ameba(w * 3, h * 4, AMEBA_MAX_LEVEL);
    amebaList.next.next.next.next.next =
        new Ameba(w * 5, h * 4, AMEBA_MAX_LEVEL);

    document.onkeydown = keydown;
    document.onkeyup = keyup;
    setInterval(update, 20);
}

window.onload = function() {
    SHIP_SIZE = preload[0].width;
    AMEBA1_SIZE = preload[16].width;
    AMEBA2_SIZE = preload[26].width;
    AMEBA3_SIZE = preload[36].width;
    AMMO_SIZE = preload[46].width;

    init();
}

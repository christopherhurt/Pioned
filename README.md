# Pioned

Project for CS 4644 Creative Computing Capstone.

## Credits

Forked from Mozilla's [starting code](https://github.com/mozdevs/gamedev-js-tiles).

Tilemap graphics and sprites created by [Onimaru](https://onimaru.itch.io/green-valley-map-pack).

Favicon created with [favicon.io](https://favicon.io/).

## Getting started

> Install yarn [here](https://yarnpkg.com/en/docs/install).

First run `yarn` to install dependencies.

Use `yarn client` to start the development server. It will be running at [localhost:8080](http://localhost:8080/).

To run the game server (for development), use `yarn server`.

To do both at once, use `yarn start`. *(Recommended)*

## Running in Production

To create a build, run `yarn build`.

To run the game server, use `yarn serve`.

## This Week

**Parker**:

**Jack**:

**Chris**:

## Todo
- [ ] Objective Tracking 
- [ ] Get favicon working on server
- [ ] Cap on total number of trees for spawn trees
- [ ] Chat log (enter reveals previous messages, up to some limit)
- [ ] Fix collision detection bug when zoomed really far out

## Ideas
- [ ] Nighttime/daytime
- [ ] Objective completion rewards
    - [ ] Fireworks
- [ ] Use cookies to save player state to prevent constant refresh for new character
- [ ] Objectives:
    - [ ] Pyromaniac: burn bridges
    - [ ] Don't allow anyone to visit your home island
    - [ ] Give another player a flower
- [ ] Display chat messages above player who sent it (if visible)
- [ ] More world events
    - [ ] Volcanic eruption rains fire and takes out bridges

## Completed Tasks
- [x] Add movable player
    - [x] Fix camera movement with respect to player
- [x] Render all characters in the game
- [x] Deploy real server to test on multiple machines
- [x] Store the map server-side and allow players to edit the map
- [x] Built-in chat
    - [x] Also can print info and error messages here (e.g., player joined, disconnected from server)
- [x] Map mutability
- [x] Map generation
- [x] Better aesthetics
    - [x] Find character images.
    - [x] Add direction and walking animations
- [x] Make game canvas entire window dimensions, add resive event listener, overlay chat
- [x] Server: Track the discreet islands
- [x] Server: Decide where players start (balance on islands)
- [x] Track which islands player has visited (for potential objective; e.g., player needs to build a bridge to new island, travel to 4 islands, etc)
- [x] Inventory
- [x] Destroy trees to get wood
- [x] Be able to place bridges
- [x] Draw outline around square that will be changed
- [x] Collision detection (including trees)
- [x] Player chat system
- [x] Performance: only draw visible characters
- [x] Performance: only redraw map if parts of the visible map changed (socket messages)
- [x] Show what is currently selected in the inventory
- [x] Enter to select item in inventory
- [x] Fix removing wood on top of water bug
- [x] Spawn trees at certain time intervals
- [x] Add Objective System
    - [x] Create at least 3 different unique objectives
        - [x] Visit randomly numbered Island
        - [x] Visit 3 different Islands
        - [x] Come into contact with n other players
            - [x] Implement Player Collision
- [x] Fix player spawning on single or few blocks
- [x] Draw current objective above selected item (just name)

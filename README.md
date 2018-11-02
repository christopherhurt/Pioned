# Pioned

Project for CS 4644 Creative Computing Capstone.

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
- [ ] Collision detection (including trees)

**Jack**:
- [x] Inventory
- [x] Destroy trees to get wood
- [x] Be able to place bridges
- [x] Draw outline around square that will be changed

**Chris**:
- [ ] Server: Track the discreet islands
- [ ] Server: Decide where players start (balance on islands)
- [ ] Track which islands player has visited (for potential objective; e.g., player needs to build a bridge to new island, travel to 4 islands, etc)

## Todo

- [ ] Performance: only draw visible characters
- [ ] Performance: only redraw map if parts of the visible map changed (socket messages)
- [ ] Use environment variables to set the (websocket) host
- [ ] Add current random color mask on top of players

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

## Credits

Forked from Mozilla's [starting code](https://github.com/mozdevs/gamedev-js-tiles).

Tilemap created by [Onimaru](https://onimaru.itch.io/green-valley-map-pack).

Favicon created with [favicon.io](https://favicon.io/).

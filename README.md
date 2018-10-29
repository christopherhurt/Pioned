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

Jack:
- [x] Map mutability

Chris:
- [x] Map generation

Parker:
- [ ] Collision detection

## Todo

- [ ] Server decides where players start (balance on islands)
- [ ] Performance: only draw visible characters
- [ ] Use environment variables to set the (websocket) host
- [ ] Better aesthetics
    - [ ] Find character images.
    - [ ] Add direction and walking animations

## Completed Tasks
- [x] Add movable player
    - [x] Fix camera movement with respect to player
- [x] Render all characters in the game
- [x] Deploy real server to test on multiple machines
- [x] Store the map server-side and allow players to edit the map
- [x] Built-in chat
    - [x] Also can print info and error messages here (e.g., player joined, disconnected from server)

## Credits

Forked from Mozilla's [starting code](https://github.com/mozdevs/gamedev-js-tiles).

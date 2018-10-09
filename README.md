# AmbiguousGame

Project for CS 4644 Creative Computing Capstone.

## Getting started

> Install yarn [here](https://yarnpkg.com/en/docs/install).

First run `yarn` to install dependencies.

Use `yarn dev` to start the development server. It will be running at [localhost:8080](http://localhost:8080/).

To run the game server, use `yarn server`.

To do both at once, use `yarn start`.

To create a build, run `yarn build`.

## Todo

- [x] Add movable player
    - [x] Fix camera movement with respect to player
- [x] Communication between server and client(s) 
    - [x] Render all characters in the game
    - [ ] Performance: only draw visible characters
- [ ] Deploy real server to test on multiple machines

## Ideas

- [ ] Store the map server-side and allow players to edit the map
- [ ] Built-in chat
    - [ ] Also can print info and error messages here (e.g., player joined, disconnected from server)
- [ ] Better aesthetics
    - [ ] Find a larger tilemap image with more tiles.
    - [ ] Find better character images.
    - [ ] Add direction and walking animations

## Credits

Forked from Mozilla's [starting code](https://github.com/mozdevs/gamedev-js-tiles).

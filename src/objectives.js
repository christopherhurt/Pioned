/*
  Objectives manager for Pioned, includes generating new objectives and checking objectives for completion
*/
import { TILES, DROPS } from './tiles';
import { send } from './utils';

const NUM_OBJECTIVES = 3;

// Identifier for determining if player's objective is complete
export const OBJECTIVE_COMPLETE = -1;

// Objective types
const VISIT_RANDOM_ISLAND = 0;
const VISIT_N_ISLANDS = 1;
const CONTACT_N_PLAYERS = 2;

// List of all (uncompleted) objective IDs
const uncompletedObjectives = [];
for (let i = 0; i < NUM_OBJECTIVES; i++) {
  uncompletedObjectives.push(i);
}

const NUM_ISLANDS = 5; // Number of islands a player must visit for VISIT_N_ISLANDS objective
const NUM_PLAYERS = 2; // Number of other players a player must contact for CONTACT_N_PLAYERS objective

/* Randomly generates an objective to be completed by a player */
export function generateObjective(player, map) {
  let id;
  if (uncompletedObjectives.length == 0) {
    id = OBJECTIVE_COMPLETE;
  } else {
    // Getting objective ID from remaining uncompleted objectives
    const index = Math.random() * uncompletedObjectives.length | 0;
    id = uncompletedObjectives.splice(index, 1)[0];
  }

  // Getting objective data (where applicable)
  let data;
  switch(id) {
    case VISIT_RANDOM_ISLAND:
      // Generate random id of the island that the player needs to visit
      const numIslands = map.numIslands;
      while((data = parseInt(Math.random() * numIslands + 1)) == player.getCurrentIsland(map));
      break;
    default:
      break;
  }

  player.objectiveId = id;
  player.objectiveData = data;
}

/* Gets displayable name of specified objective */
export function getObjectiveName(player) {
  switch(player.objectiveId) {
    case OBJECTIVE_COMPLETE:
      return 'All Complete';
    case VISIT_RANDOM_ISLAND:
      return 'The Wanderer';
    case VISIT_N_ISLANDS:
      return 'Mr. Worldwide';
    case CONTACT_N_PLAYERS:
      return 'Social Butterfly';
    default:
      throw 'Invalid objective ID when getting objective name';
  }
}

/* Gets textual description of specified objective */
export function getObjectiveDescription(player) {
  switch(player.objectiveId) {
    case OBJECTIVE_COMPLETE:
      return 'Good job!';
    case VISIT_RANDOM_ISLAND:
      return `Find and visit island ${player.objectiveData}`;
    case VISIT_N_ISLANDS:
      return `Visit new islands (${player.contactedPlayers.length}/${NUM_ISLANDS})`;
    case CONTACT_N_PLAYERS:
      return `Contact other players (${player.contactedPlayers.length}/${NUM_PLAYERS})`;
    default:
      throw 'Invalid objective ID when getting objective description';
  }
}

/* Check if a given objective has been completed by the player */
export function checkObjectiveComplete(player) {
  switch(player.objectiveId) {
    case OBJECTIVE_COMPLETE:
      // Check if player has already completed their objective(s)
      return false;
    case VISIT_RANDOM_ISLAND:
      // Check if player has visited the island
      const island = player.objectiveData;
      return player.visitedIslands.includes(island);
    case VISIT_N_ISLANDS:
      // Check if player has visited n islands
      return player.visitedIslands.length == NUM_ISLANDS;
    case CONTACT_N_PLAYERS:
      // Check if player has contacted n other players
      return player.contactedPlayers.length == NUM_PLAYERS;
    default:
      throw 'Invalid objective ID when checking objective completeness';
  }
}

export function giveObjectiveReward(game) {
  switch(game.player.objectiveId) {
    case VISIT_RANDOM_ISLAND:
      game.player.giveSpeedBonus(20);
      return 'Gain +20 speed.';
    case VISIT_N_ISLANDS:
      DROPS[TILES['tree_bottom']] = ['wood', 2];
      DROPS[TILES['apple_tree_bottom']] = ['wood', 2];
      return '+1 wood drops from trees.';
    case CONTACT_N_PLAYERS:
      const pet = 'butterfly';
      game.player.pet = pet;
      send(game.socket, 'playerPet', { pet });
      game.playersMoved = true;
      return 'A new companion joins you.';
    default:
      throw 'Invalid objective ID when giving objective reward';
  }
}

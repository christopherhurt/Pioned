/*
  Objectives manager for Pioned, includes generating new objectives and checking objectives for completion
*/

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
  if (uncompletedObjectives.length == 0) {
    return null;
  }

  // Getting objective ID from remaining uncompleted objectives
  const index = Math.random() * uncompletedObjectives.length | 0;
  const id = uncompletedObjectives.splice(index, 1)[0];

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

  return { 'id': id, 'data': data };
}

/* Gets displayable name of specified objective */
export function getObjectiveName(id) {
  switch(id) {
    case OBJECTIVE_COMPLETE:
      return 'Complete!';
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
export function getObjectiveDescription(id, data, player) {
  switch(id) {
    case OBJECTIVE_COMPLETE:
      return 'All objectives completed';
    case VISIT_RANDOM_ISLAND:
      return `Find and visit island ${data}`;
    case VISIT_N_ISLANDS:
      return `Visit different islands (${player.contactedPlayers.length}/${NUM_ISLANDS})`;
    case CONTACT_N_PLAYERS:
      return `Come into contact with other players (${player.contactedPlayers.length}/${NUM_PLAYERS})`;
    default:
      throw 'Invalid objective ID when getting objective description';
  }
}

/* Check if a given objective has been completed by the player */
export function checkObjectiveComplete(id, data, player) {
  switch(id) {
    case OBJECTIVE_COMPLETE:
      // Check if player has already completed their objective(s)
      return false;
    case VISIT_RANDOM_ISLAND:
      // Check if player has visited the island
      const island = data;
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


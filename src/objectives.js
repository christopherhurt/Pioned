const NUM_OBJECTIVES = 3;

export const VISIT_RANDOM_ISLAND = 0;
export const VISIT_N_ISLANDS = 1;
export const CONTACT_N_PLAYERS = 2;

/* Randomly generates an objective to be completed by a player */
export function generateObjective() {
  const id = parseInt(Math.random() * NUM_OBJECTIVES);
  let data;
  
  switch(id) {
    case VISIT_RANDOM_ISLAND:
      // Set data to random island number
      break;
    case VISIT_N_ISLANDS:
      // Set data to number of island to visit
      break;
    case CONTACT_N_PLAYERS:
      // Set data to number of players to contact
      break;
    default:
      throw 'Invalid objective ID when generating objective';
  }
}

/* Check if a given objective has been completed by the player */
export function checkObjectiveComplete(id, data, player) {
  switch(id) {
    case VISIT_RANDOM_ISLAND:
      // Check if player has visited the island
      break;
    case VISIT_N_ISLANDS:
      // Check if player has visited n islands
      break;
    case CONTACT_N_PLAYERS:
      // Check if player has contacted n other players
      break;
    default:
      throw 'Invalid objective ID when checking if objective is complete';
  }
}

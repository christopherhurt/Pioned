# Build and launch Pioned server on Linux

git fetch --all
git reset --hard origin/master
rm src/game.js.bak
yarn
yarn build
yarn serve

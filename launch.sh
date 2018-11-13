# Build and launch Pioned server on Linux

host="chrishurt.us"

git fetch --all
git reset --hard origin/master
sed -i.bak "s/localhost:5000/${host}:5000/g" src/game.js
rm src/game.js.bak
yarn
yarn build
yarn serve

# Build and launch Pioned server on Linux

host="chrishurt.us"

git pull
sed -i.bak "s/localhost:5000/${host}:5000/g" src/game.js
rm src/game.js.bak
yarn
yarn build
ln -s ./build/favicon.ico .
yarn serve

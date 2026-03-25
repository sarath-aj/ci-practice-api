// server.js is the entrypoint — it imports app and calls listen().
// Keeping this separate from app.js means tests import app.js
// directly without ever binding a port.
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

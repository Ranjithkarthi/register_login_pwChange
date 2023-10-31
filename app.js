const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");

let db = null;

//initializing DataBase

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    consloe.log(`Db Error:${e.message}`);
  }
};

initializeDbAndServer();

//API 1 Register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const dbQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(dbQuery);
  if (dbResponse === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertDbQuery = `INSERT INTO user(username, name, password, gender, location)
            VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      await db.run(insertDbQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else if (dbResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 LogIn
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUsername = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(checkUsername);
  if (dbResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//API 3 Changing Password
app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const dbQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbResponse = await db.get(dbQuery);

    if (dbResponse !== undefined) {
      const isPasswordMatched = await bcrypt.compare(
        oldPassword,
        dbResponse.password
      );
      if (isPasswordMatched === true) {
        if (newPassword.length > 5) {
          const changePassword = await bcrypt.hash(newPassword, 10);
          const updatePasswordQuery = `UPDATE user SET password = '${changePassword}' WHERE username = '${username}';`;
          await db.run(updatePasswordQuery);
          response.status(200);
          response.send("Password updated");
        } else {
          response.status(400);
          response.send("Password is too short");
        }
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
});

module.exports = app;

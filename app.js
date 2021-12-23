const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(1026, () =>
      console.log("Server Running at http://localhost:1026/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusPriority = (requestQuery) => {
  return requestQuery.status !== undefined;
};

let data = null;

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", status, priority, category } = request.query;

  switch (true) {
    case hasStatusPriority(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}% AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
  data = await db.get(getTodoQuery);
  response.send(data);
});

// API 3

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  const newDate = format(
    new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()),
    "yyyy-MM-dd"
  );
  const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
  data = await db.all(getTodoQuery);
  response.send(data);
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES ('${id}','${todo}','${priority}','${status}','${category}','${dueDate}');`;
  data = await db.run(postQuery);
  response.send("Todo Successfully Added");
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const updateTodoQuery = `UPDATE todo SET status = '${status}', priority = '${priority}', todo = '${todo}', category = '${category}', due_date = '${dueDate}';`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

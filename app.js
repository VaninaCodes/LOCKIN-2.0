import express from "express";
import cors from "cors";
import { startDB } from "./src/config/database.js";
import { userRouter } from "./src/routes/user.routes.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);

app.listen(PORT, async() => {
    await startDB();
    console.log(`Servidor corriendo en ${PORT}`);
})
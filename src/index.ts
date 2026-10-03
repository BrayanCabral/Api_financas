import express from "express";
import categoriesRouter from "./routes/categories";
import transactionsRouter from "./routes/transactions";
import authRouter from "./routes/auth";
import { errorHandler } from "./errorHandler";

const app = express();
const port = 4001;

app.use(express.json());
app.use("/categories", categoriesRouter);
app.use("/transactions", transactionsRouter);
app.use("/auth", authRouter);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

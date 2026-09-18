import express from "express";
import categoriesRouter from "./routes/categories";
import transactionsRouter from "./routes/transactions";

const app = express();
const port = 4001;

app.use(express.json());
app.use("/categories", categoriesRouter);
app.use("/transactions", transactionsRouter);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

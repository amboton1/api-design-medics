import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { router } from "./router.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);
app.use(errorHandler);

export { app };
export default app;

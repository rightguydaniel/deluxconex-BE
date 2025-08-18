import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { HttpError } from "http-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import { json, text, urlencoded } from "body-parser";
import { database } from "./configs/database/database";
import indexRoutes from "./routes/indexRoutes";

const app = express();

dotenv.config();
app.use(json());
app.use(text());
app.use(urlencoded({ extended: true }));

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use("/v1", indexRoutes);
app.get("/", (request: Request, response: Response) => {
  response.redirect("/v1");
});

//add a logo with name favicon.ico to public folder and uncomment the line below to serve favicon
// app.use(serveFavicon(path.join(__dirname, "../public", "favicon.ico")));

database
  .sync({})
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err: HttpError) => {
    console.log(err);
  });

app.listen(process.env.PORT, () => {
  console.log(`server running on ${process.env.PORT}`);
});

export default app;
